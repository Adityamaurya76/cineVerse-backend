import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    amountPaid: {
      type: Number,
      default: null,
    },

    currency: {
      type: String,
      default: "usd",
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      default: null,
    },

    stripeSessionId: {
      type: String,
      default: null,
    },

    stripeCustomerId: {
      type: String,
      default: null,
    },

    stripePaymentIntentId: {
      type: String,
      default: null,
    },

    stripeChargeId: {
      type: String,
      default: null,
    },

    transactionId: {
      type: String,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model("Payment", paymentSchema);
