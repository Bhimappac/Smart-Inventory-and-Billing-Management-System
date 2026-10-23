const express = require('express');
const router = express.Router();
const { Invoice, Product } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// @route   POST api/billing/invoice
// @desc    Create a new invoice and deduct stock
// @access  Private
router.post('/invoice', authMiddleware, async (req, res) => {
  const { customer_name, customer_phone, items, payment_mode } = req.body;

  if (!customer_name || !customer_phone || !items || !items.length) {
    return res.status(400).json({ message: 'Invalid invoice details. Customer name, phone, and items are required.' });
  }

  try {
    // Generate Invoice Number: INV-YYYYMMDD-XXX
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const count = await Invoice.countDocuments({
      created_at: { $gte: startOfDay, $lte: endOfDay }
    });

    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const nextSeq = String(count + 1).padStart(3, '0');
    const invoiceNumber = `INV-${dateStr}-${nextSeq}`;

    let subtotal = 0;
    let gst_amount = 0;
    let grand_total = 0;
    const processedItems = [];

    // Let's do stock check first
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(404).json({ message: `Product not found.` });
      }

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for product "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}` 
        });
      }

      // Calculations
      const unitPrice = product.selling_price; // Selling price excluding GST
      const itemGstRate = product.gst_rate;
      const itemGstAmount = (unitPrice * (itemGstRate / 100)) * item.quantity;
      const itemTotalPrice = (unitPrice * item.quantity) + itemGstAmount;

      subtotal += unitPrice * item.quantity;
      gst_amount += itemGstAmount;
      grand_total += itemTotalPrice;

      processedItems.push({
        product_id: product._id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        gst_rate: itemGstRate,
        gst_amount: itemGstAmount,
        total_price: itemTotalPrice
      });
    }

    // Create Invoice Header & Items
    const invoice = new Invoice({
      invoice_number: invoiceNumber,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      subtotal,
      gst_amount,
      grand_total,
      payment_mode: payment_mode || 'Cash',
      items: processedItems
    });

    await invoice.save();

    // Deduct product stock
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { stock_quantity: -item.quantity }
      });
    }

    // Return the response matching the frontend's expected format
    res.status(201).json({
      invoice: invoice,
      items: invoice.items
    });

  } catch (err) {
    console.error('Invoice creation error:', err.message);
    res.status(500).json({ message: 'Server error during invoice creation' });
  }
});

// @route   GET api/billing/invoices
// @desc    Get list of all invoices (with optional search)
// @access  Private
router.get('/invoices', authMiddleware, async (req, res) => {
  const { search } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { customer_name: { $regex: search, $options: 'i' } },
      { customer_phone: { $regex: search, $options: 'i' } },
      { invoice_number: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    const invoices = await Invoice.find(filter).sort({ created_at: -1 });
    res.json(invoices);
  } catch (err) {
    console.error('Fetch invoices error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/billing/invoices/:id
// @desc    Get detailed invoice
// @access  Private
router.get('/invoices/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ 
      invoice: invoice, 
      items: invoice.items 
    });
  } catch (err) {
    console.error('Fetch invoice details error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
