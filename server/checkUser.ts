import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './src/models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const email = 'admin@jesegypttour.com';
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`User ${email} NOT FOUND`);
      process.exit(1);
    }

    console.log('User found:', user.email);
    console.log('Role:', user.role);
    console.log('Is Active:', user.isActive);
    
    const isMatch = await bcrypt.compare('admin123', user.password);
    console.log('Password "admin123" matches:', isMatch);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

check();
