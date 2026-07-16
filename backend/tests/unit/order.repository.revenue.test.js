jest.mock('../../src/infrastructure/database/models/OrderModel', () => ({
  aggregate: jest.fn()
}));

const Order = require('../../src/infrastructure/database/models/OrderModel');
const MongoOrderRepository = require('../../src/infrastructure/database/repositories/MongoOrderRepository');

describe('MongoOrderRepository revenue filters', () => {
  beforeEach(() => {
    Order.aggregate.mockReset();
  });

  it('excludes cancelled paid orders from total revenue', async () => {
    Order.aggregate.mockResolvedValue([]);
    const repository = new MongoOrderRepository();

    await repository.revenue();

    expect(Order.aggregate).toHaveBeenCalledWith([
      {
        $match: {
          $and: [
            { orderStatus: { $ne: 'CANCELLED' } },
            {
              $or: [
                { paymentStatus: 'PAID' },
                { orderStatus: { $in: ['SHIPPING', 'DELIVERED'] } }
              ]
            }
          ]
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
  });
});
