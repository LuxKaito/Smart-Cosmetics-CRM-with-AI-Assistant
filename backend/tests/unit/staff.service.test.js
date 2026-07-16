const StaffService = require('../../src/application/services/StaffService');

describe('StaffService', () => {
  it('confirms a pending order through the staff flow', async () => {
    const orderRepository = {
      findRawById: jest.fn().mockResolvedValue({
        _id: 'order-1',
        orderStatus: 'PENDING_CONFIRMATION',
        paymentMethod: 'COD'
      }),
      updateById: jest.fn().mockResolvedValue({
        _id: 'order-1',
        orderStatus: 'CONFIRMED'
      })
    };
    const service = new StaffService({ orderRepository, userRepository: {} });

    const order = await service.confirmOrder('order-1');

    expect(orderRepository.updateById).toHaveBeenCalledWith('order-1', {
      orderStatus: 'CONFIRMED'
    });
    expect(order.orderStatus).toBe('CONFIRMED');
  });

  it('rejects non-customer targets from customer detail endpoints', async () => {
    const userRepository = {
      findById: jest.fn().mockResolvedValue({
        _id: 'admin-1',
        role: 'admin'
      })
    };
    const service = new StaffService({ orderRepository: {}, userRepository });

    await expect(service.getCustomerDetail('admin-1')).rejects.toMatchObject({
      code: 'INVALID_CUSTOMER_TARGET'
    });
  });
});
