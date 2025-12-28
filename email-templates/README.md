# Email Templates for TOLA

This directory contains email templates used for user communications.

## Templates

### signup-verification.html
Professional email template for new user signup verification.

**Variables used:**
- `{{ .FullName }}` - User's full name
- `{{ .Email }}` - User's email address
- `{{ .ConfirmationURL }}` - Email verification link

## How to Use

1. Copy the HTML content from `signup-verification.html`
2. Go to Supabase Dashboard → Authentication → Email Templates
3. Select "Confirm signup" template
4. Paste the HTML content
5. Update the subject line to: "Welcome to TOLA - Verify Your Email Address"
6. Save the template

## Customization

You can customize the templates by:
- Changing colors to match your brand
- Updating the logo/header
- Modifying the messaging
- Adding your social media links

## Supabase Template Variables

Supabase provides these variables automatically:
- `{{ .ConfirmationURL }}` - The verification link
- `{{ .Token }}` - The verification token (if needed)
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email
- `{{ .FullName }}` - User's full name (from user metadata)

## Testing

After updating the template:
1. Create a test account
2. Check the email inbox
3. Verify the email renders correctly
4. Test the verification link

