const { User, sequelize } = require('leadpulse-data-model');
const { BadRequestError, UnauthorizedError } = require('../../lib/error');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../../utils/logger');
const { sendEmail } = require('../../utils/mailer');

class AuthService {
  
  async register(data) {
    const { fullName, email, password } = data;

    // Check duplicate
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestError('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      role: 'campaign_manager',
      fullName,
      email,
      passwordHash
    });

    // Send Welcome Email
    await sendEmail({
      to: email,
      subject: 'Welcome to LeadPulse!',
      text: `Hi ${fullName}, welcome to the LeadPulse platform. Your Campaign Manager account has been provisioned.`,
      html: `<p>Hi <b>${fullName}</b>,</p><p>Welcome to the LeadPulse platform. Your Campaign Manager account has been provisioned.</p>`
    });

    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email, password) {
    const user = await User.findOne({ where: { email } });
    
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials or inactive account');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate Tokens
    const accessToken = jwt.sign(
      { id: user.id, role: user.role, clientId: user.clientId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshTokenString, 10);
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    user.refreshTokenHash = refreshTokenHash;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    user.lastLoginAt = new Date();
    await user.save();
    
    return {
      accessToken,
      refreshToken: refreshTokenString,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role }
    };
  }

  async refreshTokenWithId(userId, rawRefreshToken) {
    const user = await User.findByPk(userId);
    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedError('Invalid refresh token session');
    }

    if (new Date() > user.refreshTokenExpiresAt) {
      throw new UnauthorizedError('Refresh token expired');
    }

    const isValid = await bcrypt.compare(rawRefreshToken, user.refreshTokenHash);
    if (!isValid) throw new UnauthorizedError('Invalid refresh token');

    // Issue new access token
    const accessToken = jwt.sign(
      { id: user.id, role: user.role, clientId: user.clientId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return { accessToken };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.info(`Forgot password email requested for ${email} but user not found.`);
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 mins

    user.resetTokenHash = resetTokenHash;
    user.resetTokenExpiresAt = resetTokenExpiresAt;
    await user.save();

    // Construct a theoretical frontend URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: 'LeadPulse Password Reset',
      text: `You requested a password reset. Click here: ${resetUrl} (Link expires in 60 minutes)`,
      html: `<p>You requested a password reset.</p><a href="${resetUrl}">Click here to reset your password</a><p>This link expires in 60 minutes.</p>`
    });
  }

  async resetPasswordWithEmail(email, token, newPassword) {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    if (new Date() > user.resetTokenExpiresAt) {
      throw new BadRequestError('Reset token has expired');
    }

    const isValid = await bcrypt.compare(token, user.resetTokenHash);
    if (!isValid) {
      throw new BadRequestError('Invalid reset token');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    
    // Invalidate refresh tokens on password reset
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await user.save();
  }

  async logout(userId) {
    await User.update(
      { refreshTokenHash: null, refreshTokenExpiresAt: null },
      { where: { id: userId } }
    );
  }
}

module.exports = AuthService;
