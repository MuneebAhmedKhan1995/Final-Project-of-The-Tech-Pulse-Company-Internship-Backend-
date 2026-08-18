import express from 'express';
import {
  createOrder,
  confirmPayment,
  getMyOrders,
  getOrderById,
  cancelOrder,
} from '../controllers/orderController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, createOrder);
router.post('/:id/pay', verifyToken, confirmPayment);
router.get('/my', verifyToken, getMyOrders);
router.get('/:id', verifyToken, getOrderById);
router.delete('/:id', verifyToken, cancelOrder);

export default router;