const env = require('../../config/env');
const AppError = require('../../shared/errors/AppError');

class GoogleMapsClient {
  constructor() {
    this.apiKey = env.googleMapsApiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  async autocompleteVietnamAddress(input) {
    this.ensureConfigured();

    const params = new URLSearchParams({
      input: String(input || '').trim(),
      language: 'vi',
      components: 'country:vn',
      key: this.apiKey
    });

    const url = `${this.baseUrl}/place/autocomplete/json?${params.toString()}`;
    const result = await this.request(url);

    if (result.status === 'ZERO_RESULTS') return [];
    if (result.status !== 'OK') {
      throw new AppError('Google Maps autocomplete failed', 502, 'GOOGLE_MAPS_AUTOCOMPLETE_FAILED', {
        status: result.status,
        errorMessage: result.error_message || null
      });
    }

    return (result.predictions || []).map((prediction) => ({
      placeId: prediction.place_id,
      description: prediction.description || '',
      mainText: prediction.structured_formatting?.main_text || '',
      secondaryText: prediction.structured_formatting?.secondary_text || ''
    }));
  }

  async getAddressDetail(placeId) {
    this.ensureConfigured();

    const params = new URLSearchParams({
      place_id: String(placeId || '').trim(),
      fields: 'place_id,formatted_address,address_component,geometry',
      language: 'vi',
      key: this.apiKey
    });

    const url = `${this.baseUrl}/place/details/json?${params.toString()}`;
    const result = await this.request(url);

    if (result.status !== 'OK') {
      throw new AppError('Google Maps place detail failed', 502, 'GOOGLE_MAPS_PLACE_DETAIL_FAILED', {
        status: result.status,
        errorMessage: result.error_message || null
      });
    }

    const detail = result.result || {};
    const components = detail.address_components || [];
    const district =
      findComponent(components, ['administrative_area_level_2']) ||
      findComponent(components, ['locality']) ||
      '';
    const ward =
      findComponent(components, ['administrative_area_level_3']) ||
      findComponent(components, ['sublocality_level_1']) ||
      findComponent(components, ['sublocality']) ||
      '';
    const route = findComponent(components, ['route']);
    const streetNumber = findComponent(components, ['street_number']);
    const premise = findComponent(components, ['premise']);
    const addressLine = [streetNumber, route].filter(Boolean).join(' ').trim() || premise || '';

    return {
      placeId: detail.place_id || String(placeId || ''),
      formattedAddress: detail.formatted_address || '',
      province: findComponent(components, ['administrative_area_level_1']) || '',
      district,
      ward,
      addressLine,
      location: {
        lat: Number(detail.geometry?.location?.lat || 0),
        lng: Number(detail.geometry?.location?.lng || 0)
      }
    };
  }

  ensureConfigured() {
    if (!this.apiKey) {
      throw new AppError(
        'Google Maps API key is missing',
        503,
        'GOOGLE_MAPS_NOT_CONFIGURED'
      );
    }
  }

  async request(url) {
    let response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new AppError('Google Maps request failed', 502, 'GOOGLE_MAPS_NETWORK_ERROR', {
        message: error.message
      });
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !payload) {
      throw new AppError('Google Maps response is invalid', 502, 'GOOGLE_MAPS_INVALID_RESPONSE', {
        status: response.status
      });
    }

    return payload;
  }
}

const findComponent = (components, types = []) => {
  for (const component of components || []) {
    const componentTypes = component.types || [];
    if (types.every((type) => componentTypes.includes(type))) {
      return component.long_name || component.short_name || '';
    }
  }
  return '';
};

module.exports = GoogleMapsClient;
