import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import  { Video } from "../models/video.models.js";
import cloudinary from "../config/cloudinary.js";

const videoList = asyncHandler(async (req, res) => {
    try{
       const videos = await Video.find().populate("category", "name").sort({ createdAt: -1 })

       if(!videos) {
            return res.status(404).json(new ApiResponse(404, null, "Users not found"));
        }
         
        return res.status(200).json(new ApiResponse(200, videos, "Video fetched successfully"));

    } catch (error) {
        throw new ApiError(500, 'Error while fetching Users', error);
    }
});

/*const createVideo = asyncHandler(async (req, res) => {
   const { title, description, type, category, releaseDate, duration, cast, director, isPremium} = req.body;
  
   const existingVideo = await Video.findOne({ title: title.toLowerCase() });

    if(existingVideo) {
       throw new ApiError(400, "Video with this title already exists");
    }

    let thumbnailData = {
        url:"https://placehold.co/600x400", 
        localPath:""
    }

    if(req.files?.thumbnail) {
        const cloudImg = await cloudinary.uploader.upload(req.files.thumbnail[0].path, {
            folder: "video_thumbnails",   
        });

        thumbnailData = {
            url:cloudImg.secure_url,
            localPath: cloudImg.public_id
        }
    }

    //handle trailer
    let trailerUrl = "";
    if(req.files?.trailer) {
        const trailerUpload = await cloudinary.uploader.upload(req.files.trailer[0].path, {
            folder:"video_trailers",
            resource_type: "video",
        });

        trailerUrl = trailerUpload.secure_url;
    }

    // handle Main Video
    let videoUrl = "";
    if(req.files?.video) {
        const videoUpload = await cloudinary.uploader.upload(req.files.video[0].path, {
            folder: "videos",
            resource_type: "video"
        });

        videoUrl = videoUpload.secure_url;
    }

    const video = await Video.create({
        title: title.toLowerCase(),
        description,
        type,
        category,
        releaseDate,
        duration,
        cast: cast ? JSON.parse(cast): [].
        director,
        isPremium: isPremium || false,
        thumbnail: thumbnailData,
        videoUrl,
        trailerUrl,
        createdBy: req.user?._id || null,
    })

    return res.status(201).json(new ApiResponse(201, video, "Category created successfully"));
});*/

const createVideo = asyncHandler(async (req, res) => {
  console.log("req", req);
  
  const { title, description, type, category, releaseDate, duration, cast, director, isPremium, seriesData } = req.body;

  const existingVideo = await Video.findOne({title: title.toLowerCase(),});

  if (existingVideo) {
    throw new ApiError(400, "Video with this title already exists");
  }

  //THUMBNAIL
  let thumbnailData = {
    url: "https://placehold.co/600x400",
    localPath: "",
  };

  if (req.files?.thumbnail) {
    const cloudImg = await cloudinary.uploader.upload(
      req.files.thumbnail[0].path,
      { folder: "video_thumbnails" }
    );

    thumbnailData = {
      url: cloudImg.secure_url,
      localPath: cloudImg.public_id,
    };
  }

  //teailer
  let trailerUrl = "";
  if (req.files?.trailer) {
    const trailerUpload = await cloudinary.uploader.upload(
      req.files.trailer[0].path,
      {
        folder: "video_trailers",
        resource_type: "video",
      }
    );
    trailerUrl = trailerUpload.secure_url;
  }

  // Main Video
  let videoUrl = "";
  if (type === "movie" && req.files?.video) {
    const videoUpload = await cloudinary.uploader.upload(
      req.files.video[0].path,
      {
        folder: "videos",
        resource_type: "video",
      }
    );
    videoUrl = videoUpload.secure_url;
  }

  // cast
  let parsedCast = cast ? JSON.parse(cast) : [];

  if (req.files?.castImages?.length) {
    const uploadedCastImages = await Promise.all(
      req.files.castImages.map((file) =>
        cloudinary.uploader.upload(file.path, {
          folder: "cast_images",
        })
      )
    );

    parsedCast = parsedCast.map((member, index) => ({
      name: member.name,
      role: member.role,
      image: uploadedCastImages[index]?.secure_url || "",
    }));
  }

  // SERIES (SEASONS + EPISODES)
  let seasons = [];

  if (type === "series" && seriesData) {
    const parsedSeries = JSON.parse(seriesData);

    for (let s = 0; s < parsedSeries.seasons.length; s++) {
      const season = parsedSeries.seasons[s];

      // Season Thumbnail
      let seasonThumbnail = {
        url: "https://placehold.co/400x300",
        localPath: "",
      };

      const seasonThumbFile = req.files.find(
        (f) => f.fieldname === `seasonThumbnail_${s}`
      );

      if (seasonThumbFile) {
        const upload = await cloudinary.uploader.upload(
          seasonThumbFile.path,
          { folder: "series/seasons" }
        );

        seasonThumbnail = {
          url: upload.secure_url,
          localPath: upload.public_id,
        };
      }

      let episodes = [];

      for (let e = 0; e < season.episodes.length; e++) {
        const ep = season.episodes[e];

        // Episode Video
        const epVideoFile = req.files.find(
          (f) => f.fieldname === `episodeVideo_${s}_${e}`
        );

        if (!epVideoFile) {
          throw new ApiError(400, `Episode video missing for S${s + 1}E${e + 1}`);
        }

        const epVideoUpload = await cloudinary.uploader.upload(
          epVideoFile.path,
          {
            resource_type: "video",
            folder: "series/episodes/videos",
          }
        );

        // Episode Thumbnail
        const epThumbFile = req.files.find(
          (f) => f.fieldname === `episodeThumb_${s}_${e}`
        );

        let epThumbnail = {
          url: "https://placehold.co/300x200",
          localPath: "",
        };

        if (epThumbFile) {
          const thumbUpload = await cloudinary.uploader.upload(
            epThumbFile.path,
            { folder: "series/episodes/thumbnails" }
          );

          epThumbnail = {
            url: thumbUpload.secure_url,
            localPath: thumbUpload.public_id,
          };
        }

        episodes.push({
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          description: ep.description,
          duration: ep.duration,
          videoUrl: epVideoUpload.secure_url,
          thumbnail: epThumbnail,
        });
      }

      seasons.push({
        seasonNumber: season.seasonNumber,
        title: season.title,
        thumbnail: seasonThumbnail,
        episodes,
      });
    }
  }

  const video = await Video.create({
    title: title.toLowerCase(),
    description,
    type,
    category,
    releaseDate,
    duration,
    cast: parsedCast,
    director,
    isPremium: isPremium || false,
    thumbnail: thumbnailData,
    videoUrl,
    trailerUrl,
    seasons,
    createdBy: req.user?._id || null,
  });

  return res.status(201).json(new ApiResponse(201, video, "Video created successfully"));
});


