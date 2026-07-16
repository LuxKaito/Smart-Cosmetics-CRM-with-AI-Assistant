const {
  escapeRegex,
  normalizeVietnameseText,
  buildVietnameseInsensitivePattern,
  buildProductSearchQuery
} = require('../../src/shared/utils/productSearch');

describe('Vietnamese product search helpers', () => {
  it('normalizes Vietnamese accents without dropping words', () => {
    expect(normalizeVietnameseText('  Serum   dưỡng ẩm  ')).toBe('serum duong am');
    expect(normalizeVietnameseText('Sữa rửa mặt')).toBe('sua rua mat');
  });

  it('escapes regex metacharacters', () => {
    expect(escapeRegex('serum (B5)+')).toBe('serum \\(B5\\)\\+');
  });

  it('builds accent-insensitive token regexes', () => {
    const moisturizing = new RegExp(buildVietnameseInsensitivePattern('duong am'), 'i');
    const cleanser = new RegExp(buildVietnameseInsensitivePattern('sua rua mat'), 'i');

    expect(moisturizing.test('Dưỡng ẩm chuyên sâu')).toBe(true);
    expect(moisturizing.test('duong am chuyen sau')).toBe(true);
    expect(cleanser.test('Sữa Rửa Mặt')).toBe(true);
  });

  it('keeps moisturizing intent as a phrase instead of loose short tokens', () => {
    const query = buildProductSearchQuery('serum dưỡng ẩm');

    expect(query.tokens).toEqual(['serum', 'duong', 'am']);
    expect(query.terms).toEqual(['serum', 'duong am']);
    expect(query.preferred.$and).toHaveLength(2);
    expect(query.strong.$and).toHaveLength(2);
    expect(query.fallback.$or).toHaveLength(2);

    const preferredTypeRegex = query.preferred.$and[0].$or[0].product_type;
    expect(preferredTypeRegex.test('Serum / Tinh Chất')).toBe(true);
    expect(preferredTypeRegex.test('Chống Nắng Cơ Thể')).toBe(false);

    const preferredBenefitRegex = query.preferred.$and[1].$or[0].name;
    expect(preferredBenefitRegex.test('Serum dưỡng ẩm chuyên sâu')).toBe(true);
    expect(preferredBenefitRegex.test('Serum cấp nước cho da')).toBe(true);
    expect(preferredBenefitRegex.test('Serum dịu da')).toBe(false);
  });
});
