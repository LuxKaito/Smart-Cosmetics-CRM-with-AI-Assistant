const {
  createProductSchema,
  updateProductSchema
} = require('../../src/application/dtos/adminDtos');

describe('Admin product DTOs', () => {
  it('keeps editable description fields when validating product updates', () => {
    const payload = {
      shortDescription: 'Mô tả ngắn',
      detailDescription: 'Thông tin chi tiết'
    };

    const { error, value } = updateProductSchema.validate(payload, {
      stripUnknown: true
    });

    expect(error).toBeUndefined();
    expect(value).toEqual(payload);
  });

  it('keeps editable description fields when validating product creation', () => {
    const payload = {
      name: 'Serum demo',
      sale_price: 150000,
      shortDescription: 'Mô tả ngắn',
      detailDescription: 'Thông tin chi tiết'
    };

    const { error, value } = createProductSchema.validate(payload, {
      stripUnknown: true
    });

    expect(error).toBeUndefined();
    expect(value).toEqual(expect.objectContaining(payload));
  });

  it('accepts an empty optional SKU from the admin product form', () => {
    const { error, value } = updateProductSchema.validate(
      { sku: '' },
      { stripUnknown: true }
    );

    expect(error).toBeUndefined();
    expect(value.sku).toBe('');
  });
});
