const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || 'smilecare',
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    // Fail visibly if legacy duplicate invoices prevent the business constraint.
    // Do not delete or merge historical financial records automatically.
    await require('../models/Invoice').createIndexes();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
