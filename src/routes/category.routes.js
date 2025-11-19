import { Router } from "express";
import { createCategory, categoryList, categoryDetails, updateCategory, deleteCategory} from "../controllers/category.controllers.js";
import { verifyJWT } from "../middlewares/varifyJwt.middleware.js";
import { authorizeRole } from "../middlewares/autherizeRole.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route('/create').post(verifyJWT, authorizeRole("admin"),  upload.single("thumbnail"), createCategory);
router.route('/list').get(categoryList);
router.route('/details/:id').get(categoryDetails);
router.route('/update/:id').put(verifyJWT, authorizeRole("admin"), upload.single("thumbnail"), updateCategory);
router.route('/delete/:id').delete(verifyJWT, authorizeRole("admin"), deleteCategory);

export default router;