require('dotenv').config();
const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const Product = require('../infrastructure/database/models/ProductModel');

async function clearSampleCatalog() {
  await connectDatabase();
  const productsResult = await Product.deleteMany({});
  const categoriesResult = await mongoose.connection.collection('categories').deleteMany({});
  console.log('[clear:catalog] products deleted:', productsResult.deletedCount);
  console.log('[clear:catalog] categories deleted:', categoriesResult.deletedCount);
  await disconnectDatabase();
}

clearSampleCatalog()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('[clear:catalog] failed:', error.message);
    await disconnectDatabase();
    process.exit(1);
  });
