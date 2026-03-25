const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const getTwilioConfigError = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    return {
      success: false,
      error: 'Phone OTP service is not configured',
      code: 'twilio_config_missing',
      statusCode: 503,
    };
  }

  return null;
};

const mapTwilioError = (error) => {
  const statusCode = error?.status || error?.statusCode || null;
  const message = error?.message || 'Phone OTP service failed';

  if (statusCode === 401 || statusCode === 403) {
    return {
      success: false,
      error: 'Phone OTP service credentials are invalid',
      code: 'twilio_unauthorized',
      statusCode: 503,
    };
  }

  return {
    success: false,
    error: message,
    code: 'twilio_send_failed',
    statusCode: 503,
  };
};

const sendOTP = async (phoneNumber) => {
  try {
    const configError = getTwilioConfigError();
    if (configError) {
      return configError;
    }

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms',
      });
    return { success: true, status: verification.status };
  } catch (error) {
    console.error('Twilio sendOTP error:', error.message);
    return mapTwilioError(error);
  }
};

const verifyOTP = async (phoneNumber, code) => {
  try {
    const configError = getTwilioConfigError();
    if (configError) {
      return configError;
    }

    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code,
      });
    return { success: check.status === 'approved', status: check.status };
  } catch (error) {
    console.error('Twilio verifyOTP error:', error.message);
    return mapTwilioError(error);
  }
};

module.exports = { sendOTP, verifyOTP };
