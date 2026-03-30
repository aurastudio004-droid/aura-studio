const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = 'uploads/products/';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
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

// Get all products (Public) with filters
router.get('/', async (req, res) => {
    try {
        const { category, search, sort, featured, newArrivals, bestSeller, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
        
        let query = { isActive: true };

        if (category) {
            const cat = await Category.findOne({ slug: category });
            if (cat) {
                query.category = cat._id;
            }
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (featured === 'true') query.isFeatured = true;
        if (newArrivals === 'true') query.isNewArrival = true;
        if (bestSeller === 'true') query.isBestSeller = true;

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'price-low') sortOption = { price: 1 };
        if (sort === 'price-high') sortOption = { price: -1 };
        if (sort === 'name') sortOption = { name: 1 };
        if (sort === 'newest') sortOption = { createdAt: -1 };

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            products,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all products (Admin)
router.get('/admin/all', protect, async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category')
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single product by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug })
            .populate('category');
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Increment views
        product.views += 1;
        await product.save();

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category');
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create product (Admin)
router.post('/', protect, upload.array('images', 5), async (req, res) => {
    try {
        const { 
            name, description, price, salePrice, category, 
            sizes, colors, fabric, stock, 
            isFeatured, isNewArrival, isBestSeller 
        } = req.body;

        const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

        const product = new Product({
            name,
            description,
            price: Number(price),
            salePrice: Number(salePrice) || 0,
            category,
            images,
            sizes: sizes ? JSON.parse(sizes) : [],
            colors: colors ? JSON.parse(colors) : [],
            fabric,
            stock: Number(stock) || 0,
            isFeatured: isFeatured === 'true',
            isNewArrival: isNewArrival === 'true',
            isBestSeller: isBestSeller === 'true'
        });

        await product.save();
        
        const populatedProduct = await Product.findById(product._id).populate('category');
        res.status(201).json(populatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update product (Admin)
router.put('/:id', protect, upload.array('images', 5), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const { 
            name, description, price, salePrice, category, 
            sizes, colors, fabric, stock, isActive,
            isFeatured, isNewArrival, isBestSeller,
            removeImages
        } = req.body;

        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price ? Number(price) : product.price;
        product.salePrice = salePrice ? Number(salePrice) : product.salePrice;
        product.category = category || product.category;
        product.fabric = fabric || product.fabric;
        product.stock = stock ? Number(stock) : product.stock;
        product.isActive = isActive !== undefined ? isActive === 'true' : product.isActive;
        product.isFeatured = isFeatured !== undefined ? isFeatured === 'true' : product.isFeatured;
        product.isNewArrival = isNewArrival !== undefined ? isNewArrival === 'true' : product.isNewArrival;
        product.isBestSeller = isBestSeller !== undefined ? isBestSeller === 'true' : product.isBestSeller;

        if (sizes) product.sizes = JSON.parse(sizes);
        if (colors) product.colors = JSON.parse(colors);

        // Handle image removal
        if (removeImages) {
            const imagesToRemove = JSON.parse(removeImages);
            product.images = product.images.filter(img => !imagesToRemove.includes(img));
        }

        // Add new images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
            product.images = [...product.images, ...newImages];
        }

        await product.save();
        
        const populatedProduct = await Product.findById(product._id).populate('category');
        res.json(populatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete product (Admin)
router.delete('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get related products
router.get('/related/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: product._id },
            isActive: true
        })
        .limit(4)
        .populate('category');

        res.json(relatedProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;