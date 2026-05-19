const parseCookies = (rawCookie = '') => {
  if (!rawCookie || typeof rawCookie !== 'string') return {};

  return rawCookie.split(';').reduce((acc, entry) => {
    const [rawKey, ...rawValueParts] = entry.trim().split('=');
    if (!rawKey) return acc;
    const key = decodeURIComponent(rawKey.trim());
    const value = decodeURIComponent(rawValueParts.join('=').trim());
    acc[key] = value;
    return acc;
  }, {});
};

module.exports = { parseCookies };
