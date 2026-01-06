import { Router } from "express";
import { create, deleteVideo, list } from "../controllers/myList.controllers.js";

const router = Router();

router.route("/list").get(list);
router.route("/add").post(create);
router.route("/remove/:videoId").delete(deleteVideo);

export default router;