import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { Category} from '../models/category.model.js';
import { Video } from '../models/video.models.js';

const list = asyncHandler(async (req, res) => {
  const  {  category, type, isPremium, search, sort, page , limit} = req.query;
  let filter = {};

  if (category) filter.category = category;
  if (type) filter.type = type;
  if (isPremium !== undefined) filter.isPremium = isPremium === 'true';
  if (search) filter.title = { $regex: search, $options: 'i' };

  let sortQuery = {};
  if (sort === 'latest') sortQuery.releaseDate = -1;
  else if (sort === 'trending') sortQuery.views = -1;
  else sortQuery.createdAt = -1;

  const skip = (page - 1) * limit;

  const categories =await Category.find().lean();
  const trending = await Video.find().sort({ views: -1}).limit(20).lean();
  const newReleases = await Video.find().sort({ releaseDate: -1}).limit(20).lean();
  const heroMovie = await Video.findOne().sort({ views: -1 }).lean();

  return res.json(new ApiResponse(200, { hero: heroMovie, categories, trending, newReleases }, "Movie fetched successfully")); 
});

const detail = asyncHandler( async(req, res) => {
  const { id } = req.params;

  const video =await Video.findById(id);

  if(!video) {
    return res.status(404).json(new ApiResponse(200, "Video not found"));
  }

  const related = await Video.find({_id: { $ne: id }, category: video.category}).sort({ views: -1 }).limit(8).lean();

  return res.status(200).json(new ApiResponse(200, {video, related}, "Video fetched successfully"));
});

export { list, detail };