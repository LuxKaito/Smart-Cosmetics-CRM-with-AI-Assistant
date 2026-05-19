const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE_INNER_HCM = 30000;
const SHIPPING_FEE_NATIONWIDE = 50000;

const normalizeVietnameseText = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

const isHoChiMinhCity = (province = '') => {
  const normalized = normalizeVietnameseText(province);
  if (!normalized) return false;

  const tokens = [
    'ho chi minh',
    'thanh pho ho chi minh',
    'thanh pho hcm',
    'tp ho chi minh',
    'tp hcm',
    'ho chi minh city',
    'hcm city',
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
  const innerHcm = isHoChiMinhCity(province);
  const baseFee = innerHcm ? SHIPPING_FEE_INNER_HCM : SHIPPING_FEE_NATIONWIDE;
  const freeShippingApplied = resolvedMerchandiseTotal >= FREE_SHIPPING_THRESHOLD;
  const fee = freeShippingApplied ? 0 : baseFee;

  const minLeadTime = innerHcm ? 1 : 3;
  const maxLeadTime = innerHcm ? 2 : 5;

  const now = new Date();
  const fromDate = addDays(now, minLeadTime);
  const toDate = addDays(now, maxLeadTime);

  return {
    method: 'Giao h\u00e0ng ti\u00eau chu\u1ea9n',
    deliveryLabel: `Nh\u1eadn t\u1eeb ${minLeadTime} - ${maxLeadTime} ng\u00e0y`,
    zone: innerHcm ? 'inner_hcm' : 'nationwide',
    fee,
    feeBeforeDiscount: baseFee,
    freeShippingApplied,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    estimatedDeliveryMinDays: minLeadTime,
    estimatedDeliveryMaxDays: maxLeadTime,
    estimatedDeliveryDate: `${formatDate(fromDate)} - ${formatDate(toDate)}`,
    estimatedDeliveryText: `D\u1ef1 ki\u1ebfn giao ${formatDate(fromDate)} - ${formatDate(toDate)}`,
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
