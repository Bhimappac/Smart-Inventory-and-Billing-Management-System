const express = require('express');
const router = express.Router();
const { Product } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// @route   GET api/products
// @desc    Get all products (with optional search, category filter)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  const { search, category_id } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
  }

  if (category_id) {
    filter.category_id = category_id;
  }

  try {
    const products = await Product.find(filter).populate('category_id').sort({ name: 1 });
    res.json(products);
  } catch (err) {
    console.error('Fetch products error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/products/low-stock
// @desc    Get products with stock <= reorder_level
// @access  Private
router.get('/low-stock', authMiddleware, async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ["$stock_quantity", "$reorder_level"] }
    }).populate('category_id').sort({ stock_quantity: 1 });
    
    res.json(lowStockProducts);
  } catch (err) {
    console.error('Fetch low stock products error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/products
// @desc    Create a product
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const { 
    name, 
    sku, 
    category_id, 
    stock_quantity, 
    reorder_level, 
    purchase_price, 
    selling_price, 
    gst_rate 
  } = req.body;

  // Validation
  if (!name || !sku || purchase_price === undefined || selling_price === undefined) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  try {
    // Check SKU uniqueness
    const existing = await Product.findOne({ sku: sku.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'A product with this SKU already exists' });
    }

    const newProduct = new Product({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category_id: category_id || null,
      stock_quantity: stock_quantity || 0,
      reorder_level: reorder_level !== undefined ? reorder_level : 10,
      purchase_price,
      selling_price,
      gst_rate: gst_rate !== undefined ? gst_rate : 18
    });
    
    await newProduct.save();
    await newProduct.populate('category_id');

    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Create product error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  const { 
    name, 
    sku, 
    category_id, 
    stock_quantity, 
    reorder_level, 
    purchase_price, 
    selling_price, 
    gst_rate 
  } = req.body;
  const { id } = req.params;

  // Validation
  if (!name || !sku || purchase_price === undefined || selling_price === undefined) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check SKU collision
    const existing = await Product.findOne({ sku: sku.trim().toUpperCase(), _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: 'A product with this SKU already exists' });
    }

    product.name = name.trim();
    product.sku = sku.trim().toUpperCase();
    product.category_id = category_id || null;
    product.stock_quantity = stock_quantity || 0;
    product.reorder_level = reorder_level !== undefined ? reorder_level : 10;
    product.purchase_price = purchase_price;
    product.selling_price = selling_price;
    product.gst_rate = gst_rate !== undefined ? gst_rate : 18;

    await product.save();
    await product.populate('category_id');

    res.json(product);
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
