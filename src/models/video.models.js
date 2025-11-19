import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
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

    videoUrl: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["movie", "series"],
      required: true,
      default: "movie",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    releaseDate: {
      type: Date,
      default: Date.now,
    },

    duration: {
      type: Number,
      default: 0,
    },

    cast: [
      {
        name: String,
        role: String,
        image: String,
      },
    ],
    director: {
      type: String,
      trim: true,
    },

    trailerUrl: {
      type: String,
      default: "",
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    views: {
      type: Number,
      default: 0,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.methods.updateRating = function (newRating) {
  this.rating = (this.rating + newRating) / 2;
  return this.save();
};

export const Video = mongoose.model("Video", videoSchema);
