const ReviewRepository = require('../../../domain/repositories/ReviewRepository');
const Review = require('../models/ReviewModel');

class MongoReviewRepository extends ReviewRepository {
  async listByProduct(productId) {
    return Review.find({ product: productId })
      .sort({ createdAt: -1 })
      .select('userName userEmail rating comment verifiedPurchase createdAt updatedAt');
  }

  async findByUserAndProduct(userId, productId) {
    return Review.findOne({ user: userId, product: productId });
  }

  async create(data) {
    return Review.create(data);
  }

  async summaryByProduct(productId) {
    const [summary] = await Review.aggregate([
      { $match: { product: normalizeObjectId(productId) } },
      {
        $group: {
          _id: '$product',
          rating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    return {
      rating: summary?.rating ? Math.round(summary.rating * 10) / 10 : 0,
      reviewCount: summary?.reviewCount || 0
    };
  }
}

const normalizeObjectId = (value) => {
  const mongoose = require('mongoose');
  return new mongoose.Types.ObjectId(String(value));
};

module.exports = MongoReviewRepository;
