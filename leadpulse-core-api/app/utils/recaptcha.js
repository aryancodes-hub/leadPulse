const logger = require('./logger');

/**
 * Verifies a Google reCAPTCHA v3 token.
 * @param {string} token - The token sent from the client
 * @param {string} action - The expected action (e.g., 'login', 'register')
 * @returns {Promise<boolean>} - True if valid and score >= threshold
 */
async function verifyRecaptcha(token, action) {
  // Explicitly bypass reCAPTCHA in development/testing to make API testing easy
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('Skipping reCAPTCHA verification in non-production environment.');
    return true;
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    logger.error('RECAPTCHA_SECRET_KEY is missing in production environment!');
    return false; // Fail securely in production if misconfigured
  }

  try {
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json();

    if (!data.success) {
      logger.warn(`reCAPTCHA verification failed: ${data['error-codes']?.join(', ')}`);
      return false;
    }

    // Google reCAPTCHA v3 uses scores from 0.0 to 1.0 (1.0 is very likely a good interaction).
    if (data.score < 0.5) {
      logger.warn(`reCAPTCHA score too low: ${data.score}`);
      return false;
    }

    if (action && data.action !== action) {
      logger.warn(`reCAPTCHA action mismatch: expected ${action}, got ${data.action}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error verifying reCAPTCHA:', error);
    return false;
  }
}

module.exports = { verifyRecaptcha };
