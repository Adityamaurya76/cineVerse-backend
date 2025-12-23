import { User} from '../models/user.models.js';
import {ApiResponse} from '../utils/api-response.js'
import {ApiError} from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'
import { emailVerificationMailgenContent, forgotPasswordMailgenContent, sendEmail } from '../utils/mail.js';
import jwt from 'jsonwebtoken';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';


const generateAccessAndRefreshToken = async (userId) =>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while generating access token');
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { username, fullName, password, email, role } = req.body;

    const existingUser = await User.findOne({
        $or: [{ email }, { username }] 
    });

    if(existingUser) {
        throw new ApiError(400, 'User with email or username already exists', []);
    }

    let avatarData = {
        url: "https://placehold.co/200x200",
        localPath: "",
    };
   
    if(req.file) {
      const cloudImg = await cloudinary.uploader.upload(req.file.path, {
        folder:"avatars",
      });

      avatarData = {
        url: cloudImg.secure_url,
        localPath: cloudImg.public_id
      }
    }

    const user = new User({username, fullName, password, email, role, avatar: avatarData})
    const {unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await  user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
        ),
    })

    const createUser = await User.findById(user._id).select( "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",);

    if(!createUser) {
        throw new ApiError(500, "Something went wrong while registering a user");
    }

    return res.status(201).json(new ApiResponse(200,{user: createUser}, "User registered successfully and verification email has been sent on your email",));
});

const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if(!email){
    throw new ApiError(400, "email is required");
  }

  const user = await User.findOne({ email });

  if(!user) {
    throw new ApiError(400, "User does not exists");
  }
 
  const isPasswordvalid = await user.isPasswordCorrect(password);

  if(!isPasswordvalid){
    throw new ApiError(400, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id,);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  )

  const options = {
    htthOnly: true,
    secure: true,
  }

  return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {user:loggedInUser, accessToken, refreshToken}, "User loggedin Successfully"))
})

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) throw new ApiError(400, "Email is required");

  const admin = await User.findOne({ email, role: "admin" });
  if (!admin) throw new ApiError(403, "Access denied! Admin not found or invalid credentials");

  const isPasswordValid = await admin.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(400, "Invalid credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(admin._id);

  const adminData = await User.findById(admin._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, { admin: adminData, accessToken, refreshToken }, "Admin logged in successfully"));
});

const logout = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user?._id, { $set: { refreshToken: "" } }, { new: true });

    const options = {
      httpOnly: true,
      secure: true
    };

    res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User Logged Out"));  
  } catch (error) {
     console.error("Logout Error:", error);
    throw new ApiError(500, "Something went wrong");
  }
});

export { registerUser, userLogin, adminLogin, logout}