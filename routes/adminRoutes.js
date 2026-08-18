import express from 'express';
import {
  getAllOrders,
  updateOrderStatus,
  getAdminStats,
  getRevenueChart,
  getAllCustomers,
  deleteUser,
} from '../controllers/adminController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/orders', verifyToken, isAdmin, getAllOrders);
router.put('/orders/:id/status', verifyToken, isAdmin, updateOrderStatus);

router.get('/stats', verifyToken, isAdmin, getAdminStats);
router.get('/revenue-chart', verifyToken, isAdmin, getRevenueChart);

router.get('/users', verifyToken, isAdmin, getAllCustomers);
router.delete('/users/:id', verifyToken, isAdmin, deleteUser);

export default router;
