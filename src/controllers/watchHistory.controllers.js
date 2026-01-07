import { WatchHistory } from "../models/watchHistory.model.js";
import { ApiResponse } from '../utils/api-response.js'
import { ApiError } from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'

const list = asyncHandler(async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const watchHistory = await WatchHistory.find({ user: userId }).populate("video");

    if (!watchHistory) {
        throw new ApiError(404, "Watch history not found");
    }

    return res.status(200).json(new ApiResponse(200, watchHistory, "Watch history retrieved successfully"));
});


export { list };