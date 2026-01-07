import express from "express";
import { list } from "../controllers/watchHistory.controllers.js";

const router = express.Router();

router.route("/list").get(list);

export default router;