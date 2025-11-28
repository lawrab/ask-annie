import { Resend } from 'resend';
import { logger } from '../utils/logger';

/**
 * Email service for sending magic link authentication emails
 * Uses Resend for email delivery
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  logger.warn(
    'RESEND_API_KEY not set. Magic link emails will not be sent. Add RESEND_API_KEY to .env file.'
  );
}

const resend = new Resend(RESEND_API_KEY || 'mock_key_for_development');

const FROM_EMAIL = process.env.FROM_EMAIL || "Annie's Health Journal <onboarding@resend.dev>";
const BASE_URL = process.env.MAGIC_LINK_BASE_URL || 'http://localhost:5173';

export interface MagicLinkEmailOptions {
  email: string;
  token: string;
  expiryMinutes?: number;
}

/**
 * Send magic link authentication email
 */
export async function sendMagicLinkEmail(options: MagicLinkEmailOptions): Promise<void> {
  const { email, token, expiryMinutes = 15 } = options;
  const magicLink = `${BASE_URL}/auth/magic-link?token=${token}`;

  // Warn if using mock key
  if (!RESEND_API_KEY) {
    logger.warn('Cannot send email: RESEND_API_KEY not configured', { email, magicLink });
    logger.warn('For testing, use this magic link directly: ' + magicLink);
    return;
  }

  try {
    logger.info('Sending magic link email', { email, expiryMinutes });

    // Add timestamp to subject to prevent Gmail threading
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Log in to Annie's Health Journal - ${timestamp}`,
      html: getMagicLinkEmailHTML(magicLink, expiryMinutes),
      text: getMagicLinkEmailText(magicLink, expiryMinutes),
    });

    if (error) {
      logger.error('Failed to send magic link email', { error, email });
      throw new Error(`Failed to send email: ${error.message}`);
    }

    logger.info('Magic link email sent successfully', { email, emailId: data?.id });
  } catch (error) {
    logger.error('Error sending magic link email', { error, email });
    throw error;
  }
}

/**
 * HTML email template for magic link
 */
function getMagicLinkEmailHTML(magicLink: string, expiryMinutes: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log in to Annie's Health Journal</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ec4899; font-size: 28px; font-weight: 600;">
                Annie's Health Journal
              </h1>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
                Your daily health companion
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px; font-weight: 600;">
                Log in to your account
              </h2>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Click the button below to securely log in to Annie's Health Journal. No password needed!
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 24px;">
                    <a href="${magicLink}" style="display: inline-block; padding: 14px 32px; background-color: #ec4899; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Log In
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                This link will expire in <strong>${expiryMinutes} minutes</strong>.
              </p>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                If you didn't request this login link, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center;">
                Annie's Health Journal<br>
                Track symptoms, spot patterns, empower your health
              </p>
            </td>
          </tr>
        </table>

        <!-- Fallback link -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 20px;">
          <tr>
            <td style="padding: 0 20px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${magicLink}" style="color: #ec4899; word-break: break-all;">${magicLink}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Plain text email template for magic link
 */
function getMagicLinkEmailText(magicLink: string, expiryMinutes: number): string {
  return `
Log in to Annie's Health Journal

Hi there!

Click the link below to log in to your Annie's Health Journal account:

${magicLink}

This link will expire in ${expiryMinutes} minutes.

If you didn't request this login link, you can safely ignore this email.

---
Annie's Health Journal
Your daily health companion
Track symptoms, spot patterns, empower your health
  `.trim();
}
