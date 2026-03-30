const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = 'uploads/payments/';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for payment screenshots
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Create order (Public)
router.post('/', upload.single('paymentScreenshot'), async (req, res) => {
    try {
        const {
            customerName,
            customerEmail,
            customerPhone,
            customerWhatsapp,
            customerAddress,
            customerCity,
            customerProvince,
            customerPostalCode,
            items,
            subtotal,
            shippingCost,
            total,
            paymentMethod,
            notes
        } = req.body;

        const parsedItems = JSON.parse(items);

        const order = new Order({
            customer: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
                whatsapp: customerWhatsapp || customerPhone,
                address: customerAddress,
                city: customerCity,
                province: customerProvince,
                postalCode: customerPostalCode
            },
            items: parsedItems,
            subtotal: Number(subtotal),
            shippingCost: Number(shippingCost),
            total: Number(total),
            paymentMethod,
            paymentScreenshot: req.file ? `/uploads/payments/${req.file.filename}` : '',
            notes
        });

        await order.save();

        // Update product stock
        for (const item of parsedItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        res.status(201).json({
            success: true,
            order,
            message: 'Order placed successfully!'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all orders (Admin)
router.get('/', protect, async (req, res) => {
    try {
        const { status, paymentStatus, page = 1, limit = 20 } = req.query;
        
        let query = {};
        if (status) query.orderStatus = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            orders,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single order (Admin)
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Track order by order number (Public)
router.get('/track/:orderNumber', async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber });
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Return limited info for public tracking
        res.json({
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
            trackingNumber: order.trackingNumber
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status (Admin)
router.put('/:id', protect, async (req, res) => {
    try {
        const { orderStatus, paymentStatus, trackingNumber, adminNotes } = req.body;
        
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (orderStatus) order.orderStatus = orderStatus;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (adminNotes) order.adminNotes = adminNotes;

        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete order (Admin)
router.delete('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;