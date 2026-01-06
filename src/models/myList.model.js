import mongoose, { Schema } from "mongoose";

const myListSchema = new Schema(
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

    videoType: {
      type: String,
      enum: ["movie", "series", "documentary"],
      required: true,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate adds
myListSchema.index({ user: 1, video: 1 }, { unique: true });

export const MyList = mongoose.model("MyList", myListSchema);
