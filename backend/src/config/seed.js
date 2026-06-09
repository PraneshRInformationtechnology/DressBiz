const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const exists = await User.findOne({ email: 'admin@dress.com' });
    if (!exists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@dress.com',
        password: 'Admin@123',
        role: 'admin'
      });
      console.log('✅ Default admin created: admin@dress.com / Admin@123');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

module.exports = { seedAdmin };
