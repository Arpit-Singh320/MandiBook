const DEFAULT_GEOCODER_URL = process.env.MANDIBOOK_GEOCODER_URL || 'https://nominatim.openstreetmap.org/search';
const DEFAULT_USER_AGENT = process.env.MANDIBOOK_GEOCODER_USER_AGENT || 'MandiBook/1.0 (admin geocoding support)';

class GeocodingError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.name = 'GeocodingError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const normalizeText = (value) => String(value || '').trim();

const toFiniteNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildSearchQuery = (payload = {}) => {
  return [
    payload.name,
    payload.address,
    payload.city,
    payload.district,
    payload.state,
    payload.pincode,
    'India',
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(', ');
};

async function geocodeAddress(query) {
  const url = new URL(DEFAULT_GEOCODER_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url, {
    headers: {
      'User-Agent': DEFAULT_USER_AGENT,
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    throw new GeocodingError(`Geocoding service failed with status ${response.status}`, 502);
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const first = results[0];
  const lat = Number(first.lat);
  const lng = Number(first.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    displayName: first.display_name || query,
    source: 'nominatim',
  };
}

async function resolveCoordinatesForMandi(payload = {}) {
  const rawLatProvided = payload.lat !== undefined && payload.lat !== null && payload.lat !== '';
  const rawLngProvided = payload.lng !== undefined && payload.lng !== null && payload.lng !== '';
  const lat = toFiniteNumber(payload.lat);
  const lng = toFiniteNumber(payload.lng);

  if ((rawLatProvided && !rawLngProvided) || (!rawLatProvided && rawLngProvided)) {
    throw new GeocodingError('Both latitude and longitude are required when providing coordinates.');
  }

  if ((rawLatProvided || rawLngProvided) && (lat === undefined || lng === undefined)) {
    throw new GeocodingError('Latitude and longitude must be valid numeric values.');
  }

  if (lat !== undefined && lng !== undefined) {
    return {
      lat,
      lng,
      source: 'manual',
      displayName: null,
    };
  }

  const query = buildSearchQuery(payload);
  if (!query) {
    return null;
  }

  return geocodeAddress(query);
}

module.exports = {
  GeocodingError,
  buildSearchQuery,
  resolveCoordinatesForMandi,
};
