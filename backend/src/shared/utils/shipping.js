const FREE_SHIPPING_THRESHOLD = 300000;
const SHIPPING_FEE_INNER_HCM = 30000;
const SHIPPING_FEE_NATIONWIDE = 50000;

const normalizeVietnameseText = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

const isHoChiMinhCity = (province = '') => {
  const normalized = normalizeVietnameseText(province);
  if (!normalized) return false;

  const tokens = [
    'ho chi minh',
    'thanh pho ho chi minh',
    'tp ho chi minh',
    'tp.ho chi minh',
    'tphcm',
    'hcm',
    'sai gon',
    'sg'
  ];

  return tokens.some((token) => normalized.includes(token));
};

const addDays = (date, days) => {
  const cloned = new Date(date);
  cloned.setDate(cloned.getDate() + days);
  return cloned;
};

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const buildShippingQuote = ({ merchandiseTotal = 0, province = '' } = {}) => {
  const resolvedMerchandiseTotal = Math.max(0, Number(merchandiseTotal || 0));
  const freeShippingApplied = resolvedMerchandiseTotal >= FREE_SHIPPING_THRESHOLD;
  const innerHcm = isHoChiMinhCity(province);

  const fee = freeShippingApplied
    ? 0
    : innerHcm
      ? SHIPPING_FEE_INNER_HCM
      : SHIPPING_FEE_NATIONWIDE;

  const now = new Date();
  const minLeadTime = innerHcm ? 1 : 3;
  const maxLeadTime = innerHcm ? 2 : 5;
  const fromDate = addDays(now, minLeadTime);
  const toDate = addDays(now, maxLeadTime);

  return {
    method: 'Giao hàng tiêu chuẩn',
    zone: innerHcm ? 'inner_hcm' : 'nationwide',
    fee,
    freeShippingApplied,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    estimatedDeliveryDate: `${formatDate(fromDate)} - ${formatDate(toDate)}`,
    estimatedDeliveryText: `Dự kiến giao ${formatDate(fromDate)} - ${formatDate(toDate)}`,
    estimatedDeliveryWindow: {
      from: fromDate.toISOString(),
      to: toDate.toISOString()
    }
  };
};

module.exports = {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE_INNER_HCM,
  SHIPPING_FEE_NATIONWIDE,
  buildShippingQuote,
  isHoChiMinhCity
};
