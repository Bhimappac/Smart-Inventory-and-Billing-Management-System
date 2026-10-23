const express = require('express');
const router = express.Router();
const { Category, Product } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// @route   GET api/categories
// @desc    Get all categories
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error('Fetch categories error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/categories
// @desc    Create a category
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    // Check if category already exists
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const newCategory = new Category({
      name: name.trim(),
      description: description ? description.trim() : ''
    });
    await newCategory.save();

    res.status(201).json(newCategory);
  } catch (err) {
    console.error('Create category error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/categories/:id
// @desc    Update a category
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, description } = req.body;
  const { id } = req.params;

  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check name collision
    const existing = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    category.name = name.trim();
    category.description = description ? description.trim() : '';
    await category.save();

    res.json(category);
  } catch (err) {
    console.error('Update category error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/categories/:id
// @desc    Delete a category
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category is used in products
    const linkedProduct = await Product.findOne({ category_id: id });
    if (linkedProduct) {
      return res.status(400).json({ message: 'Cannot delete category containing active products. Reassign or delete the products first.' });
    }

    await Category.findByIdAndDelete(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
