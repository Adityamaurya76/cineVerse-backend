import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { Video } from "../models/video.models.js";
import cloudinary from "../config/cloudinary.js";

const videoList = asyncHandler(async (req, res) => {
  try {
    const videos = await Video.find().populate("category", "name").sort({ createdAt: -1 })

    if (!videos) {
      return res.status(404).json(new ApiResponse(404, null, "Users not found"));
    }

    return res.status(200).json(new ApiResponse(200, videos, "Video fetched successfully"));

  } catch (error) {
    throw new ApiError(500, 'Error while fetching Users', error);
  }
});

const createVideo = asyncHandler(async (req, res) => {
  const { title, description, type, category, releaseDate, duration, cast, director, isPremium, isFeatured, tags, seasons, totalSeasons } = req.body;

  const existingVideo = await Video.findOne({ title: title.toLowerCase() });

  if (existingVideo) {
    throw new ApiError(400, "Video with this title already exists");
  }

  const findFile = (fieldname) => {
    return req.files?.find((f) => f.fieldname === fieldname);
  };

  // THUMBNAIL
  let thumbnailData = {
    url: "https://placehold.co/600x400",
    localPath: "",
  };

  const thumbnailFile = findFile("thumbnail");
  if (thumbnailFile) {
    const cloudImg = await cloudinary.uploader.upload(thumbnailFile.path, {
      folder: "video_thumbnails",
    });
    thumbnailData = {
      url: cloudImg.secure_url,
      localPath: cloudImg.public_id,
    };
  }

  // Trailer
  let trailerUrl = "";
  const trailerFile = findFile("trailer");
  if (trailerFile) {
    const trailerUpload = await cloudinary.uploader.upload(trailerFile.path, {
      folder: "video_trailers",
      resource_type: "video",
    });
    trailerUrl = trailerUpload.secure_url;
  }

  // Main Video (for movies)
  let videoUrl = "";
  const videoFile = findFile("video");
  if (type !== "series" && videoFile) {
    const videoUpload = await cloudinary.uploader.upload(videoFile.path, {
      folder: "videos",
      resource_type: "video",
    });
    videoUrl = videoUpload.secure_url;
  }

  // Cast Processing
  let parsedCast = cast ? JSON.parse(cast) : [];
  for (let i = 0; i < parsedCast.length; i++) {
    const castImgFile = findFile(`cast_image_${i}`);
    if (castImgFile) {
      const upload = await cloudinary.uploader.upload(castImgFile.path, {
        folder: "cast_images",
      });
      parsedCast[i].image = upload.secure_url;
    }
  }

  // Seasons and Episodes Processing
  let processedSeasons = [];
  if (type === "series" && seasons) {
    const parsedSeasons = JSON.parse(seasons);
    for (let sIdx = 0; sIdx < parsedSeasons.length; sIdx++) {
      const season = parsedSeasons[sIdx];
      let processedEpisodes = [];

      for (let eIdx = 0; eIdx < season.episodes.length; eIdx++) {
        const episode = season.episodes[eIdx];

        // Episode Video
        let epVideoUrl = "";
        const epVideoFile = findFile(`s${sIdx}e${eIdx}_video`);
        if (epVideoFile) {
          const upload = await cloudinary.uploader.upload(epVideoFile.path, {
            resource_type: "video",
            folder: "series/episodes/videos",
          });
          epVideoUrl = upload.secure_url;
        }

        // Episode Thumbnail
        let epThumbnail = { url: "https://placehold.co/300x200", localPath: "" };
        const epThumbFile = findFile(`s${sIdx}e${eIdx}_thumbnail`);
        if (epThumbFile) {
          const upload = await cloudinary.uploader.upload(epThumbFile.path, {
            folder: "series/episodes/thumbnails",
          });
          epThumbnail = {
            url: upload.secure_url,
            localPath: upload.public_id,
          };
        }

        processedEpisodes.push({
          episodeNumber: eIdx + 1,
          title: episode.title,
          description: episode.description,
          duration: episode.duration,
          videoUrl: epVideoUrl,
          thumbnail: epThumbnail,
        });
      }

      processedSeasons.push({
        seasonNumber: sIdx + 1,
        title: season.title,
        episodes: processedEpisodes,
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
    isPremium: isPremium === "true" || isPremium === true,
    isFeatured: isFeatured === "true" || isFeatured === true,
    tags: tags ? tags.split(",").map(t => t.trim()) : [],
    thumbnail: thumbnailData,
    videoUrl,
    trailerUrl,
    seasons: processedSeasons,
    totalSeasons: totalSeasons || 0,
    createdBy: req.user?._id || null,
  });

  return res.status(201).json(new ApiResponse(201, video, "Video created successfully"));
});

const videoDetials = asyncHandler(async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json(new ApiResponse(200, "Video not found"));
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
  } catch (error) {
    throw new ApiError(500, 'Error while fetching categories', error);
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description, type, category, releaseDate, duration, cast, director, isPremium, isFeatured, tags, seasons, totalSeasons } = req.body;
  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json(new ApiResponse(404, null, "Video not found"));
  }

  const findFile = (fieldname) => {
    return req.files?.find((f) => f.fieldname === fieldname);
  };

  if (title) video.title = title.toLowerCase();
  if (description) video.description = description;
  if (type) video.type = type;
  if (category) video.category = category;
  if (releaseDate) video.releaseDate = releaseDate;
  if (duration) video.duration = duration;
  if (director) video.director = director;
  if (isPremium !== undefined) video.isPremium = isPremium === "true" || isPremium === true;
  if (isFeatured !== undefined) video.isFeatured = isFeatured === "true" || isFeatured === true;
  if (tags !== undefined) video.tags = tags.split(",").map(t => t.trim());
  if (totalSeasons !== undefined) video.totalSeasons = totalSeasons;

  // Cast
  if (cast) {
    let parsedCast = typeof cast === "string" ? JSON.parse(cast) : cast;
    for (let i = 0; i < parsedCast.length; i++) {
      const castImgFile = findFile(`cast_image_${i}`);
      if (castImgFile) {
        const upload = await cloudinary.uploader.upload(castImgFile.path, {
          folder: "cast_images",
        });
        parsedCast[i].image = upload.secure_url;
      }
    }
    video.cast = parsedCast;
  }

  // update thumbnail
  const thumbFile = findFile("thumbnail");
  if (thumbFile) {
    if (video.thumbnail?.localPath) {
      await cloudinary.uploader.destroy(video.thumbnail.localPath);
    }
    const uploadThumb = await cloudinary.uploader.upload(thumbFile.path, {
      folder: "video_thumbnails",
    });

    video.thumbnail = {
      url: uploadThumb.secure_url,
      localPath: uploadThumb.public_id,
    };
  }

  // update trailer
  const trailerFile = findFile("trailer");
  if (trailerFile) {
    const uploadTrailer = await cloudinary.uploader.upload(trailerFile.path, {
      folder: "video_trailers",
      resource_type: "video",
    });
    video.trailerUrl = uploadTrailer.secure_url;
  }

  // update main video
  const videoFile = findFile("video");
  if (videoFile) {
    const uploadVideo = await cloudinary.uploader.upload(videoFile.path, {
      folder: "videos",
      resource_type: "video",
    });
    video.videoUrl = uploadVideo.secure_url;
  }

  // Seasons and Episodes
  if (type === "series" && seasons) {
    const parsedSeasons = JSON.parse(seasons);
    let processedSeasons = [];
    for (let sIdx = 0; sIdx < parsedSeasons.length; sIdx++) {
      const season = parsedSeasons[sIdx];
      let processedEpisodes = [];

      for (let eIdx = 0; eIdx < season.episodes.length; eIdx++) {
        const episode = season.episodes[eIdx];

        let epVideoUrl = episode.videoUrl || "";
        const epVideoFile = findFile(`s${sIdx}e${eIdx}_video`);
        if (epVideoFile) {
          const upload = await cloudinary.uploader.upload(epVideoFile.path, {
            resource_type: "video",
            folder: "series/episodes/videos",
          });
          epVideoUrl = upload.secure_url;
        }

        let epThumbnail = episode.thumbnail || { url: "https://placehold.co/300x200", localPath: "" };
        const epThumbFile = findFile(`s${sIdx}e${eIdx}_thumbnail`);
        if (epThumbFile) {
          const upload = await cloudinary.uploader.upload(epThumbFile.path, {
            folder: "series/episodes/thumbnails",
          });
          epThumbnail = {
            url: upload.secure_url,
            localPath: upload.public_id,
          };
        }

        processedEpisodes.push({
          episodeNumber: eIdx + 1,
          title: episode.title,
          description: episode.description,
          duration: episode.duration,
          videoUrl: epVideoUrl,
          thumbnail: epThumbnail,
        });
      }

      processedSeasons.push({
        seasonNumber: sIdx + 1,
        title: season.title,
        episodes: processedEpisodes,
      });
    }
    video.seasons = processedSeasons;
  }

  await video.save();

  return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

const deletedVideo = asyncHandler(async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json(new ApiResponse(200, "Video not found"));
    }

    if (category.thumbnail?.localPath) {
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


export { videoList, createVideo, videoDetials, updateVideo, deletedVideo };