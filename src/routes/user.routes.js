import { Router } from "express";
import { userList, userDetials,userCreate, deleteUser, updateUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/list").get(userList);
router.route("/details/:id").get(userDetials);
router.route("/create").post(upload.single("avatar"), userCreate);
router.route("/update/:id").put(upload.single("avatar"), updateUser);
router.route('/delete/:id').delete(deleteUser);

export default router;
