import { Router } from "express";
import { browse } from "../controllers/browse.controllers.js";

const router = Router();

router.route("/list").get(browse);

export default router;