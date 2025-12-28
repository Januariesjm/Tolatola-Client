# Email Setup Guide for TOLA

## Step 1: Get GoDaddy SMTP Settings

### ⚠️ IMPORTANT: Your Current Settings Are Incorrect

**Current (WRONG):**
- Port: `443` ❌
- Host: `smtp.secureserver.net` (might be correct, but check)

**Correct Settings Should Be:**
- Port: `587` (TLS) or `465` (SSL) ✅
- Host: `smtpout.secureserver.net` (note the "out" in the hostname) ✅

### Option A: Through GoDaddy Email Settings (Recommended)

1. **Log in to GoDaddy**
   - Go to https://sso.godaddy.com/
   - Sign in with your GoDaddy account

2. **Access Email Settings**
   - Go to "My Products" → "Email & Microsoft 365"
   - Find your email account: `support@tolatola.co`
   - Click on "Manage" or "Settings"

3. **Get SMTP Settings**
   - Look for "Email Client Settings" or "SMTP Settings" or "Outgoing Server Settings"
   - You'll need these details:
     - **SMTP Server**: Usually `smtpout.secureserver.net` (for GoDaddy Workspace) or `smtp.office365.com` (for Office 365)
     - **SMTP Port**: `587` (TLS - Recommended) or `465` (SSL)
     - **Username**: Your full email address: `support@tolatola.co`
     - **Password**: Your email account password (or app-specific password if 2FA is enabled)
     - **Encryption**: TLS (for port 587) or SSL (for port 465)

### Option B: Common GoDaddy SMTP Settings

**For GoDaddy Workspace Email (Most Common):**
- **SMTP Server**: `smtpout.secureserver.net` (note: "out" not just "smtp")
- **Port**: `587` (TLS - Recommended) or `465` (SSL)
- **Username**: `support@tolatola.co`
- **Password**: Your email account password
- **Encryption**: TLS (for port 587) or SSL (for port 465)
- **Authentication**: Required (Yes)

**For Office 365 (if using Microsoft 365):**
- **SMTP Server**: `smtp.office365.com`
- **Port**: `587`
- **Username**: `support@tolatola.co`
- **Password**: Your email password
- **Encryption**: TLS

### Option C: Find Settings in GoDaddy Email Client

1. Log into your GoDaddy email via webmail: https://email.godaddy.com/
2. Go to Settings → Email Settings → Email Client Settings
3. Look for "Outgoing Mail Server" or "SMTP Settings"
4. Copy the exact server name and port number shown

## Step 2: Configure Supabase Custom SMTP

1. **Log in to Supabase Dashboard**
   - Go to https://app.supabase.com/
   - Select your TOLA project

2. **Navigate to Authentication Settings**
   - Go to: **Authentication** → **Settings** → **SMTP Settings**

3. **Enable Custom SMTP**
   - Toggle "Enable Custom SMTP" to ON
   - Fill in the following fields:

   ```
   SMTP Host: [Your SMTP server from Step 1]
   SMTP Port: [587 or 465]
   SMTP User: support@tolatola.co
   SMTP Password: [Your email password]
   SMTP Sender Email: support@tolatola.co
   SMTP Sender Name: TOLA Digital Trade & Supply Chain Ecosystem
   ```

4. **Test the Connection**
   - Click "Send Test Email" to verify the configuration
   - Check your inbox to confirm the test email arrives

5. **Save Settings**
   - Click "Save" to apply the changes

## Step 3: Configure Email Templates in Supabase

1. **Go to Email Templates**
   - Navigate to: **Authentication** → **Email Templates**

2. **Customize the "Confirm signup" Template**
   - Click on "Confirm signup" template
   - Replace the default template with the custom template provided in `email-templates/signup-verification.html`
   - Update the subject line to: "Welcome to TOLA - Verify Your Email Address"

3. **Save the Template**
   - Click "Save" to apply the template

## Step 4: Verify Email Configuration

1. **Test Signup Flow**
   - Go to your signup page
   - Create a test account
   - Check the email inbox for `support@tolatola.co` (if testing) or the test email address
   - Verify the email contains the correct branding and verification link

2. **Check Email Delivery**
   - If emails aren't arriving:
     - Check spam/junk folder
     - Verify SMTP credentials are correct
     - Check Supabase logs for errors
     - Ensure your GoDaddy email account is active

## Troubleshooting

### Emails Not Sending
- Verify SMTP credentials in Supabase dashboard
- Check if your GoDaddy email account has sending limits
- Ensure the email account is not suspended
- Check Supabase logs: **Logs** → **Postgres Logs**

### Emails Going to Spam
- Ensure SPF/DKIM records are set up for your domain (GoDaddy usually handles this)
- Use a professional sender name
- Avoid spam trigger words in email content

### Connection Errors
- Verify SMTP server address is correct
- Check if port 587 or 465 is blocked by firewall
- Try alternative ports if available
- Contact GoDaddy support if issues persist

## Security Notes

- Never commit SMTP passwords to version control
- Use environment variables for sensitive credentials
- Regularly update email passwords
- Enable 2FA on your GoDaddy account

## Additional Resources

- GoDaddy Email Support: https://www.godaddy.com/help
- Supabase SMTP Documentation: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates

