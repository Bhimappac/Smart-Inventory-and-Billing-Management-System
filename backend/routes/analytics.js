const express = require('express');
const router = express.Router();
const { Invoice, Product, Category } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// @route   GET api/analytics/dashboard
// @desc    Get dashboard metrics & sales history trend
// @access  Private
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    // 1. Overall Stats
    const overallStats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          total_invoices: { $sum: 1 },
          total_sales: { $sum: "$grand_total" },
          total_subtotal: { $sum: "$subtotal" },
          total_gst: { $sum: "$gst_amount" }
        }
      }
    ]);
    
    const salesStats = overallStats[0] || { 
      total_invoices: 0, 
      total_sales: 0, 
      total_subtotal: 0, 
      total_gst: 0 
    };

    // 2. Profit calculation: Sum of ((unit_price - purchase_price) * quantity)
    const profitStatsResult = await Invoice.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $project: {
          profit: {
            $multiply: [
              {
                $subtract: [
                  "$items.unit_price",
                  {
                    $ifNull: [
                      { $arrayElemAt: ["$product.purchase_price", 0] },
                      { $multiply: ["$items.unit_price", 0.7] } // default estimate
                    ]
                  }
                ]
              },
              "$items.quantity"
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          total_profit: { $sum: "$profit" }
        }
      }
    ]);

    const profitStats = profitStatsResult[0] || { total_profit: 0 };

    // 3. Low stock count
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ["$stock_quantity", "$reorder_level"] }
    });

    // 4. Products count
    const totalProducts = await Product.countDocuments();

    // 5. Category breakdown
    const categoryBreakdown = await Category.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category_id",
          as: "products"
        }
      },
      {
        $project: {
          name: 1,
          product_count: { $size: "$products" }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // 6. Last 7 days sales trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const last7DaysSales = await Invoice.aggregate([
      {
        $match: {
          created_at: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          sales: { $sum: "$grand_total" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          sales: 1,
          count: 1
        }
      }
    ]);

    // Merge query results with date keys to fill missing days with 0
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dbRow = last7DaysSales.find(row => row.date === dateStr);
      trendData.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: dbRow ? dbRow.sales : 0,
        invoices: dbRow ? dbRow.count : 0
      });
    }

    res.json({
      summary: {
        totalSales: salesStats.total_sales,
        totalInvoices: salesStats.total_invoices,
        totalGst: salesStats.total_gst,
        totalProfit: profitStats.total_profit,
        lowStockCount: lowStockCount,
        totalProducts: totalProducts
      },
      categoryDistribution: categoryBreakdown,
      salesTrend: trendData
    });

  } catch (err) {
    console.error('Analytics dashboard error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
