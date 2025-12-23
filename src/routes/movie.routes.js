import { Router } from "express";
import { detail, list } from "../controllers/movie.controllers.js";

const router = Router();

router.route("/list").get(list);
router.route("/details/:id").get(detail);

export default router;