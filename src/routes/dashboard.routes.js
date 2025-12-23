import { Router } from "express";
import { getDashboardStats, getPageVisits, getSocialTraffic } from "../controllers/dashboard.controller.js";

const router = Router();

router.route("/stats").get(getDashboardStats);
router.route("/page-visits").get(getPageVisits);
router.route("/social-traffic").get(getSocialTraffic);

export default router;


