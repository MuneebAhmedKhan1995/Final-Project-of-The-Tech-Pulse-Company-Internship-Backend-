import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getMe,
  updateProfile,
  changePassword
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);
router.get('/me', verifyToken, getMe);
router.put('/me', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

export default router;