import { Router } from "express";
import { list } from "../controllers/home.controllers.js";

const router = Router();

router.route("/list").get(list);

export default router;