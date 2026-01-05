import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { Category} from '../models/category.model.js';
import { Video } from '../models/video.models.js';

const browse = asyncHandler(async  (req, res) => {

    const baseSelect = "title thumbnail category type isPremium";

    const categoryNames = ["action", "sci-fi", "comedy", "drama", "horror"];
    const categories = await Category.find({ name: { $in: categoryNames } }).select('_id name');
    const categoryMap = {};
    categories.forEach(cat => {
        categoryMap[cat.name] = cat._id;
    });

    const [trending, newArrivals, action, scifi, comedy, drama, horror] = await Promise.all([

    // Trending Now
    Video.find().sort({ views: -1 }).limit(10).populate("category").select(baseSelect),

    // New Arrivals
    Video.find().sort({ createdAt: -1 }).limit(10).populate("category").select(baseSelect),

    // Genre rows
    Video.find({ category: categoryMap["action"] }).limit(10).populate("category").select(baseSelect),
    Video.find({ category: categoryMap["sci-fi"] }).limit(10).populate("category").select(baseSelect),
    Video.find({ category: categoryMap["comedy"] }).limit(10).populate("category").select(baseSelect),
    Video.find({ category: categoryMap["drama"] }).limit(10).populate("category").select(baseSelect),
    Video.find({ category: categoryMap["horror"] }).limit(10).populate("category").select(baseSelect)
  ]);

  return res.status(200).json(new ApiResponse( {success: true, data: {
      filters: {
        genres: ["Action", "Sci-Fi", "Comedy", "Drama", "Horror"]
      }, sections: [
        {
          key: "trending",
          title: "Trending Now",
          items: trending
        },
        {
          key: "new",
          title: "New Arrivals",
          items: newArrivals
        },
        {
          key: "action",
          title: "Action",
          items: action
        },
        {
          key: "scifi",
          title: "Sci-Fi",
          items: scifi
        },
        {
          key: "comedy",
          title: "Comedy",
          items: comedy
        },
        {
          key: "drama",
          title: "Drama",
          items: drama
        },
        {
          key: "horror",
          title: "Horror",
          items: horror
        }
      ]} }, "Browse data fetched successfully"));

});

export { browse };
