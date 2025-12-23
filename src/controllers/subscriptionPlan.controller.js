import { SubscriptionPlan } from "../models/subscriptionPlan.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const SubscriptionPlanList = asyncHandler(async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status !== undefined) {
      filter.status = Number(status);
    }
    if(search) {
      filter.billingPeriod = { $regex: search, $options: "i" };
    }
    const plans = await SubscriptionPlan.find(filter).populate("createdBy", "name").sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, plans, "Subscription plans fetched successfully"));

  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Error while fetching subscription plans", error);
  }
});

const SubscriptionPlanDetails = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findById(id);

    if (!plan) {
      throw new ApiError(404, "Subscription plan not found");
    }

    return res.status(200).json(new ApiResponse(200, plan, "Subscription plan details fetched successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Error while fetching subscription plan details", error);
  }
});

const SubscriptioPlanCreate = asyncHandler(async (req, res) => {
    try {
        const {name, billingPeriod, description, price, durationInDays, discountPercentage, videoQuality, screens} = req.body;

        if (!name || !billingPeriod || !price || !durationInDays) {
            throw new ApiError(400, "name, billingPeriod, price, and durationInDays are required");
        }

        if (!["monthly", "yearly"].includes(billingPeriod)) {
            throw new ApiError(400, "billingPeriod must be monthly or yearly");
        }
 
        const alreadyExists = await SubscriptionPlan.findOne({name, billingPeriod});
        if (alreadyExists) {
            throw new ApiError(400, "A subscription plan with the same name and billing period already exists");
        }

        const newPlan = await SubscriptionPlan.create({
            name,
            billingPeriod,
            description,
            price,
            durationInDays,
            discountPercentage: discountPercentage,
            videoQuality: videoQuality,
            screens: screens,
            createdBy: req.user._id,
        });

        return res.status(201).json(new ApiResponse(201, newPlan, "Subscription plan created successfully")); 
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "Error while creating subscription plan", error);
    }
})

const SubscriptionPlanUpdate = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, billingPeriod, description, price, durationInDays, discountPercentage, videoQuality, screens, status } = req.body;

        const plan = await SubscriptionPlan.findById(id);
        if (!plan) {
            throw new ApiError(404, "Subscription plan not found");
        }

        if (name) plan.name = name;
        if (billingPeriod) {
            if (!["monthly", "yearly"].includes(billingPeriod)) {
                throw new ApiError(400, "billingPeriod must be monthly or yearly");
            }
            plan.billingPeriod = billingPeriod;
        }
        if (description) plan.description = description;
        if (price) plan.price = price;
        if (durationInDays) plan.durationInDays = durationInDays;
        if (discountPercentage !== undefined) plan.discountPercentage = discountPercentage;
        if (videoQuality) plan.videoQuality = videoQuality;
        if (screens) plan.screens = screens;
        if (status !== undefined) plan.status = status;

        await plan.save();

        return res.status(200).json(new ApiResponse(200, plan, "Subscription plan updated successfully"));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "Error while updating subscription plan", error);
    }
});

const SubscriptionPlanDelete = asyncHandler(async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findById(req.params.id);

        if (!plan) {
            throw new ApiError(404, "Subscription plan not found");
        }

        await plan.remove();

        return res.status(200).json(new ApiResponse(200, null, "Subscription plan deleted successfully"));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "Error while deleting subscription plan", error);
    }
});

export { SubscriptionPlanList, SubscriptionPlanDetails, SubscriptioPlanCreate, SubscriptionPlanUpdate, SubscriptionPlanDelete};