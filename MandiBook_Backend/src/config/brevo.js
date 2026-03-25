const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const getBrevoConfigError = () => {
  if (!process.env.BREVO_API_KEY) {
    return {
      success: false,
      error: 'Email OTP service is not configured',
      code: 'brevo_api_key_missing',
      statusCode: 503,
    };
  }

  if (!process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
    return {
      success: false,
      error: 'Email sender is not configured',
      code: 'brevo_sender_missing',
      statusCode: 503,
    };
  }

  return null;
};

const mapBrevoError = (error) => {
  const statusCode = error?.status || error?.response?.statusCode || error?.code || null;
  const message = error?.response?.text || error?.message || 'Email delivery failed';

  if (statusCode === 401 || /unauthorized/i.test(message)) {
    return {
      success: false,
      error: 'Email OTP service credentials are invalid',
      code: 'brevo_unauthorized',
      statusCode: 503,
    };
  }

  if (statusCode === 403 || /forbidden/i.test(message)) {
    return {
      success: false,
      error: 'Email OTP service access is forbidden',
      code: 'brevo_forbidden',
      statusCode: 503,
    };
  }

  return {
    success: false,
    error: message,
    code: 'brevo_send_failed',
    statusCode: 503,
  };
};

const sendEmailOTP = async (toEmail, toName, otp) => {
  try {
    const configError = getBrevoConfigError();
    if (configError) {
      return configError;
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME,
      email: process.env.BREVO_SENDER_EMAIL,
    };
    sendSmtpEmail.to = [{ email: toEmail, name: toName }];
    sendSmtpEmail.subject = 'MandiBook — Your Verification Code';
    sendSmtpEmail.htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 40px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <h2 style="color: #15803d; margin-bottom: 8px;">MandiBook Verification</h2>
            <p style="color: #525252; font-size: 14px;">Hello ${toName},</p>
            <p style="color: #525252; font-size: 14px;">Your verification code is:</p>
            <div style="background: #f0fdf4; border: 2px solid #15803d; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #15803d;">${otp}</span>
            </div>
            <p style="color: #737373; font-size: 12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
            <p style="color: #a3a3a3; font-size: 11px;">If you didn't request this, please ignore this email.</p>
          </div>
        </body>
      </html>
    `;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Brevo sendEmailOTP error:', error.message);
    return mapBrevoError(error);
  }
};

const sendEmail = async (toEmail, toName, subject, htmlContent) => {
  try {
    const configError = getBrevoConfigError();
    if (configError) {
      return configError;
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME,
      email: process.env.BREVO_SENDER_EMAIL,
    };
    sendSmtpEmail.to = [{ email: toEmail, name: toName }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Brevo sendEmail error:', error.message);
    return mapBrevoError(error);
  }
};

module.exports = { sendEmailOTP, sendEmail };
