# Announcement Email Script

Send styled announcement emails to all users using the same design as the login emails.

## Prerequisites

Make sure you have the following environment variables set in your `.env` file:

```bash
RESEND_API_KEY=re_your_actual_key_here
FROM_EMAIL=Annie's Health Journal <onboarding@resend.dev>
MONGODB_URI=mongodb://localhost:27017/annies-health-journal
```

## Usage

### 1. Create Your Announcement Content

Create a text file with your announcement content. The script supports simple markdown-like formatting:

- `# Heading` - Main heading
- `## Subheading` - Secondary heading
- `**bold text**` - Bold text
- `- Item` or `* Item` - Bullet points
- Empty lines create new paragraphs

See `announcement-example.txt` for a sample.

### 2. Test Your Email (Dry Run)

First, preview what the email will look like without sending:

```bash
cd backend
npm run build  # If needed
ts-node src/scripts/sendAnnouncement.ts announcement-example.txt --dry-run
```

This will show you the HTML and text versions of the email.

### 3. Send to a Test Email

Before sending to all users, test with your own email:

```bash
ts-node src/scripts/sendAnnouncement.ts announcement-example.txt --test-email=your.email@example.com
```

### 4. Send to Limited Users (Testing)

Send to the first N users to test in production:

```bash
ts-node src/scripts/sendAnnouncement.ts announcement-example.txt --limit=10
```

### 5. Send to All Users

When you're ready, send to all users:

```bash
ts-node src/scripts/sendAnnouncement.ts announcement-example.txt
```

## Command Line Options

- `--dry-run` - Show what would be sent without actually sending
- `--test-email=<email>` - Send only to a specific test email
- `--limit=<number>` - Limit to first N users

## Example Workflow

```bash
# 1. Create your announcement content
nano my-announcement.txt

# 2. Preview the email
ts-node src/scripts/sendAnnouncement.ts my-announcement.txt --dry-run

# 3. Send to yourself first
ts-node src/scripts/sendAnnouncement.ts my-announcement.txt --test-email=your@email.com

# 4. Check your email, make sure it looks good

# 5. Send to a small group
ts-node src/scripts/sendAnnouncement.ts my-announcement.txt --limit=5

# 6. If all looks good, send to everyone
ts-node src/scripts/sendAnnouncement.ts my-announcement.txt
```

## Email Styling

The email will automatically use the same styling as your login emails:
- Pink (#ec4899) header with "Annie's Health Journal" branding
- Professional, responsive design
- Works in all major email clients
- Includes both HTML and plain text versions
- Automatic timestamp in subject to prevent Gmail threading

## Notes

- The script adds a 100ms delay between emails to avoid rate limiting
- Failed sends are logged but don't stop the process
- A summary is shown at the end with success/failure counts
- The subject line will be: "Updates from Annie's Health Journal - [timestamp]"
