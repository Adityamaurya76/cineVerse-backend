import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.models.js";
import cloudinary from "../config/cloudinary.js";

const userList = asyncHandler(async (req, res) => {
    try{
        const users =  await User.find().select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry").sort({ createdAt: -1});

        if(!users) {

           return res.status(404).json(new ApiResponse(404, null, "Users not found"));
        }

       return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));

    } catch (error) {
       throw new ApiError(500, 'Error while fetching Users', error);
    }
});

const userCreate = asyncHandler(async (req, res) => {
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
  
    const user = await User.create({username, fullName, password, email, role, avatar: avatarData})
   
    return res.status(201).json(new ApiResponse(200, user, "User Created successfully"));
});

const userDetials = asyncHandler(async (req, res) => {
   try{
        const user = await User.findById(req.params.id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");
    
        if(!user) {
            return res.status(404).json(new ApiResponse(404, null, "User not found")); 
        }

        // Fetch active subscription for this user
        const { Subscription } = await import("../models/subscription.model.js");
        const subscription = await Subscription.findOne({ user: user._id, status: "active" })
          .populate("plan", "name price durationInDays billingCycle description")
          .sort({ createdAt: -1 })
          .lean();

        // Convert user to plain object and add subscription
        const userObject = user.toObject();
        userObject.subscription = subscription || null;

       return res.status(200).json(new ApiResponse(200, userObject, "Users fetched successfully"));
   } catch (error) {
       throw new ApiError(500, 'Error while fetching Users', error);
    }   
})

const updateUser = asyncHandler(async(req, res) => {
    try{
        const { username, fullName, email } = req.body;
        const user = await User.findById(req.params.id);

        if(!user) {
           return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

        if(username) user.username = username;
        if(fullName) user.fullName = fullName;
        if(email) user.email = email;

        if(req.file) {
            
            if(user.avatar?.localPath) {
                await cloudinary.uploader.destroy(user.avatar.localPath);
            }
            
            const cloudImg = await cloudinary.uploader.upload(req.file.path, {
                folder:"avatars",
            });

           user.avatar = {
                url: cloudImg.secure_url,
                localPath: cloudImg.public_id,
            }
        }
       
        await user.save();

        return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
    } catch (error) {
        throw new ApiError(500, 'Error while updating category', error);
    } 
})

const deleteUser = asyncHandler(async (req, res) => {
    try{
        const user = await User.findById(req.params.id);
        
        if(!user){
            return res.status(404).json(new ApiResponse(200, "User not found"));
        }
        
        if (user.avatar?.localPath){
            await cloudinary.uploader.destroy(user.avatar.localPath);
        }

        await User.findByIdAndDelete(req.params.id);

        return res.status(200).json(new ApiResponse(200, user, "User deleted successfully"));
        
    } catch (error) {
        throw new ApiError(500, 'Error while updating category', error);
    }
})

export { userList, userDetials, userCreate, updateUser, deleteUser};