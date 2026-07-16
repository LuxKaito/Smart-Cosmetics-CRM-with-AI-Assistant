const pad = (value, length = 2) => String(value).padStart(length, '0');

const getDatePart = (date = new Date()) => {
  const value = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  return `${String(value.getFullYear()).slice(-2)}${pad(value.getMonth() + 1)}${pad(value.getDate())}`;
};

const generateOrderCode = (date = new Date()) => {
  const datePart = getDatePart(date);
  const timePart = Date.now().toString(36).slice(-5).toUpperCase();
  const randomPart = Math.floor(Math.random() * 1296)
    .toString(36)
    .padStart(2, '0')
    .toUpperCase();
  return `LB${datePart}${timePart}${randomPart}`;
};

const generateSeedOrderCode = (date, sequence, group = 'S') => {
  const datePart = getDatePart(date);
  const normalizedGroup = String(group || 'S').replace(/[^A-Z0-9]/gi, '').slice(0, 1).toUpperCase() || 'S';
  return `LB${datePart}${normalizedGroup}${pad(sequence, 4)}`;
};

module.exports = {
  generateOrderCode,
  generateSeedOrderCode
};
