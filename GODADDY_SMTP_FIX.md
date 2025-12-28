# Fix GoDaddy SMTP Configuration in Supabase

## ❌ Current Incorrect Settings

You currently have:
- **Host**: `smtp.secureserver.net` (might be wrong)
- **Port**: `443` ❌ **THIS IS WRONG!**
- **Username**: `support@tolatola.co` ✅
- **Password**: (your password) ✅

## ✅ Correct Settings

### For GoDaddy Workspace Email:

```
Host: smtpout.secureserver.net
Port: 587 (TLS) or 465 (SSL)
Username: support@tolatola.co
Password: [your email password]
Encryption: TLS (for port 587) or SSL (for port 465)
```

**Note**: The host should be `smtpout.secureserver.net` (with "out"), NOT `smtp.secureserver.net`

## Step-by-Step Fix

### Step 1: Verify Your Email Type

1. Log into GoDaddy: https://sso.godaddy.com/
2. Go to **My Products** → **Email & Microsoft 365**
3. Find `support@tolatola.co`
4. Check what type it is:
   - **GoDaddy Workspace Email** → Use settings below
   - **Microsoft 365** → Use different settings (see below)

### Step 2: Get Correct SMTP Settings

#### For GoDaddy Workspace Email:

**Method 1: Through GoDaddy Dashboard**
1. Click **Manage** on your email account
2. Look for **Email Client Settings** or **SMTP Settings**
3. Find **Outgoing Mail Server (SMTP)**
4. Note the server name and port

**Method 2: Use These Standard Settings**
- **SMTP Server**: `smtpout.secureserver.net`
- **Port**: `587` (recommended) or `465`
- **Security**: TLS (for 587) or SSL (for 465)

#### For Microsoft 365:

- **SMTP Server**: `smtp.office365.com`
- **Port**: `587`
- **Security**: TLS

### Step 3: Update Supabase Settings

1. Go to Supabase Dashboard: https://app.supabase.com/
2. Select your project
3. Go to: **Authentication** → **Settings** → **SMTP Settings**
4. Update the following:

```
Host: smtpout.secureserver.net  (or smtp.office365.com if using Office 365)
Port: 587  (CHANGE FROM 443!)
Username: support@tolatola.co
Password: [your email password]
Sender Email: support@tolatola.co
Sender Name: TOLA Digital Trade & Supply Chain Ecosystem
```

5. Click **Send Test Email**
6. Check your inbox for the test email
7. If received, click **Save**

### Step 4: Troubleshooting

#### If Test Email Fails:

1. **Check Password**:
   - Make sure you're using the correct email password
   - If 2FA is enabled, you may need an app-specific password

2. **Try Port 465 Instead**:
   - Change port from `587` to `465`
   - Change encryption from TLS to SSL
   - Try test email again

3. **Verify Host**:
   - Try `smtpout.secureserver.net` (with "out")
   - If that doesn't work, try `smtp.secureserver.net` (without "out")
   - For Office 365, use `smtp.office365.com`

4. **Check Firewall**:
   - Make sure ports 587 and 465 are not blocked
   - Some networks block SMTP ports

5. **Enable "Less Secure Apps"** (if available):
   - Some email providers require this
   - Check GoDaddy email settings

### Step 5: Verify Email Works

After updating settings:
1. Send a test email from Supabase
2. Check your inbox (and spam folder)
3. If received, try signing up a new account
4. Check if verification email arrives

## Common Issues

### Issue: "Authentication failed"
- **Solution**: Double-check username and password
- Try generating a new app-specific password if 2FA is enabled

### Issue: "Connection timeout"
- **Solution**: 
  - Try port 465 instead of 587
  - Check if your network/firewall blocks SMTP ports
  - Verify the hostname is correct

### Issue: "Email sent but not received"
- **Solution**:
  - Check spam/junk folder
  - Verify sender email is correct
  - Check email forwarding rules
  - Wait a few minutes (can be delayed)

## Quick Reference

### GoDaddy Workspace Email (Most Common)
```
Host: smtpout.secureserver.net
Port: 587
Encryption: TLS
Username: support@tolatola.co
Password: [your password]
```

### Microsoft 365
```
Host: smtp.office365.com
Port: 587
Encryption: TLS
Username: support@tolatola.co
Password: [your password]
```

## Still Having Issues?

1. **Contact GoDaddy Support**:
   - They can provide exact SMTP settings for your account
   - Ask: "What are the SMTP settings for support@tolatola.co?"

2. **Check GoDaddy Documentation**:
   - Search: "GoDaddy email SMTP settings"
   - Look for your specific email plan

3. **Alternative: Use Different Email Service**:
   - Consider using SendGrid, Mailgun, or AWS SES
   - These are more reliable for transactional emails

