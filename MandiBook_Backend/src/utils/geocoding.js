const DEFAULT_GEOCODER_URL = process.env.MANDIBOOK_GEOCODER_URL || 'https://nominatim.openstreetmap.org/search';
const DEFAULT_LOCATIONIQ_URL = process.env.LOCATIONIQ_GEOCODER_URL || 'https://us1.locationiq.com/v1/search';
const DEFAULT_USER_AGENT = process.env.MANDIBOOK_GEOCODER_USER_AGENT || 'MandiBook/1.0 (admin geocoding support)';
const DEFAULT_COUNTRY_CODE = process.env.MANDIBOOK_GEOCODER_COUNTRY_CODE || 'in';
const LOCATIONIQ_ACCESS_TOKEN = String(process.env.LOCATIONIQ_ACCESS_TOKEN || '').trim();
const REQUEST_TIMEOUT_MS = Number(process.env.MANDIBOOK_GEOCODER_TIMEOUT_MS || 8000);

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

const buildSearchQueries = (payload = {}) => {
  const candidates = [
    [payload.name, payload.address, payload.city, payload.district, payload.state, payload.pincode, 'India'],
    [payload.address, payload.city, payload.district, payload.state, payload.pincode, 'India'],
    [payload.name, payload.city, payload.district, payload.state, payload.pincode, 'India'],
    [payload.address, payload.city, payload.state, 'India'],
    [payload.name, payload.address, payload.city, payload.state, 'India'],
    [payload.name, payload.district, payload.state, 'India'],
    [payload.city, payload.district, payload.state, payload.pincode, 'India'],
  ];

  return [...new Set(candidates.map((parts) => parts.map(normalizeText).filter(Boolean).join(', ')).filter(Boolean))];
};

const withTimeout = () => (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
  ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  : undefined);

async function fetchJson(url, headers = {}) {
  let response;

  try {
    response = await fetch(url, {
      headers,
      signal: withTimeout(),
    });
  } catch (error) {
    throw new GeocodingError(`Geocoding request failed: ${error.message}`, 502);
  }

  if (!response.ok) {
    throw new GeocodingError(`Geocoding service failed with status ${response.status}`, 502);
  }

  return response.json();
}

const parseCoordinates = (latValue, lngValue, displayName, query, source) => {
  const lat = Number(latValue);
  const lng = Number(lngValue);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    displayName: displayName || query,
    source,
  };
};

async function geocodeWithLocationIQ(query) {
  if (!LOCATIONIQ_ACCESS_TOKEN) {
    return null;
  }

  const url = new URL(DEFAULT_LOCATIONIQ_URL);
  url.searchParams.set('key', LOCATIONIQ_ACCESS_TOKEN);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', DEFAULT_COUNTRY_CODE);
  url.searchParams.set('normalizecity', '1');

  const results = await fetchJson(url, {
    'User-Agent': DEFAULT_USER_AGENT,
    Accept: 'application/json',
    'Accept-Language': 'en',
  });

  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const first = results[0];
  return parseCoordinates(first.lat, first.lon, first.display_name, query, 'locationiq');
}

async function geocodeWithNominatim(query) {
  const url = new URL(DEFAULT_GEOCODER_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', DEFAULT_COUNTRY_CODE);

  const results = await fetchJson(url, {
    'User-Agent': DEFAULT_USER_AGENT,
    Accept: 'application/json',
    'Accept-Language': 'en',
  });

  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const first = results[0];
  return parseCoordinates(first.lat, first.lon, first.display_name, query, 'nominatim');
}

async function geocodeAddress(query) {
  let lastError = null;

  try {
    const locationIqResult = await geocodeWithLocationIQ(query);
    if (locationIqResult) {
      return locationIqResult;
    }
  } catch (error) {
    lastError = error;
  }

  try {
    const nominatimResult = await geocodeWithNominatim(query);
    if (nominatimResult) {
      return nominatimResult;
    }
  } catch (error) {
    lastError = error;
  }

  if (lastError) {
    throw lastError;
  }

  return null;
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

  const queries = buildSearchQueries(payload);
  if (queries.length === 0) {
    return null;
  }

  let lastError = null;

  for (const query of queries) {
    try {
      const result = await geocodeAddress(query);
      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
}

module.exports = {
  GeocodingError,
  buildSearchQuery,
  buildSearchQueries,
  resolveCoordinatesForMandi,
};
