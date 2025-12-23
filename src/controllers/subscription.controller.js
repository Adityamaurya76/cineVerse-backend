import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { stripe } from "../config/stripe.js";
import { SubscriptionPlan } from "../models/subscriptionPlan.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Payment } from "../models/payment.model.js";
import mongoose from "mongoose";

const createCheckoutSession = asyncHandler(async (req, res) => {
  const { planId, price, userId } = req.body;

  if (!planId || price == null || !userId) {
    throw new ApiError(400, "Missing parameters: planId, price or userId");
  }

  const plan = await SubscriptionPlan.findById(planId).lean();

  const payment = await Payment.create({
    userId,
    planId,
    price,
    status: "pending",
  });

  const defaultDays = plan?.durationInDays ?? 30;
  const defaultEndDate = new Date(Date.now() + defaultDays * 24 * 60 * 60 * 1000);

  const subscription = await Subscription.create({
    user: userId,
    plan: planId,
    startDate: new Date(),
    endDate: defaultEndDate,
    status: "incomplete",
    paymentId: payment._id,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(price * 100),
          recurring: { interval: "month" },
          product_data: {
            name: plan?.name ?? `Subscription Plan ${planId}`,
            description: plan?.description ?? undefined,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentId: payment._id.toString(),
      subscriptionId: subscription._id.toString(),
      planId: planId,
      userId: userId,
    },
    subscription_data: {
      metadata: {
        paymentId: payment._id.toString(),
        subscriptionId: subscription._id.toString(),
        planId: planId,
        userId: userId,
      },
    },
    success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
  });

  payment.stripeSessionId = session.id;
  await payment.save();

  subscription.stripeSessionId = session.id;
  await subscription.save();

  return res.status(200).json(new ApiResponse(200, { url: session.url }, "Checkout session created"));
});


