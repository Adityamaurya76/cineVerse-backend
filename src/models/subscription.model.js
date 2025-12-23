import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    stripeSessionId: {
      type: String,
      default: null 
    },

    stripeCustomerId: {
      type: String,
      default: null 
    },

    stripeSubscriptionId: {
      type: String,
      default: null 
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "past_due", "incomplete"],
      default: "active",
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    autoRenew: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.methods.isExpired = function () {
  return new Date() > this.endDate;
};

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
