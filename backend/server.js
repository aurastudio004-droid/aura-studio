const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully');
        
        // Create default admin
        const Admin = require('./models/Admin');
        const bcrypt = require('bcryptjs');
        
        Admin.findOne({ email: process.env.ADMIN_EMAIL }).then(async (admin) => {
            if (!admin) {
                const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
                await Admin.create({
                    name: 'Aura Studio Admin',
                    email: process.env.ADMIN_EMAIL,
                    password: hashedPassword
                });
                console.log('✅ Default Admin Created');
            }
        });
        
        // Create default categories
        const Category = require('./models/Category');
        const defaultCategories = [
            { name: 'Formal Suits', slug: 'formal-suits', description: 'Elegant formal stitched suits for special occasions' },
            { name: 'Casual Suits', slug: 'casual-suits', description: 'Comfortable casual wear for everyday use' },
            { name: 'Party Wear', slug: 'party-wear', description: 'Glamorous party wear suits' },
            { name: 'Bridal Collection', slug: 'bridal-collection', description: 'Beautiful bridal and wedding suits' },
            { name: 'Summer Collection', slug: 'summer-collection', description: 'Light and breezy summer suits' },
            { name: 'Winter Collection', slug: 'winter-collection', description: 'Warm and stylish winter suits' },
            { name: 'Lawn Suits', slug: 'lawn-suits', description: 'Premium lawn fabric suits' },
            { name: 'Chiffon Suits', slug: 'chiffon-suits', description: 'Elegant chiffon suits' }
        ];
        
        defaultCategories.forEach(async (cat) => {
            const exists = await Category.findOne({ slug: cat.slug });
            if (!exists) {
                await Category.create(cat);
            }
        });
    })
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});