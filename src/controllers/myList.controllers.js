import { ApiResponse } from '../utils/api-response.js'
import { ApiError } from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'
import { MyList } from '../models/myList.model.js'

const list = asyncHandler(async (req, res) => {
    const userId = req.query.userId;

    const myList = await MyList.find({ user: userId }).populate('video');
    
    if( !myList || myList.length === 0 ) {

      return res.status(200).json(new ApiResponse(200, [], "No entries found in My List"));
    }

    return res.status(200).json(new ApiResponse(200, myList, "My List fetched successfully"));
})

const create = asyncHandler(async (req, res) => {
  const { videoId, videoType, userId } = req.body
  
  // Check if the video is already in the user's list
  const existingEntry = await MyList.findOne({ user: userId, video: videoId });

  if (existingEntry) {

    return res.status(400).json(new ApiResponse(400, null, "Video already in My List"));
  }

  const myListEntry = await MyList.create({
    user: userId,
    video: videoId,
    videoType: videoType,
  });

  return res.status(201).json(new ApiResponse(201, myListEntry, "Video added to My List"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const userId = req.user._id

  const deletedEntry = await MyList.findOneAndDelete({ user: userId, video: videoId });

  if (!deletedEntry) {

    return res.status(404).json(new ApiResponse(404, null, "Video not found in My List"));
  }

  return res.status(200).json(new ApiResponse(200, null, "Video removed from My List"));
});

export { list, create, deleteVideo };