import { Router } from "express";
import { SubscriptionPlanDelete, SubscriptionPlanDetails, SubscriptionPlanList, SubscriptionPlanUpdate, SubscriptioPlanCreate } from "../controllers/subscriptionPlan.controller.js";
import { verifyJWT } from "../middlewares/varifyJwt.middleware.js";
import { authorizeRole } from "../middlewares/autherizeRole.middleware.js";

const router = Router();

router.route("/list").get(SubscriptionPlanList);
router.route("/details/:id").get(SubscriptionPlanDetails);
router.route("/create").post(verifyJWT, authorizeRole("admin"), SubscriptioPlanCreate);
router.route("/update/:id").put(verifyJWT, authorizeRole("admin"), SubscriptionPlanUpdate);
router.route("/delete/:id").delete(verifyJWT, authorizeRole("admin"), SubscriptionPlanDelete);

export default router;