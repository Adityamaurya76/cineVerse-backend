import { Router } from "express";
import { registerUser, userLogin, adminLogin, logout, verifyEmail, refreshToken, forgotPasswordRequest, resetForgotPassword } from "../controllers/auth.controllers.js";
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
router.route("/refresh-token").post(refreshToken);
router.route("/forget-password").post(forgotPasswordRequest);
router.route("/reset-password/:resetToken").post(resetForgotPassword);

//secure routes
router.route("/logout").post(logout);
router.route("/change-password").post(verifyJWT, validate, );


export default router;