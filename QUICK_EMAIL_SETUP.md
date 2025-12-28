# Quick Email Setup Guide - TOLA

## 🚀 Quick Start (5 Minutes)

### Step 1: Get GoDaddy SMTP Settings (2 minutes)

1. Log in to GoDaddy: https://sso.godaddy.com/
2. Go to **My Products** → **Email & Microsoft 365**
3. Click **Manage** on `support@tolatola.co`
4. Find **Email Client Settings** or **SMTP Settings**
5. Note down:
   - **SMTP Server**: Usually `smtpout.secureserver.net` (for GoDaddy) or `smtp.office365.com` (for Office 365)
   - **SMTP Port**: `587` (TLS) or `465` (SSL) - **NOT 443!**
   - **Username**: `support@tolatola.co`
   - **Password**: Your email password

**⚠️ IMPORTANT**: 
- Port must be `587` or `465`, NOT `443`
- Host should be `smtpout.secureserver.net` (with "out"), not `smtp.secureserver.net`

### Step 2: Configure Supabase SMTP (2 minutes)

1. Go to Supabase Dashboard: https://app.supabase.com/
2. Select your TOLA project
3. Navigate to: **Authentication** → **Settings** → **SMTP Settings**
4. Enable **Custom SMTP** and fill in:
   ```
   SMTP Host: smtpout.secureserver.net (or smtp.office365.com for Office 365)
   SMTP Port: 587 (TLS) or 465 (SSL) - NOT 443!
   SMTP User: support@tolatola.co
   SMTP Password: [your email password]
   SMTP Sender Email: support@tolatola.co
   SMTP Sender Name: TOLA Digital Trade & Supply Chain Ecosystem
   ```
   
   **⚠️ CRITICAL**: 
   - Change Port from `443` to `587` or `465`
   - Make sure Host is `smtpout.secureserver.net` (with "out")
5. Click **Send Test Email** to verify
6. Click **Save**

### Step 3: Enable Email Confirmation (30 seconds)

1. In Supabase: **Authentication** → **Settings** → **Email Auth**
2. Enable **"Enable email confirmations"**
3. Save

### Step 4: Add Email Template (1 minute)

1. In Supabase: **Authentication** → **Email Templates**
2. Click **"Confirm signup"** template
3. Copy content from `email-templates/signup-verification.html`
4. Paste into the template editor
5. Update subject: **"Welcome to TOLA - Verify Your Email Address"**
6. Save

### Step 5: Test (30 seconds)

1. Go to your signup page
2. Create a test account
3. Check email inbox
4. Click verification link

## ✅ Done!

Your email system is now configured. All new signups will receive verification emails from `support@tolatola.co`.

## 🔧 Common Issues

**Emails not sending?**
- Check SMTP credentials are correct
- Verify email account is active
- Check Supabase logs for errors

**Emails in spam?**
- Normal for first few emails
- Ask users to mark as "Not Spam"
- SPF/DKIM should be auto-configured by GoDaddy

**Need help?**
- See full guide: `EMAIL_SETUP_GUIDE.md`
- Contact: support@tolatola.co

