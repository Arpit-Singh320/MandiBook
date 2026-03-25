const jwt = require('jsonwebtoken');

const generateToken = (userId, role, tokenVersion = 0) => {
  const configuredExpiry = process.env.JWT_EXPIRES_IN;
  const expiresIn = !configuredExpiry || configuredExpiry === '7d' ? '30d' : configuredExpiry;
  return jwt.sign({ id: userId, role, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

module.exports = generateToken;
