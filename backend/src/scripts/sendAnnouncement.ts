import * as fs from 'fs';
import { Resend } from 'resend';
import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to send announcement emails to users
 * Usage: ts-node src/scripts/sendAnnouncement.ts <content-file> [options]
 *
 * Options:
 *   --dry-run          Show what would be sent without actually sending
 *   --test-email=<email>  Send only to a specific test email
 *   --limit=<number>    Limit to first N users (useful for testing)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "Annie's Health Journal <onboarding@resend.dev>";
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/annies-health-journal';

interface ScriptOptions {
  dryRun: boolean;
  testEmail?: string;
  limit?: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): { contentFile: string; options: ScriptOptions } {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0].startsWith('--')) {
    console.error('Usage: ts-node src/scripts/sendAnnouncement.ts <content-file> [options]');
    console.error('\nOptions:');
    console.error('  --dry-run                Show what would be sent without actually sending');
    console.error('  --test-email=<email>     Send only to a specific test email');
    console.error('  --limit=<number>         Limit to first N users');
    process.exit(1);
  }

  const contentFile = args[0];
  const options: ScriptOptions = {
    dryRun: false,
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--test-email=')) {
      options.testEmail = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    }
  }

  return { contentFile, options };
}

/**
 * Generate HTML email template for announcement
 * Uses the same styling as the magic link email
 */
function getAnnouncementEmailHTML(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Updates from Annie's Health Journal</title>
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
              ${content}
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
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for announcement
 */
function getAnnouncementEmailText(content: string): string {
  // Strip HTML tags for plain text version
  const plainContent = content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

  return `
Annie's Health Journal - Updates

${plainContent}

---
Annie's Health Journal
Your daily health companion
Track symptoms, spot patterns, empower your health
  `.trim();
}

/**
 * Parse markdown-like content to HTML
 * Supports basic formatting:
 * - # Heading
 * - ## Subheading
 * - **bold**
 * - Paragraphs (double newline)
 * - Bullet points (-)
 */
function parseContentToHTML(rawContent: string): string {
  let html = '';
  const lines = rawContent.split('\n');
  let inList = false;
  let paragraph = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines unless we have a paragraph
    if (!line) {
      if (paragraph) {
        html += `<p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.5;">${paragraph}</p>\n`;
        paragraph = '';
      }
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      continue;
    }

    // Heading
    if (line.startsWith('# ')) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      html += `<h2 style="margin: 0 0 16px; color: #111827; font-size: 20px; font-weight: 600;">${line.substring(2)}</h2>\n`;
    }
    // Subheading
    else if (line.startsWith('## ')) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      html += `<h3 style="margin: 0 0 12px; color: #111827; font-size: 18px; font-weight: 600;">${line.substring(3)}</h3>\n`;
    }
    // Bullet point
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (paragraph) {
        html += `<p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.5;">${paragraph}</p>\n`;
        paragraph = '';
      }
      if (!inList) {
        html +=
          '<ul style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.5; padding-left: 20px;">\n';
        inList = true;
      }
      const listContent = line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html += `<li>${listContent}</li>\n`;
    }
    // Regular paragraph
    else {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      paragraph += (paragraph ? ' ' : '') + formattedLine;
    }
  }

  // Close any remaining paragraph or list
  if (paragraph) {
    html += `<p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.5;">${paragraph}</p>\n`;
  }
  if (inList) {
    html += '</ul>\n';
  }

  return html;
}

/**
 * Send announcement email to a user
 */
async function sendAnnouncementEmail(
  resend: Resend,
  email: string,
  htmlContent: string,
  textContent: string
): Promise<void> {
  // Add timestamp to subject to prevent Gmail threading
  const timestamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Updates from Annie's Health Journal - ${timestamp}`,
    html: htmlContent,
    text: textContent,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return;
}

/**
 * Main script execution
 */
async function main() {
  const { contentFile, options } = parseArgs();

  // Read content file
  if (!fs.existsSync(contentFile)) {
    console.error(`Error: Content file not found: ${contentFile}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(contentFile, 'utf-8');
  const htmlContent = getAnnouncementEmailHTML(parseContentToHTML(rawContent));
  const textContent = getAnnouncementEmailText(parseContentToHTML(rawContent));

  console.log("\n📧 Annie's Health Journal - Announcement Email Sender\n");
  console.log(`Content file: ${contentFile}`);
  console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
  if (options.testEmail) {
    console.log(`Test email: ${options.testEmail}`);
  }
  if (options.limit) {
    console.log(`Limit: ${options.limit} users`);
  }

  // Preview email
  console.log('\n--- Email Preview (HTML) ---');
  console.log(htmlContent);
  console.log('\n--- Email Preview (Text) ---');
  console.log(textContent);
  console.log('\n----------------------------\n');

  if (options.dryRun) {
    console.log('✅ Dry run complete. No emails were sent.');
    process.exit(0);
  }

  // Check API key
  if (!RESEND_API_KEY) {
    console.error('Error: RESEND_API_KEY not set in environment variables');
    process.exit(1);
  }

  const resend = new Resend(RESEND_API_KEY);

  let recipients: string[] = [];

  if (options.testEmail) {
    // Send to test email only (no database connection needed)
    recipients = [options.testEmail];
    console.log(`Sending to test email: ${options.testEmail}`);
  } else {
    // Connect to database to get user emails
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get all user emails from database
    const users = await User.find({}, { email: 1 }).lean();
    recipients = users.map((u: any) => u.email);

    if (options.limit && options.limit > 0) {
      recipients = recipients.slice(0, options.limit);
    }

    console.log(`Found ${recipients.length} recipient(s)`);

    if (recipients.length === 0) {
      console.log('No recipients found. Exiting.');
      await mongoose.disconnect();
      process.exit(0);
    }
  }

  // Send emails
  console.log('\nSending emails...\n');
  let successCount = 0;
  let failureCount = 0;

  for (const email of recipients) {
    try {
      await sendAnnouncementEmail(resend, email, htmlContent, textContent);
      successCount++;
      console.log(`✅ Sent to ${email}`);

      // Add delay to avoid rate limiting (600ms = ~1.6 emails/sec, under 2/sec limit)
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (error) {
      failureCount++;
      console.error(
        `❌ Failed to send to ${email}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log('\n--- Summary ---');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📊 Total: ${recipients.length}`);

  // Only disconnect if we connected to the database
  if (!options.testEmail) {
    await mongoose.disconnect();
  }

  console.log('\n✅ Done!');
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
