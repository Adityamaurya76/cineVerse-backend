import mongoose, { Schema } from "mongoose";

const watchHistorySchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },

    episode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Episode",
      default: null, 
    },

    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },

    progress: {
      type: Number,
      default: 0,
    },

    durationWatched: {
      type: Number,
      default: 0,
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

watchHistorySchema.index({ user: 1, video: 1, episode: 1 }, { unique: true });

export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
