const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Admin Profile
router.get('/profile', protect, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id).select('-password');
        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Admin Password
router.put('/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const admin = await Admin.findById(req.admin._id);

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        admin.password = await bcrypt.hash(newPassword, 10);
        await admin.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Dashboard Stats
router.get('/dashboard', protect, async (req, res) => {
    try {
        const Order = require('../models/Order');
        const Product = require('../models/Product');
        const Category = require('../models/Category');

        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
        const totalProducts = await Product.countDocuments();
        const totalCategories = await Category.countDocuments();
        
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('items.product');

        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: 'verified' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        res.json({
            totalOrders,
            pendingOrders,
            totalProducts,
            totalCategories,
            totalRevenue: totalRevenue[0]?.total || 0,
            recentOrders
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;