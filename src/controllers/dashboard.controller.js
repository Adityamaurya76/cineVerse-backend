import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.models.js";
import { Payment } from "../models/payment.model.js";
import { Subscription } from "../models/subscription.model.js";
import { SubscriptionPlan } from "../models/subscriptionPlan.model.js";
import { Video } from "../models/video.models.js";
import mongoose from "mongoose";

const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const { period = "month" } = req.query; // "month" or "week"
    
    // Calculate date range based on period
    const now = new Date();
    const startDate = new Date();
    if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Total Users
    const totalUsers = await User.countDocuments();
    const previousPeriodUsers = await User.countDocuments({
      createdAt: { $lt: startDate }
    });
    const newUsers = totalUsers - previousPeriodUsers;
    const newUsersChange = previousPeriodUsers > 0 
      ? ((newUsers / previousPeriodUsers) * 100).toFixed(1)
      : 0;

    // Total Subscriptions
    const totalSubscriptions = await Subscription.countDocuments({ status: "active" });
    const previousPeriodSubscriptions = await Subscription.countDocuments({
      status: "active",
      createdAt: { $lt: startDate }
    });
    const subscriptionsChange = previousPeriodSubscriptions > 0
      ? (((totalSubscriptions - previousPeriodSubscriptions) / previousPeriodSubscriptions) * 100).toFixed(1)
      : 0;

    // Churn Rate (cancelled/expired subscriptions)
    const cancelledSubscriptions = await Subscription.countDocuments({
      status: { $in: ["cancelled", "expired"] },
      updatedAt: { $gte: startDate }
    });
    const churnRate = totalSubscriptions > 0
      ? ((cancelledSubscriptions / totalSubscriptions) * 100).toFixed(1)
      : 0;
    const previousChurnRate = 4.6; // This would ideally come from previous period calculation
    const churnRateChange = (previousChurnRate - parseFloat(churnRate)).toFixed(1);

    // Sales/Revenue Data
    const salesData = await Payment.aggregate([
      {
        $match: {
          status: "success",
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === "week" ? "%Y-%m-%d" : "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          total: { $sum: "$amountPaid" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format sales data for chart
    const formattedSalesData = salesData.map(item => ({
      date: item._id,
      value: item.total || 0,
      count: item.count || 0
    }));

    // Calculate total revenue
    const totalRevenue = salesData.reduce((sum, item) => sum + (item.total || 0), 0);

    return res.status(200).json(
      new ApiResponse(200, {
        metrics: {
          newUsers: {
            value: totalUsers,
            change: parseFloat(newUsersChange),
            changeType: newUsersChange >= 0 ? "positive" : "negative"
          },
          subscriptions: {
            value: totalSubscriptions,
            change: parseFloat(subscriptionsChange),
            changeType: subscriptionsChange >= 0 ? "positive" : "negative"
          },
          churnRate: {
            value: parseFloat(churnRate),
            change: parseFloat(churnRateChange),
            changeType: churnRateChange >= 0 ? "positive" : "negative"
          }
        },
        sales: {
          total: totalRevenue,
          data: formattedSalesData,
          period
        }
      }, "Dashboard statistics fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw new ApiError(500, `Error fetching dashboard statistics: ${error.message}`);
  }
});

const getPageVisits = asyncHandler(async (req, res) => {
  try {
    // Since we don't have analytics tracking, we'll simulate based on actual data
    // In a real app, you'd have an analytics service tracking page visits
    
    const totalUsers = await User.countDocuments();
    const totalVideos = await Video.countDocuments({ status: 1 });
    const totalSubscriptions = await Subscription.countDocuments({ status: "active" });
    
    // Simulate page visits based on actual data
    const pageVisits = [
      {
        page: "/",
        visitors: Math.floor(totalUsers * 1.2).toLocaleString(),
        uniqueUsers: Math.floor(totalUsers * 0.3).toLocaleString(),
        bounceRate: -46.53,
        bounceClass: "negative"
      },
      {
        page: "/movies",
        visitors: Math.floor(totalVideos * 50).toLocaleString(),
        uniqueUsers: Math.floor(totalUsers * 0.25).toLocaleString(),
        bounceRate: 46.53,
        bounceClass: "positive"
      },
      {
        page: "/subscriptions",
        visitors: Math.floor(totalSubscriptions * 3).toLocaleString(),
        uniqueUsers: Math.floor(totalSubscriptions * 0.25).toLocaleString(),
        bounceRate: 30.49,
        bounceClass: "positive"
      }
    ];

    return res.status(200).json(
      new ApiResponse(200, pageVisits, "Page visits fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching page visits:", error);
    throw new ApiError(500, `Error fetching page visits: ${error.message}`);
  }
});

const getSocialTraffic = asyncHandler(async (req, res) => {
  try {
    // Simulate social traffic data
    // In a real app, this would come from analytics integration
    const totalUsers = await User.countDocuments();
    
    const socialTraffic = [
      {
        platform: "Facebook",
        value: Math.floor(totalUsers * 0.3).toLocaleString(),
        width: "60%",
        class: "facebook"
      },
      {
        platform: "Instagram",
        value: Math.floor(totalUsers * 1.1).toLocaleString(),
        width: "70%",
        class: "instagram"
      },
      {
        platform: "TikTok",
        value: Math.floor(totalUsers * 1.0).toLocaleString(),
        width: "80%",
        class: "tiktok"
      }
    ];

    return res.status(200).json(
      new ApiResponse(200, socialTraffic, "Social traffic fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching social traffic:", error);
    throw new ApiError(500, `Error fetching social traffic: ${error.message}`);
  }
});

export { getDashboardStats, getPageVisits, getSocialTraffic };


