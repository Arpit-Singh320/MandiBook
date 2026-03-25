const crypto = require('crypto');

const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'mandibook-otp-secret';

const normalizeIdentifier = (identifier = '') => identifier.trim().toLowerCase();

const hashOtpCode = ({ code, requestId, purpose, identifier }) => {
  return crypto
    .createHash('sha256')
    .update(`${OTP_HASH_SECRET}:${purpose}:${requestId}:${normalizeIdentifier(identifier)}:${code}`)
    .digest('hex');
};

const createOtpRequestId = (prefix = 'otp_req') => {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
};

const isOtpDebugBypassEnabled = () => {
  return process.env.OTP_DEBUG_BYPASS_DELIVERY === 'true' && process.env.NODE_ENV !== 'production';
};

module.exports = {
  normalizeIdentifier,
  hashOtpCode,
  createOtpRequestId,
  isOtpDebugBypassEnabled,
};
