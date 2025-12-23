# Admin Dashboard Setup & Access Instructions

## Overview
This document provides step-by-step instructions for setting up and accessing the admin dashboard system in Dan'g Group Ltd Marketplace.

## System Architecture

Your marketplace has a **5-tier admin role system**:

1. **Super Admin (100%)** - Full system control
   - Only person: You (the owner)
   
2. **IT Admin (90%)** - Technical infrastructure
   - Manages system, technical issues, integrations
   
3. **Finance Admin (70%)** - Financial operations
   - Manages vendor payouts, transactions, financial reports
   
4. **Vendor Manager (65%)** - Vendor operations
   - Approves vendors (KYC), manages products, handles vendor issues
   
5. **Marketing & Support (50%)** - Customer relations
   - Manages support tickets, customer promotions, marketing campaigns

---

## Prerequisites

Before setting up admin access, ensure:
1. ✅ User has created an account on your marketplace (signed up as customer/vendor)
2. ✅ You have Super Admin access to the admin dashboard
3. ✅ The database migration scripts have been executed

### Running Database Migrations

If you haven't already, run these migration scripts in order:

```bash
# 1. Create base tables and admin role schema
scripts/015_create_admin_roles.sql

# 2. Fix admin role schema and ensure column exists
scripts/017_fix_admin_role_schema.sql
```

You can run these directly in your Supabase SQL editor or through the v0 script execution feature.

---

## How to Access Admin Dashboard

### As Super Admin (You):

1. **Navigate to**: `https://yourmarketplace.com/admin`
2. **Login** with your account email and password
3. **You will see**: All 9 admin tabs available

### What Super Admin Sees:
- Analytics Dashboard
- KYC Approval (Vendor verification)
- Product Approval
- Orders Management
- Escrow Management
- Payout Approval
- Support Tickets
- Promotions Management
- Admin Users Management

---

## How to Create New Admin Users

### Step 1: Ensure User Account Exists
- Have the person sign up as a customer or vendor on your marketplace
- They will need their email and password

### Step 2: Go to Admin Users Tab
1. Login to admin dashboard: `https://yourmarketplace.com/admin`
2. Click the **"Admin Users"** tab at the bottom of the navigation

### Step 3: Assign Role
1. In the **"Assign Admin Role"** card:
   - **Select User**: Choose from the dropdown (shows all registered users)
   - **Select Role**: Choose the appropriate role based on their responsibilities
   - Click **"Assign Role"** button

2. User will see confirmation: "Admin role assigned successfully"

### Step 4: User Can Now Access Admin Dashboard
- User navigates to: `https://yourmarketplace.com/admin`
- They will login with their account
- They will see only their role-specific tabs

---

## Admin Role Permissions & Dashboard Tabs

### Super Admin (100% Access)
**Tabs Visible:**
- ✅ Analytics Dashboard
- ✅ KYC Approval
- ✅ Product Approval  
- ✅ Orders Management
- ✅ Escrow Management
- ✅ Payout Approval
- ✅ Support Tickets
- ✅ Promotions Management
- ✅ Admin Users Management

**Responsibilities:**
- System-wide management and policy setting
- Creating other admin roles
- Viewing all reports and metrics
- Approving or suspending vendors
- Controlling payments and contracts

---

### IT Admin (90% Access)
**Tabs Visible:**
- ✅ Analytics Dashboard
- ✅ KYC Approval
- ✅ Product Approval
- ✅ Orders Management
- ✅ Escrow Management
- ✅ Support Tickets
- ✅ Promotions Management
- ❌ Payout Approval
- ❌ Admin Users Management

**Responsibilities:**
- Technical infrastructure management
- System maintenance and updates
- API and integration management
- Bug fixes and performance optimization
- Technical support to vendors

---

### Finance Admin (70% Access)
**Tabs Visible:**
- ✅ Analytics Dashboard
- ✅ Payout Approval
- ❌ KYC Approval
- ❌ Product Approval
- ❌ Orders Management
- ❌ Escrow Management
- ❌ Support Tickets
- ❌ Promotions Management
- ❌ Admin Users Management

**Responsibilities:**
- Vendor payment processing
- Financial reconciliation
- Revenue tracking and reporting
- Commission management
- Transaction monitoring

---

### Vendor Manager (65% Access)
**Tabs Visible:**
- ✅ Analytics Dashboard
- ✅ KYC Approval
- ✅ Product Approval
- ✅ Orders Management
- ❌ Escrow Management
- ❌ Payout Approval
- ❌ Support Tickets
- ❌ Promotions Management
- ❌ Admin Users Management

**Responsibilities:**
- Vendor registration and verification (KYC)
- Product listing quality control
- Vendor performance monitoring
- Handling vendor-buyer disputes
- Vendor feedback and coaching

---

### Marketing & Support (50% Access)
**Tabs Visible:**
- ✅ Analytics Dashboard
- ✅ Support Tickets
- ✅ Promotions Management
- ❌ KYC Approval
- ❌ Product Approval
- ❌ Orders Management
- ❌ Escrow Management
- ❌ Payout Approval
- ❌ Admin Users Management

