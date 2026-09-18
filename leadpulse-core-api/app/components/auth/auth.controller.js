const { sendSuccess } = require('../../utils/response-wrapper');
const jwt = require('jsonwebtoken');
const { UnauthorizedError, BadRequestError } = require('../../lib/error');
const AuthService = require('./auth.service');

class AuthController {
  constructor(){
    this.authService = new AuthService();
  }
  
  /**
   * @swagger
   * /api/v1/auth/register:
   *   post:
   *     summary: Register a new Campaign Manager
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [fullName, email, password, confirmPassword, recaptchaToken]
   *             properties:
   *               fullName:
   *                 type: string
   *                 example: John Doe
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: StrongPass1!
   *               confirmPassword:
   *                 type: string
   *                 format: password
   *                 example: StrongPass1!
   *               recaptchaToken:
   *                 type: string
   *                 example: "03AFcWeA7..."
   *     responses:
   *       201:
   *         description: Registration successful
   *       400:
   *         description: Validation error or User already exists
   *       401:
   *         description: reCAPTCHA verification failed
   */
  async register(req, res, next) {
    try {
      const result = await this.authService.register(req.body);
      return sendSuccess(res, result, 'Registration successful', null, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     summary: Log in to the application
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password, recaptchaToken]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: StrongPass1!
   *               recaptchaToken:
   *                 type: string
   *                 example: "03AFcWeA7..."
   *     responses:
   *       200:
   *         description: Login successful (returns access token and sets HttpOnly refresh cookie)
   *       401:
   *         description: Invalid credentials or reCAPTCHA verification failed
   */
  async login(req, res, next) {
    try {
      const { email, password, recaptchaToken } = req.body;
      const { accessToken, refreshToken, user } = await this.authService.login(email, password, recaptchaToken);
      
      // Set HttpOnly cookie for the refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return sendSuccess(res, { accessToken, user }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/refresh-token:
   *   post:
   *     summary: Refresh the access token
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       401:
   *         description: Invalid or expired refresh token
   */
  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const authHeader = req.headers.authorization;

      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token cookie found');
      }
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing access token for refresh context');
      }

      // Decode the expired access token just to extract the user ID
      const expiredToken = authHeader.split(' ')[1];
      let decoded;
      try {
        decoded = jwt.verify(expiredToken, process.env.JWT_SECRET, { ignoreExpiration: true });
      } catch (err) {
        throw new UnauthorizedError('Invalid access token format');
      }

      const { accessToken } = await this.authService.refreshTokenWithId(decoded.id, refreshToken);
      
      return sendSuccess(res, { accessToken }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/logout:
   *   post:
   *     summary: Log out of the application
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logged out successfully
   */
  async logout(req, res, next) {
    try {
      // req.user is populated by authenticate middleware
      await this.authService.logout(req.user.id);
      
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
      });

      return sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/forgot-password:
   *   post:
   *     summary: Request a password reset email
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: If that email exists, a reset link has been sent
   */
  async forgotPassword(req, res, next) {
    try {
      await this.authService.forgotPassword(req.body.email);
      // Always return success to prevent email enumeration
      return sendSuccess(res, null, 'If that email exists, a reset link has been sent');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/reset-password:
   *   post:
   *     summary: Reset password using the token sent to email
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, token, newPassword]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               token:
   *                 type: string
   *               newPassword:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: Password has been reset successfully
   *       400:
   *         description: Invalid or expired reset token
   */
  async resetPassword(req, res, next) {
    try {
      const { email, token, newPassword } = req.body;
      if (!email) throw new BadRequestError('Email is required to reset password');
      
      await this.authService.resetPasswordWithEmail(email, token, newPassword);
      
      res.clearCookie('refreshToken');
      return sendSuccess(res, null, 'Password has been reset successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