const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRETE_KEY;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("event from web hooks", event);
    
  } catch (err) {
    console.error(" Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { paymentId, subscriptionId, planId, userId } = session.metadata || {};
        const stripeSubscriptionId = session.subscription || null;
        const stripeCustomerId = session.customer || null;
        const paymentIntentId = session.payment_intent || null;
        const amountTotal = session.amount_total ? session.amount_total / 100 : null;
        const currency = session.currency || "usd";
        const paymentStatus = session.payment_status;

        // Fetch payment intent details if available
        let paymentMethod = null;
        let chargeId = null;
        if (paymentIntentId) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            paymentMethod = paymentIntent.payment_method_types?.[0] || null;
            chargeId = paymentIntent.latest_charge || null;
          } catch (err) {
            console.error("Error fetching payment intent:", err.message);
          }
        }

        // Update payment record with comprehensive data
        if (paymentId && mongoose.isValidObjectId(paymentId)) {
          const paymentUpdate = {
            status: paymentStatus === "paid" ? "success" : "pending",
            stripeSessionId: session.id,
            stripeCustomerId,
            stripePaymentIntentId: paymentIntentId,
            stripeChargeId: chargeId,
            amountPaid: amountTotal,
            currency,
            paymentMethod,
            paidAt: paymentStatus === "paid" ? new Date() : null,
          };

          await Payment.findByIdAndUpdate(paymentId, paymentUpdate);
        }

        // Update subscription if payment is successful
        if (paymentStatus === "paid" && subscriptionId && mongoose.isValidObjectId(subscriptionId)) {
          let durationDays = 30;
          if (planId && mongoose.isValidObjectId(planId)) {
            try {
              const planDoc = await SubscriptionPlan.findById(planId).lean();
              if (planDoc && planDoc.durationInDays) durationDays = planDoc.durationInDays;
            } catch (e) {
              console.error("Error fetching plan:", e);
            }
          }

          const newEndDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

          await Subscription.findByIdAndUpdate(subscriptionId, {
            status: "active",
            stripeSubscriptionId,
            stripeCustomerId,
            stripeSessionId: session.id,
            startDate: new Date(),
            endDate: newEndDate,
          });
        } else if (paymentStatus === "paid") {
          // Fallback: find subscription by session ID
          const sub = await Subscription.findOne({ stripeSessionId: session.id });
          if (sub) {
            let durationDays = 30;
            if (sub.plan && mongoose.isValidObjectId(sub.plan)) {
              try {
                const planDoc = await SubscriptionPlan.findById(sub.plan).lean();
                if (planDoc && planDoc.durationInDays) durationDays = planDoc.durationInDays;
              } catch (e) {
                console.error("Error fetching plan:", e);
              }
            }

            await Subscription.findByIdAndUpdate(sub._id, {
              status: "active",
              stripeSubscriptionId,
              stripeCustomerId,
              startDate: new Date(),
              endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
            });
          }
        }

        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const { paymentId, subscriptionId } = session.metadata || {};
        const paymentIntentId = session.payment_intent || null;
        const amountTotal = session.amount_total ? session.amount_total / 100 : null;

        if (paymentId && mongoose.isValidObjectId(paymentId)) {
          let paymentMethod = null;
          let chargeId = null;
          if (paymentIntentId) {
            try {
              const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
              paymentMethod = paymentIntent.payment_method_types?.[0] || null;
              chargeId = paymentIntent.latest_charge || null;
            } catch (err) {
              console.error("Error fetching payment intent:", err.message);
            }
          }

          await Payment.findByIdAndUpdate(paymentId, {
            status: "success",
            stripePaymentIntentId: paymentIntentId,
            stripeChargeId: chargeId,
            amountPaid: amountTotal,
            paymentMethod,
            paidAt: new Date(),
          });
        }

        if (subscriptionId && mongoose.isValidObjectId(subscriptionId)) {
          await Subscription.findByIdAndUpdate(subscriptionId, {
            status: "active",
          });
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const { paymentId } = session.metadata || {};

        if (paymentId && mongoose.isValidObjectId(paymentId)) {
          await Payment.findByIdAndUpdate(paymentId, {
            status: "failed",
            failureReason: "Async payment failed",
          });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const sessionId = paymentIntent.metadata?.session_id;
        const paymentId = paymentIntent.metadata?.paymentId;

        let payment = null;
        if (paymentId && mongoose.isValidObjectId(paymentId)) {
          payment = await Payment.findById(paymentId);
        } else if (sessionId) {
          payment = await Payment.findOne({ stripeSessionId: sessionId });
        }

        if (payment) {
          const chargeId = paymentIntent.latest_charge || null;
          await Payment.findByIdAndUpdate(payment._id, {
            status: "success",
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: chargeId,
            amountPaid: paymentIntent.amount ? paymentIntent.amount / 100 : payment.price,
            currency: paymentIntent.currency || payment.currency || "usd",
            paymentMethod: paymentIntent.payment_method_types?.[0] || null,
            paidAt: new Date(),
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const sessionId = paymentIntent.metadata?.session_id;
        const paymentId = paymentIntent.metadata?.paymentId;

        let payment = null;
        if (paymentId && mongoose.isValidObjectId(paymentId)) {
          payment = await Payment.findById(paymentId);
        } else if (sessionId) {
          payment = await Payment.findOne({ stripeSessionId: sessionId });
        }

        if (payment) {
          await Payment.findByIdAndUpdate(payment._id, {
            status: "failed",
            stripePaymentIntentId: paymentIntent.id,
            failureReason: paymentIntent.last_payment_error?.message || "Payment failed",
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const stripeCustomerId = invoice.customer;
        const stripeSubscriptionId = invoice.subscription;

        if (stripeSubscriptionId) {
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId },
            { status: "past_due" }
          );
        }

        // Update payment status if invoice has payment intent
        if (invoice.payment_intent) {
          const payment = await Payment.findOne({ stripePaymentIntentId: invoice.payment_intent });
          if (payment) {
            await Payment.findByIdAndUpdate(payment._id, {
              status: "failed",
              failureReason: "Invoice payment failed",
            });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const stripeSubscriptionId = invoice.subscription;

        if (stripeSubscriptionId) {
          const subscription = await Subscription.findOne({ stripeSubscriptionId });
          if (subscription && subscription.status !== "active") {
            await Subscription.findByIdAndUpdate(subscription._id, {
              status: "active",
            });
          }
        }

        // Update payment if invoice has payment intent
        if (invoice.payment_intent) {
          const payment = await Payment.findOne({ stripePaymentIntentId: invoice.payment_intent });
          if (payment && payment.status !== "success") {
            await Payment.findByIdAndUpdate(payment._id, {
              status: "success",
              amountPaid: invoice.amount_paid ? invoice.amount_paid / 100 : payment.price,
              currency: invoice.currency || "usd",
              paidAt: new Date(),
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscriptionObj = event.data.object;
        const stripeSubscriptionId = subscriptionObj.id;
        const status = subscriptionObj.status;

        const update = { status };
        if (subscriptionObj.current_period_end) {
          update.endDate = new Date(subscriptionObj.current_period_end * 1000);
        }
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId },
          update,
          { new: true }
        );
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook handling error:", err);
    res.status(500).send();
  }
});


const verifyPayment = asyncHandler(async (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    throw new ApiError(400, "Session ID is required");
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const payment = await Payment.findOne({ stripeSessionId: sessionId }).populate("planId").populate("userId", "name email");

    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    const subscription = await Subscription.findOne({ stripeSessionId: sessionId }).populate("plan").populate("user", "name email");

    return res.status(200).json(new ApiResponse(200, {
        payment: {
          id: payment._id,
          status: payment.status,
          amountPaid: payment.amountPaid || payment.price,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        },
        subscription: subscription
          ? {
              id: subscription._id,
              status: subscription.status,
              startDate: subscription.startDate,
              endDate: subscription.endDate,
            }
          : null,
        stripeSession: {
          id: session.id,
          paymentStatus: session.payment_status,
          status: session.status,
        },
      }, "Payment verification successful")
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Error verifying payment: ${error.message}`);
  }
});

const getPaymentsList = asyncHandler(async (req, res) => {
  try {
    const { status, userId, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (userId) {
      if (mongoose.isValidObjectId(userId)) {
        filter.userId = userId;
      } else {
        throw new ApiError(400, "Invalid userId format");
      }
    }

    if (search) {
      filter.$or = [
        { stripeSessionId: { $regex: search, $options: "i" } },
        { stripeCustomerId: { $regex: search, $options: "i" } },
        { stripePaymentIntentId: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
      ];
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const totalPayments = await Payment.countDocuments(filter);

    const payments = await Payment.find(filter).populate("userId", "name email username avatar").populate("planId", "name price durationInDays billingCycle").sort({ createdAt: -1 }).skip(skip).limit(limitNumber).lean();

    const formattedPayments = payments.map((payment) => ({
      id: payment._id,
      userId: payment.userId,
      planId: payment.planId,
      price: payment.price,
      amountPaid: payment.amountPaid || payment.price,
      currency: payment.currency || "usd",
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      stripeSessionId: payment.stripeSessionId,
      stripeCustomerId: payment.stripeCustomerId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeChargeId: payment.stripeChargeId,
      transactionId: payment.transactionId,
      failureReason: payment.failureReason,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    return res.status(200).json(new ApiResponse(200,{payments: formattedPayments, pagination: {
            currentPage: pageNumber,
            totalPages: Math.ceil(totalPayments / limitNumber),
            totalPayments,
            limit: limitNumber,
            hasNextPage: pageNumber < Math.ceil(totalPayments / limitNumber),
            hasPrevPage: pageNumber > 1,
          },
        },
        "Payments fetched successfully"
      )
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error("Error fetching payments:", error);
    throw new ApiError(500, `Error while fetching payments: ${error.message}`);
  }
});

const getPaymentDetails = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(400, "Invalid payment ID format");
    }

    const payment = await Payment.findById(id).populate("userId", "name email username avatar").populate("planId", "name price durationInDays billingCycle description");

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }
    
    const subscription = await Subscription.findOne({ paymentId: id }).populate("plan", "name price durationInDays billingCycle").populate("user", "name email username");

    const formattedPayment = {
      id: payment._id,
      userId: payment.userId,
      planId: payment.planId,
      price: payment.price,
      amountPaid: payment.amountPaid || payment.price,
      currency: payment.currency || "usd",
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      stripeSessionId: payment.stripeSessionId,
      stripeCustomerId: payment.stripeCustomerId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeChargeId: payment.stripeChargeId,
      transactionId: payment.transactionId,
      failureReason: payment.failureReason,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      subscription: subscription,
    };

    return res.status(200).json(
      new ApiResponse(200, formattedPayment, "Payment details fetched successfully")
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error("Error fetching payment details:", error);
    throw new ApiError(500, `Error while fetching payment details: ${error.message}`);
  }
});

export { createCheckoutSession, stripeWebhook, verifyPayment, getPaymentsList, getPaymentDetails }