const AppError = require('../../shared/errors/AppError');

class AddressLookupService {
  constructor({ googleMapsClient }) {
    this.googleMapsClient = googleMapsClient;
  }

  async suggest(query) {
    const q = String(query || '').trim();
    if (!q) return [];
    if (q.length < 2) return [];
    return this.googleMapsClient.autocompleteVietnamAddress(q);
  }

  async detail(placeId) {
    const resolvedPlaceId = String(placeId || '').trim();
    if (!resolvedPlaceId) {
      throw new AppError('placeId is required', 400, 'PLACE_ID_REQUIRED');
    }
    return this.googleMapsClient.getAddressDetail(resolvedPlaceId);
  }
}

module.exports = AddressLookupService;
