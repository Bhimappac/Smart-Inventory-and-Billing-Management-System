const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schemaOptions = {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      delete ret.__v;
      return ret;
    }
  }
};

// 1. User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'admin' }
}, schemaOptions);

// 2. Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' }
}, schemaOptions);

// 3. Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  stock_quantity: { type: Number, default: 0 },
  reorder_level: { type: Number, default: 10 },
  purchase_price: { type: Number, required: true },
  selling_price: { type: Number, required: true },
  gst_rate: { type: Number, default: 18 },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

// Virtual for category_name which is needed by frontend
productSchema.virtual('category_name').get(function() {
  return this.category_id && this.category_id.name ? this.category_id.name : null;
});

// 4. Invoice Schema
const invoiceItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  gst_rate: { type: Number, required: true },
  gst_amount: { type: Number, required: true },
  total_price: { type: Number, required: true }
}, schemaOptions);

const invoiceSchema = new mongoose.Schema({
  invoice_number: { type: String, required: true, unique: true },
  customer_name: { type: String, required: true },
  customer_phone: { type: String, required: true },
  subtotal: { type: Number, required: true },
  gst_amount: { type: Number, required: true },
  grand_total: { type: Number, required: true },
  payment_mode: { type: String, default: 'Cash' },
  items: [invoiceItemSchema],
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

// Models
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);

const initializeDatabase = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_inventory';
  
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB database.');
    
    // Seed default admin user if none exists
    const adminCount = await User.countDocuments({ username: 'admin' });
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      const newAdmin = new User({
        username: 'admin',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'admin'
      });
      await newAdmin.save();
      console.log('Seeded default admin user: admin / admin123');
    }
    
    // Seed categories if empty
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const electronics = new Category({ name: 'Electronics', description: 'Devices, gadgets and components' });
      const groceries = new Category({ name: 'Groceries', description: 'Daily essential foods and items' });
      const apparel = new Category({ name: 'Apparel', description: 'Clothing and fashion items' });
      
      await electronics.save();
      await groceries.save();
      await apparel.save();
      console.log('Seeded demo categories.');
      
      // Seed products if empty
      const productCount = await Product.countDocuments();
      if (productCount === 0) {
        await Product.create([
          {
            name: 'Wireless Mouse',
            sku: 'SKU-ELEC-001',
            category_id: electronics._id,
            stock_quantity: 25,
            reorder_level: 5,
            purchase_price: 250.00,
            selling_price: 450.00,
            gst_rate: 18
          },
          {
            name: 'Mechanical Keyboard',
            sku: 'SKU-ELEC-002',
            category_id: electronics._id,
            stock_quantity: 8,
            reorder_level: 10,
            purchase_price: 1200.00,
            selling_price: 2200.00,
            gst_rate: 18
          },
          {
            name: 'Organic Oats 1kg',
            sku: 'SKU-GROC-001',
            category_id: groceries._id,
            stock_quantity: 50,
            reorder_level: 15,
            purchase_price: 120.00,
            selling_price: 180.00,
            gst_rate: 5
          },
          {
            name: 'Olive Oil 1L',
            sku: 'SKU-GROC-002',
            category_id: groceries._id,
            stock_quantity: 3,
            reorder_level: 5,
            purchase_price: 600.00,
            selling_price: 850.00,
            gst_rate: 5
          }
        ]);
        console.log('Seeded demo products.');
      }
    }
    
    console.log('Database verification completed successfully.');
  } catch (error) {
    console.error('Database connection / initialization error:', error);
    throw error;
  }
};

module.exports = {
  User,
  Category,
  Product,
  Invoice,
  initializeDatabase
};
