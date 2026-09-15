const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

async function initMailer() {
  if (transporter) return transporter;

  const provider = process.env.EMAIL_PROVIDER || 'ethereal';

  if (provider === 'sendgrid') {
    // Production / Real Delivery
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
    logger.info('Mailer initialized using SendGrid SMTP.');
  } else {
    // Local Testing / Ethereal
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    logger.info('Mailer initialized using Ethereal Email (Local Testing).');
  }

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  try {
    const mailer = await initMailer();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"LeadPulse" <noreply@leadpulse.local>',
      to,
      subject,
      text,
      html
    };

    const info = await mailer.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}`);

    // If using Ethereal, log the preview URL so we can view it in the browser
    if (process.env.EMAIL_PROVIDER !== 'sendgrid') {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    logger.error('Failed to send email:', { error: error.message, to, subject });
    throw error;
  }
}

module.exports = {
  sendEmail
};
