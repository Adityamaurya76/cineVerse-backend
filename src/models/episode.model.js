import mongoose, { Schema } from "mongoose";

const episodeSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Episode title is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    videoUrl: {
      type: String,
      required: [true, "Episode video URL is required"],
    },

    thumbnail: {
      type: {
        url: String,
        localPath: String,
      },
      default: {
        url: "https://placehold.co/600x400",
        localPath: "",
      },
    },

    duration: {
      type: Number,
      required: true,
    },

    episodeNumber: {
      type: Number,
      required: true,
    },

    seasonNumber: {
      type: Number,
      required: true,
      default: 1,
    },

    releaseDate: {
      type: Date,
      default: Date.now,
    },

    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },

    isFree: {
      type: Boolean,
      default: false,
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Episode = mongoose.model("Episode", episodeSchema);
