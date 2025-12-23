import { User} from '../models/user.models.js';
import {ApiResponse} from '../utils/api-response.js'
import {ApiError} from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'
import { Category} from '../models/category.model.js';
import { Video } from '../models/video.models.js';
import { WatchHistory } from '../models/watchHistory.model.js';
 
const list = asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if(!userId) {
      throw new ApiError(400, "User ID is required");  
    }

    const user = await User.findById(userId);
    if(!user) {
        throw new ApiError(404, "User not Fount");
    }
   
    const categories =await Category.find().lean();
    
    const trending = await Video.find().sort({ views: -1}).limit(20).lean();

    const newReleases = await Video.find().sort({ releaseDate: -1}).limit(20).lean();
   
    const continueWatching = await WatchHistory.find({ userId}).populate("videoId").lean();

    const continueWatchingFormatted = continueWatching && continueWatching.length > 0 ? continueWatching.map(item => ({
            progress: item.progress,
            lastPosition: item.lastPosition,
            video: item.videoId
        })): [];
  
    const heroMovie = await Video.findOne().sort({ views: -1 }).lean();

   return res.json(new ApiResponse(200, {hero: heroMovie, categories, trending, newReleases, continueWatching: continueWatchingFormatted}, "Data fetched successfully")); 
})

export { list };