**Responsibilities:**
- Customer support and ticket handling
- Creating promotional campaigns
- Social media and email marketing
- Customer feedback management
- Running ad campaigns and banners

---

## Common Admin Tasks

### Task 1: Approve a New Vendor (Vendor Manager / Super Admin)
1. Go to **KYC Approval** tab
2. View pending vendors with their documents
3. Review KYC information (business license, TIN, NIDA, etc.)
4. Click **"Approve"** or **"Reject"** with notes
5. Vendor receives notification

### Task 2: Approve Products (Vendor Manager / Super Admin / IT Admin)
1. Go to **Product Approval** tab
2. Review pending products
3. Check product details, images, descriptions
4. Click **"Approve"** or **"Request Changes"**
5. Vendor receives notification

### Task 3: Process Vendor Payouts (Finance Admin / Super Admin)
1. Go to **Payout Approval** tab
2. View pending payout requests from vendors
3. Verify amounts and vendor details
4. Click **"Approve"** to process payment
5. Payout status updates to "Processing" then "Completed"

### Task 4: Handle Customer Support (Marketing & Support / Super Admin)
1. Go to **Support Tickets** tab
2. View open tickets from customers
3. Click ticket to read customer issue
4. Reply with solution or request more info
5. Mark as **"Resolved"** when complete

### Task 5: Create Promotional Banners (Marketing & Support / Super Admin)
1. Go to **Promotions Management** tab
2. Click **"Add Promotion"** button
3. Fill in:
   - Title: "Summer Sale"
   - Description: "50% off all items"
   - Banner Image: Upload promotional image
   - CTA Text: "Shop Now"
   - CTA Link: Product link or shop link
4. Click **"Create Promotion"**
5. Banner appears on homepage hero slider

---

## Troubleshooting

### Issue: User can't access admin dashboard
**Solution:**
1. Verify user has an account and is logged in
2. Check if user is assigned an admin role (go to Admin Users tab)
3. If not assigned, assign them a role following "How to Create New Admin Users" above

### Issue: User sees "You need admin access to view this page"
**Solution:**
- User needs to be assigned an admin role
- Go to Admin Users tab and assign role to their account

### Issue: Admin sees fewer tabs than expected
**Solution:**
- This is correct - each role sees only permitted tabs
- Check the role assignment - make sure correct role was assigned
- To change role, remove and reassign with correct role

### Issue: "Failed to assign role" error
**Solution:**
1. Check that the user account exists in the system
2. Ensure database migration script 017 was executed
3. Try again - may be a temporary connectivity issue

---

## User Scenario Examples

### Scenario 1: Hiring a Vendor Manager
1. Person creates account on marketplace as customer
2. You go to Admin > Admin Users
3. Select their name, choose "Vendor Manager" role
4. They can now access admin dashboard
5. They see only: Analytics, KYC Approval, Product Approval, Orders, Analytics
6. They approve vendors and products

### Scenario 2: Hiring a Finance Admin
1. Person creates account on marketplace as customer
2. You go to Admin > Admin Users
3. Select their name, choose "Finance Admin" role
4. They can now access admin dashboard
5. They see only: Analytics, Payout Approval
6. They process vendor payouts and track finances

### Scenario 3: Hiring a Marketing Manager
1. Person creates account on marketplace as customer
2. You go to Admin > Admin Users
3. Select their name, choose "Marketing & Support" role
4. They can now access admin dashboard
5. They see only: Analytics, Support Tickets, Promotions
6. They manage customer support and create promotional campaigns

---

## Security Best Practices

1. **Only assign admin roles to trusted team members**
   - Each role has significant system access
   - Review who has what access regularly

2. **Remove admin roles when team members leave**
   - Go to Admin Users tab
   - Click "Remove" on their entry
   - Immediately removes their access

3. **Use strong passwords**
   - Require team members to use strong, unique passwords
   - Consider password manager

4. **Monitor admin activity**
   - Check Analytics tab to see all actions
   - Audit logs track who did what and when

5. **Principle of Least Privilege**
   - Assign lowest role that still allows them to do their job
   - Don't make everyone Super Admin

---

## Need Help?

If you encounter issues:
1. Check this documentation first
2. Review the error message and Troubleshooting section
3. Check the debug logs in your browser console (F12)
4. Contact support with error messages and steps to reproduce

---

## Summary Quick Reference

| Task | Who Can Do It | Steps |
|------|--------------|-------|
| Access Admin | Any assigned admin | Go to /admin and login |
| Create Admin | Super Admin only | Admin Users tab → Assign Role |
| Approve Vendor | Vendor Manager, Super Admin, IT Admin | KYC Approval tab → Review → Approve |
| Approve Product | Vendor Manager, Super Admin, IT Admin | Product Approval tab → Review → Approve |
| Process Payout | Finance Admin, Super Admin | Payout Approval tab → Review → Approve |
| Handle Support | Marketing & Support, Super Admin | Support Tickets tab → Reply → Resolve |
| Create Promotion | Marketing & Support, Super Admin | Promotions tab → Add → Create |
