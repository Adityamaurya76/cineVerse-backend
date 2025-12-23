import express, { Router } from "express";
import { createCheckoutSession, stripeWebhook, verifyPayment, getPaymentsList, getPaymentDetails } from "../controllers/subscription.controller.js";

const router = Router();

router.route("/create-checkout-session").post(createCheckoutSession);
router.route("/webhook").post(stripeWebhook);
router.route("/verify-payment").get(verifyPayment);
router.route("/payments/list").get(getPaymentsList);
router.route("/payments/details/:id").get(getPaymentDetails);

export default router;