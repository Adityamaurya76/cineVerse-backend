import { Router } from "express";
import { registerUser, userLogin, adminLogin } from "../controllers/auth.controllers.js";
import { userRegistrationValidator } from "../validators/index.js";
import { validate } from "../middlewares/validator.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

//unprotected routes
router.route("/register").post(userRegistrationValidator(), upload.single("avatar"), registerUser);
router.route("/user/login").post(userLogin);
router.route("/admin/login").post(adminLogin);

export default router;