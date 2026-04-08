import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import { DEFAULT_ADMIN_PERMISSIONS } from '../permissions';

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const adminEmail = 'admin@jesegypttour.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      existingAdmin.role = 'superadmin' as any;
      (existingAdmin as any).permissions = (existingAdmin as any).permissions || DEFAULT_ADMIN_PERMISSIONS;
      existingAdmin.isActive = true;
      existingAdmin.password = 'admin123'; // Reset password to what was requested
      await existingAdmin.save();

      console.log('✅ Admin user updated successfully');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);
      console.log('🛡️  Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create superadmin user
    const admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: 'admin123',
      role: 'superadmin',
      permissions: DEFAULT_ADMIN_PERMISSIONS,
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: admin123');
    console.log('👤 Name:', admin.name);
    console.log('🛡️  Role:', admin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
