import { Router } from "express";
import { verifyJWT } from "../middlewares/varifyJwt.middleware.js";
import { authorizeRole } from "../middlewares/autherizeRole.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { videoList, createVideo, videoDetials, updateVideo, deletedVideo} from "../controllers/video.controllers.js";

const router = Router();

router.route("/list").get(videoList);
router.route("/create").post(verifyJWT, authorizeRole("admin"), upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "video", maxCount: 1 }, { name: "trailer", maxCount: 1 }]), createVideo);
router.route("/detials/:id").get(videoDetials);
router.route("/update").put(verifyJWT, authorizeRole("admin"),  upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "video", maxCount: 1 }, { name: "trailer", maxCount: 1 }]), updateVideo);
router.route("/delete").delete(verifyJWT, authorizeRole("admin"),deletedVideo);

export default router;
