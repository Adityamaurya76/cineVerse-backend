import { Router } from "express";
import { registerUser, userLogin, adminLogin, logout, verifyEmail } from "../controllers/auth.controllers.js";
import { userRegistrationValidator } from "../validators/index.js";
import { validate } from "../middlewares/validator.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/varifyJwt.middleware.js";

const router = Router();

//unprotected routes
router.route("/register").post(userRegistrationValidator(), upload.single("avatar"), registerUser);
router.route("/user/login").post(userLogin);
router.route("/admin/login").post(adminLogin);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/logout").post(logout);

export default router;