const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendOTP = async (phoneNumber) => {
  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms',
      });
    return { success: true, status: verification.status };
  } catch (error) {
    console.error('Twilio sendOTP error:', error.message);
    return { success: false, error: error.message };
  }
};

const verifyOTP = async (phoneNumber, code) => {
  try {
    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code,
      });
    return { success: check.status === 'approved', status: check.status };
  } catch (error) {
    console.error('Twilio verifyOTP error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTP, verifyOTP };
