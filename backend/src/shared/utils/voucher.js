const normalizeVoucherCode = (code) => String(code || '').trim().toUpperCase();

const toPlainVoucher = (voucher) => (voucher?.toObject ? voucher.toObject() : voucher);

const isVoucherWithinDate = (voucher, now = new Date()) => {
  const source = toPlainVoucher(voucher);
  if (!source) return false;
  const startDate = source.startDate ? new Date(source.startDate) : null;
  const endDate = source.endDate ? new Date(source.endDate) : null;
  if (startDate && startDate.getTime() > now.getTime()) return false;
  if (endDate && endDate.getTime() < now.getTime()) return false;
  return true;
};

const isVoucherUsageAvailable = (voucher) => {
  const source = toPlainVoucher(voucher);
  if (!source) return false;
  const usageLimit = Number(source.usageLimit || 0);
  if (usageLimit <= 0) return true;
  return Number(source.usedCount || 0) < usageLimit;
};

const getVoucherValidityReason = (voucher, now = new Date()) => {
  const source = toPlainVoucher(voucher);
  if (!source) return 'Voucher không tồn tại.';
  if (!source.isActive) return 'Voucher không còn hoạt động.';
  const startDate = source.startDate ? new Date(source.startDate) : null;
  const endDate = source.endDate ? new Date(source.endDate) : null;
  if (startDate && startDate.getTime() > now.getTime()) return 'Voucher chưa đến thời gian sử dụng.';
  if (endDate && endDate.getTime() < now.getTime()) return 'Voucher đã hết hạn.';
  if (!isVoucherUsageAvailable(source)) return 'Voucher đã hết lượt sử dụng.';
  return '';
};

const getVoucherEligibility = (voucher, merchandiseTotal = 0, now = new Date()) => {
  const validityReason = getVoucherValidityReason(voucher, now);
  if (validityReason) {
    return {
      eligible: false,
      reason: validityReason,
      missingAmount: 0
    };
  }

  const source = toPlainVoucher(voucher);
  const minOrderValue = Number(source.minOrderValue || 0);
  const total = Number(merchandiseTotal || 0);
  if (total < minOrderValue) {
    return {
      eligible: false,
      reason: `Cần đơn hàng tối thiểu ${formatMoney(minOrderValue)} để dùng voucher này.`,
      missingAmount: Math.max(0, minOrderValue - total)
    };
  }

  return {
    eligible: true,
    reason: '',
    missingAmount: 0
  };
};

const calculateVoucherDiscount = (voucher, merchandiseTotal = 0) => {
  const source = toPlainVoucher(voucher);
  if (!source) return 0;
  const total = Math.max(0, Number(merchandiseTotal || 0));
  const value = Math.max(0, Number(source.discountValue || 0));
  let discount = 0;

  if (source.discountType === 'percent') {
    discount = Math.floor((total * value) / 100);
    if (source.maxDiscount !== null && source.maxDiscount !== undefined) {
      discount = Math.min(discount, Number(source.maxDiscount || 0));
    }
  } else {
    discount = value;
  }

  return Math.min(total, Math.max(0, discount));
};

const formatVoucher = (voucher, options = {}) => {
  const source = toPlainVoucher(voucher);
  if (!source) return null;
  const merchandiseTotal = Number(options.merchandiseTotal || 0);
  const eligibility = getVoucherEligibility(source, merchandiseTotal, options.now || new Date());

  return {
    _id: source._id?.toString?.() || source._id,
    code: normalizeVoucherCode(source.code),
    name: source.name || source.code,
    description: source.description || '',
    discountType: source.discountType,
    discountValue: Number(source.discountValue || 0),
    minOrderValue: Number(source.minOrderValue || 0),
    maxDiscount: source.maxDiscount ?? null,
    startDate: source.startDate,
    endDate: source.endDate,
    usageLimit: Number(source.usageLimit || 0),
    usedCount: Number(source.usedCount || 0),
    isActive: Boolean(source.isActive),
    eligible: eligibility.eligible,
    disabledReason: eligibility.reason,
    missingAmount: eligibility.missingAmount,
    discountAmount: eligibility.eligible ? calculateVoucherDiscount(source, merchandiseTotal) : 0
  };
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

module.exports = {
  calculateVoucherDiscount,
  formatVoucher,
  getVoucherEligibility,
  getVoucherValidityReason,
  isVoucherWithinDate,
  isVoucherUsageAvailable,
  normalizeVoucherCode,
  toPlainVoucher
};
