import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import upload, { debugUpload } from '../middleware/upload.js';

const router = express.Router();


router.get('/', getCategories);
router.post(
  '/', 
  verifyToken, 
  isAdmin,
  debugUpload, 
  upload.single('image'),
  createCategory
);

router.put(
  '/:id',
  verifyToken,
  isAdmin,
  debugUpload,
  upload.single('image'),
  updateCategory
);

router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  deleteCategory
);

export default router;