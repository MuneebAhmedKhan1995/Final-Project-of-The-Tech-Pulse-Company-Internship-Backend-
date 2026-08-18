import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createTransporter = () => {
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'your-ethereal-email@ethereal.email',
        pass: 'your-ethereal-password'
      }
    });
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

const sendOrderConfirmationEmail = async (userEmail, userName, orderId, items, total, shippingAddress) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ Email credentials not configured. Skipping email send.');
      return;
    }

    const orderDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const itemsList = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.name}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.price || 0).toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${((item.price || 0) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"${process.env.STORE_NAME || 'Your Store'}" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎉 Order Confirmed! #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">Order Confirmed! 🎉</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Thank you for your purchase</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px 30px 20px;">
                      <!-- Greeting -->
                      <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 8px;">Hello ${userName || 'Valued Customer'},</h2>
                      <p style="color: #6b7280; margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
                        Your order has been placed successfully and is being processed. Here are your order details:
                      </p>
                      
                      <!-- Order Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <tr>
                          <td style="padding: 4px 0;">
                            <strong style="color: #4b5563;">Order Number:</strong> 
                            <span style="color: #1f2937;">#${orderId}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0;">
                            <strong style="color: #4b5563;">Order Date:</strong> 
                            <span style="color: #1f2937;">${orderDate}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0;">
                            <strong style="color: #4b5563;">Payment Status:</strong> 
                            <span style="color: #10b981; font-weight: 600;">Paid ✓</span>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Order Items -->
                      <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 12px;">Order Summary</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                        <thead>
                          <tr style="background-color: #f9fafb;">
                            <th style="padding: 10px 12px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;">Product</th>
                            <th style="padding: 10px 12px; text-align: center; font-size: 13px; color: #6b7280; font-weight: 600;">Qty</th>
                            <th style="padding: 10px 12px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Price</th>
                            <th style="padding: 10px 12px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itemsList}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; color: #4b5563;">Subtotal</td>
                            <td style="padding: 12px; text-align: right; color: #1f2937;">$${(total || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colspan="3" style="padding: 4px 12px; text-align: right; color: #6b7280; font-size: 14px;">Shipping</td>
                            <td style="padding: 4px 12px; text-align: right; color: #6b7280; font-size: 14px;">${total > 100 ? 'FREE' : '$10.00'}</td>
                          </tr>
                          <tr style="border-top: 2px solid #e5e7eb;">
                            <td colspan="3" style="padding: 12px; text-align: right; font-size: 18px; font-weight: 700; color: #1f2937;">Total</td>
                            <td style="padding: 12px; text-align: right; font-size: 18px; font-weight: 700; color: #667eea;">$${(total || 0).toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                      
                      <!-- Shipping Address -->
                      ${shippingAddress ? `
                        <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
                          <h4 style="color: #1f2937; font-size: 14px; margin: 0 0 8px;">📦 Shipping Address</h4>
                          <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
                            ${shippingAddress.street}<br>
                            ${shippingAddress.city}, ${shippingAddress.province} ${shippingAddress.postalCode}<br>
                            ${shippingAddress.country}
                          </p>
                        </div>
                      ` : ''}
                      
                      <!-- Next Steps -->
                      <div style="margin-top: 24px; padding: 20px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <h4 style="color: #1f2937; font-size: 14px; margin: 0 0 8px;">📋 What's Next?</h4>
                        <ul style="color: #6b7280; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                          <li>We'll process your order within 24 hours</li>
                          <li>You'll receive a shipping confirmation with tracking details</li>
                          <li>Estimated delivery: 3-5 business days</li>
                        </ul>
                      </div>
                      
                      <!-- Footer -->
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px;">
                          Need help? Contact our support team at 
                          <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}" style="color: #667eea; text-decoration: none;">
                            ${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}
                          </a>
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          © ${new Date().getFullYear()} ${process.env.STORE_NAME || 'Your Store'}. All rights reserved.
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Order confirmation email sent successfully');
  } catch (error) {
    console.error('❌ Email error:', error.message);
  }
};

export const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const requiredFields = ['street', 'city', 'province', 'postalCode', 'country'];
    for (const field of requiredFields) {
      if (!shippingAddress[field]) {
        return res.status(400).json({ message: `Shipping address ${field} is required` });
      }
    }

    let itemsPrice = 0;
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}. Available: ${product.stock}` });
      }
      const price = product.discountPrice || product.price;
      itemsPrice += price * item.quantity;
    }

    const shippingPrice = itemsPrice > 100 ? 0 : 10;
    const totalPrice = itemsPrice + shippingPrice;

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      itemsPrice,
      shippingPrice,
      totalPrice,
      status: 'Pending',
      isPaid: false,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100),
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    order.stripePaymentId = paymentIntent.id;
    await order.save();

    res.status(201).json({
      success: true,
      order,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    if (!order.stripePaymentId) {
      return res.status(400).json({ 
        success: false,
        message: 'No payment found for this order' 
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentId);

    if (paymentIntent.status === 'succeeded') {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = 'Processing';
      await order.save();

      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock -= item.quantity;
          await product.save();
        }
      }

      const user = await User.findById(req.user._id);

      try {
        await sendOrderConfirmationEmail(
          user.email,
          user.name || 'Valued Customer',
          order._id.toString(),
          order.orderItems,
          order.totalPrice,
          order.shippingAddress
        );
        console.log('✅ Email sent successfully');
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError.message);
      }
      const orderData = {
        _id: order._id.toString(), 
        totalPrice: order.totalPrice,
        status: order.status,
        orderItems: order.orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          product: item.product
        })),
        shippingAddress: {
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          province: order.shippingAddress.province,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country
        },
        itemsPrice: order.itemsPrice,
        shippingPrice: order.shippingPrice,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
        user: order.user
      };

      console.log('📦 SENDING ORDER DATA:', orderData);

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        order: orderData
      });
    } else {
      return res.status(400).json({ 
        success: false,
        message: `Payment not successful. Status: ${paymentIntent.status}` 
      });
    }
  } catch (error) {
    console.error('❌ Payment confirmation error:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};