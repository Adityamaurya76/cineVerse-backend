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

const userDetials = asyncHandler(async (req, res) => {
   try{
        const user = await User.findById(req.params.id).populate();
    
        if(!user) {
            return res.status(404).json(new ApiResponse(404, null, "User not found")); 
        }

       return res.status(200).json(new ApiResponse(200, user, "Users fetched successfully"));
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

        if(username) User.username = username;
        if(fullName) User.fullName = fullName;
        if(email) User.email = email;

        if(req.file) {
            
            if(User.avatar?.localPath) {
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

export { userList, userDetials, updateUser, deleteUser};