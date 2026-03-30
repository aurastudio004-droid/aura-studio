const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/categories/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get all categories (Public)
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all categories including inactive (Admin)
router.get('/all', protect, async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single category
router.get('/:slug', async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create category (Admin)
router.post('/', protect, upload.single('image'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const category = new Category({
            name,
            slug,
            description,
            image: req.file ? `/uploads/categories/${req.file.filename}` : ''
        });

        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update category (Admin)
router.put('/:id', protect, upload.single('image'), async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        category.name = name || category.name;
        category.slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : category.slug;
        category.description = description || category.description;
        category.isActive = isActive !== undefined ? isActive : category.isActive;
        
        if (req.file) {
            category.image = `/uploads/categories/${req.file.filename}`;
        }

        await category.save();
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete category (Admin)
router.delete('/:id', protect, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;