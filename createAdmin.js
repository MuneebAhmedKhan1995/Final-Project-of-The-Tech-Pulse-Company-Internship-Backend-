import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected');

    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (adminExists) {
      console.log('⚠️ Admin already exists');
      process.exit();
    }
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin123', 
      role: 'admin',
      address: {
        street: '123 Admin St',
        city: 'Admin City',
        province: 'Admin Province',
        postalCode: '12345',
        country: 'Pakistan',
      },
      phone: '1234567890',
    });

    process.exit();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ETIMEOUT') {
      console.log('💡 Tip: Check your internet connection or MongoDB Atlas IP whitelist');
    }
    process.exit(1);
  }
};

createAdmin();