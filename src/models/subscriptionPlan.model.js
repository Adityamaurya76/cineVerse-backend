import mongoose, { Schema } from "mongoose";

const subscriptionPlanSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
    },

    durationInDays: {
      type: Number,
      required: [true, "Duration is required"],
      default: 30,
    },

    videoQuality: {
      type: String,
      enum: ["480p", "720p", "1080p", "4K"],
      default: "1080p",
    },

    screens: {
      type: Number,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
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

export const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
