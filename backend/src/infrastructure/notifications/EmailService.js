const nodemailer = require('nodemailer');
const env = require('../../config/env');
const logger = require('../../shared/utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.mailEnabled = Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
  }

  async sendVerificationEmail({ email, name, verifyUrl }) {
    if (!email || !verifyUrl) {
      throw new Error('Missing email verification payload');
    }

    const subject = 'Xac thuc tai khoan LuxBerry';
    const html = `
      <div style="font-family:Arial,sans-serif;color:#2B1B24">
        <h2>Xin chao ${escapeHtml(name || email)},</h2>
        <p>Cam on ban da dang ky tai khoan LuxBerry.</p>
        <p>Vui long bam nut ben duoi de xac thuc email:</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#F999B7;color:#fff;text-decoration:none;font-weight:700">
            Xac thuc tai khoan
          </a>
        </p>
        <p>Neu nut khong hoat dong, hay copy link nay: ${verifyUrl}</p>
      </div>
    `.trim();

    if (!this.mailEnabled) {
      logger.info('SMTP is not configured; verification email logged for development', {
        email,
        subject,
        verifyUrl
      });
      return { sent: false, mode: 'log-only' };
    }

    const transporter = await this.getTransporter();
    const info = await transporter.sendMail({
      from: env.mailFrom,
      to: email,
      subject,
      html
    });

    logger.info('Verification email sent', {
      email,
      messageId: info.messageId
    });

    return { sent: true, messageId: info.messageId };
  }

  async getTransporter() {
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });

    await this.transporter.verify();
    return this.transporter;
  }
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

module.exports = EmailService;
