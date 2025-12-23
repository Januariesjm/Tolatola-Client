# Admin Dashboard - Quick Start Guide (5 Minutes)

## Before You Start
- User account must exist in your marketplace (they should have signed up)
- You must have Super Admin access
- Database migrations must be executed (scripts 015 & 017)

## Quick Steps to Setup Admin Access

### Step 1: Check Your Admin Setup (2 minutes)
1. Visit: `https://yourmarketplace.com/admin/verify`
2. You'll see setup status and current admins
3. If status is "error", run the database migration scripts

### Step 2: Access Admin Dashboard (1 minute)
1. Go to: `https://yourmarketplace.com/admin`
2. Login with your email and password
3. You see all 9 admin tabs

### Step 3: Create First Admin (2 minutes)

**To add team member as admin:**

1. In admin dashboard, find **"Admin Users"** tab
2. Click **"Assign Admin Role"** card
3. Select user from "Select User" dropdown
4. Select role from "Select Role" dropdown
   - **Super Admin** = Full control (only for you)
   - **IT Admin** = Technical/Infrastructure
   - **Finance Admin** = Payments/Financial
   - **Vendor Manager** = Vendor/Product approval
   - **Marketing & Support** = Customer support/promotions
5. Click **"Assign Role"**
6. Done! They can now access `/admin`

---

## What Each Role Sees

### Super Admin (100%)
**For You Only**
- All 9 tabs visible
- Full system control

### IT Admin (90%)
- Analytics, KYC Approval, Product Approval, Orders, Escrow, Support, Promotions
- No: Payouts, Admin Users

### Finance Admin (70%)
- Analytics, Payout Approval
- No: KYC, Products, Orders, Support, Promotions

### Vendor Manager (65%)
- Analytics, KYC Approval, Product Approval, Orders, Analytics
- No: Escrow, Payouts, Support, Promotions

### Marketing & Support (50%)
- Analytics, Support Tickets, Promotions Management
- No: KYC, Products, Orders, Escrow, Payouts

---

## Common Tasks (30 seconds each)

**Approve New Vendor:**
1. Go to KYC Approval tab
2. Review business documents
3. Click Approve/Reject

**Approve Product:**
1. Go to Product Approval tab
2. Check product details
3. Click Approve/Request Changes

**Process Payout:**
1. Go to Payout Approval tab
2. Review vendor payout request
3. Click Approve

**Handle Support:**
1. Go to Support Tickets tab
2. Read customer issue
3. Reply with solution
4. Mark Resolved

**Create Promotion:**
1. Go to Promotions tab
2. Click Add Promotion
3. Upload image, add title/description
4. Click Create

---

## Admin Users Management Tab Features

### Add New Admin
- Search and select any registered user
- Choose their role from dropdown
- Click "Assign Role"
- User can now access admin dashboard

### View Current Admins
- Table shows all admin users
- See their role and access level
- Visual access level bar (0-100%)

### Remove Admin
- Click red trash icon on admin entry
- Confirm removal
- User loses admin access immediately

---

## Troubleshooting

**"You need admin access to view this page"**
- User must have assigned admin role
- Go to Admin Users tab
- Search for their name and assign role

**User sees fewer tabs than expected**
- Correct behavior - based on their role
- To change: Remove role, then reassign with correct role

**"Failed to assign role"**
- Ensure user account exists (they must have signed up)
- Try again - may be temporary issue
- Check Admin Verify page for system status

**Can't see Admin Users tab**
- Only Super Admin can see this tab
- User must have Super Admin role

---

## Your Checklist

- [ ] Visit `/admin/verify` to check system status
- [ ] Access `/admin` with your Super Admin account
- [ ] See all 9 tabs (if not, run migrations)
- [ ] Invite first team member to Admin Users tab
- [ ] Have them login to `/admin` with their account
- [ ] Verify they see only their role-specific tabs
- [ ] Test role-specific features

---

## That's It!

Your admin dashboard is now ready. Team members can access at `/admin` based on their assigned role. Each role sees only the tabs they need for their job.

Need more details? See:
- `ADMIN_SETUP_INSTRUCTIONS.md` - Complete setup guide
- `ADMIN_DATABASE_SETUP.md` - Database technical details