const videoDetials = asyncHandler(async (req, res) => {
     try {
        const video =await Video.findById(req.params.id);
        if(!video) {
            return res.status(404).json(new ApiResponse(200, "Video not found"));
        }

        return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
    } catch (error) {
        throw new ApiError(500, 'Error while fetching categories', error);
    }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description, type, category, releaseDate, duration, cast, director, isPremium } = req.body;
  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json(new ApiResponse(404, null, "Video not found"));
  }

  if (title) video.title = title.toLowerCase();
  if (description) video.description = description;
  if (type) video.type = type;
  if (category) video.category = category;
  if (releaseDate) video.releaseDate = releaseDate;
  if (duration) video.duration = duration;
  if (cast) video.cast = typeof cast === "string" ? JSON.parse(cast) : cast;
  if (director) video.director = director;
  if (isPremium !== undefined) video.isPremium = isPremium;

  // update thumbnail
  if (req.files?.thumbnail) {
    if (video.thumbnail?.localPath) {
      await cloudinary.uploader.destroy(video.thumbnail.localPath);
    }
    const uploadThumb = await cloudinary.uploader.upload(req.files.thumbnail[0].path, {
      folder: "video_thumbnails",
    });

    video.thumbnail = {
      url: uploadThumb.secure_url,
      localPath: uploadThumb.public_id,
    };
  }

  // update trailer
  if (req.files?.trailer) {
    const uploadTrailer = await cloudinary.uploader.upload(req.files.trailer[0].path, {
      folder: "video_trailers",
      resource_type: "video",
    });
    video.trailerUrl = uploadTrailer.secure_url;
  }

  // update main video
  if (req.files?.video) {
    const uploadVideo = await cloudinary.uploader.upload(req.files.video[0].path, {
      folder: "videos",
      resource_type: "video",
    });
    video.videoUrl = uploadVideo.secure_url;
  }
  await video.save();

  return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

const deletedVideo = asyncHandler(async (req, res) => {
    try{
        const video = await Video.findById(req.params.id);
        
        if(!video){
            return res.status(404).json(new ApiResponse(200, "Video not found"));
        }
        
        if (category.thumbnail?.localPath){
            await cloudinary.uploader.destroy(video.thumbnail.localPath);
        }

        if (video.trailerLocalPath) {
            await cloudinary.uploader.destroy(video.trailerLocalPath, {
                resource_type: "video",
            });
        }

        if (video.videoLocalPath) {
            await cloudinary.uploader.destroy(video.videoLocalPath, {
                resource_type: "video",
            });
        }

        await Video.findByIdAndDelete(req.params.id);

        return res.status(200).json(new ApiResponse(200, video, "Video deleted successfully"));
    } catch (error) {
        throw new ApiError(500, 'Error while updating category', error);
    }
});


export {videoList, createVideo, videoDetials, updateVideo, deletedVideo};