require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin exists
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (adminExists) {
      console.log('⚠️  Admin already exists');
    } else {
      // Create predefined admin
      const admin = new User({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        program: 'General',
        fullName: 'System Administrator'
      });

      await admin.save();
      console.log('✅ Admin created successfully');
      console.log(`📧 Email: ${process.env.ADMIN_EMAIL}`);
      console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD}`);
    }

    // Create sample users
    const sampleUsers = [
      { email: 'student1@college.edu', password: 'Student@123', role: 'student', program: 'AIDA', fullName: 'John Doe' },
      { email: 'faculty1@college.edu', password: 'Faculty@123', role: 'faculty', program: 'AIML', fullName: 'Dr. Jane Smith' },
      { email: 'student2@college.edu', password: 'Student@123', role: 'student', program: 'CYB & IOT', fullName: 'Alice Johnson' }
    ];

    for (const userData of sampleUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${userData.email}`);
      }
    }

    console.log('\n✨ Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();

