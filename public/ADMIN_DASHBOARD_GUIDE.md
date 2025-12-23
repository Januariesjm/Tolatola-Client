# Admin Dashboard Access Guide - Dan'g Group Ltd Marketplace

## Overview

The admin dashboard system uses **role-based access control (RBAC)** with 5 distinct admin roles, each with specific permissions and access levels. This guide explains how to access and manage each dashboard.

## 5 Admin Roles & Their Responsibilities

### 1. **Super Admin** (Access Level: 100%)
**Responsibilities:** Full system control, owner/system master

**Access to:**
- ✅ Analytics Dashboard
- ✅ KYC Vendor Approval
- ✅ Product Approval Management
- ✅ Orders Management
- ✅ Escrow Management
- ✅ Payout Processing
- ✅ Support Tickets
- ✅ Promotions & Ads Management
- ✅ Admin User Management

**How to Access:**
1. Login with your Super Admin account
2. Navigate to `/admin` or click "Admin Dashboard" in header
3. You'll see all tabs available with full control

**Key Actions:**
- Assign/remove other admin roles
- Manage all system functions
- View complete analytics and reports
- Configure promotions and advertisements
- Handle escalated support tickets

---

### 2. **IT Admin** (Access Level: 90%)
**Responsibilities:** Technical infrastructure and system management

**Access to:**
- ✅ Analytics Dashboard
- ✅ KYC Vendor Approval
- ✅ Product Approval Management
- ✅ Orders Management
- ✅ Escrow Management
- ✅ Support Tickets
- ✅ Promotions Management
- ✅ System Configuration
- ❌ Payout Processing (Finance role only)
- ❌ Admin User Management (Super Admin only)

**How to Access:**
1. Login with IT Admin credentials
2. Go to `/admin`
3. You'll see all tabs except Payouts and Admin Management

**Key Actions:**
- Approve/reject vendors
- Manage product listings
- Track orders and escrow
- Handle technical support issues
- Configure promotional campaigns

---

### 3. **Finance Admin** (Access Level: 70%)
**Responsibilities:** Financial management and vendor payouts

**Access to:**
- ✅ Analytics Dashboard (Financial Reports Only)
- ✅ Payout Processing & Approval
- ✅ Transaction Management
- ❌ KYC Approval
- ❌ Product Management
- ❌ Orders
- ❌ Support Tickets
- ❌ Promotions
- ❌ Admin Management

**How to Access:**
1. Login with Finance Admin credentials
2. Go to `/admin`
3. You'll only see "Analytics" and "Payouts" tabs

**Key Actions:**
- Process vendor payouts
- View financial reports
- Manage transaction records
- Monitor revenue and disputes
- Generate financial statements

---

### 4. **Vendor Manager** (Access Level: 65%)
**Responsibilities:** Vendor registration and product management

**Access to:**
- ✅ Analytics Dashboard
- ✅ KYC Vendor Approval
- ✅ Product Approval Management
- ✅ Orders Management
- ❌ Escrow Management
- ❌ Payout Processing
- ❌ Support Tickets
- ❌ Promotions
- ❌ Admin Management

**How to Access:**
1. Login with Vendor Manager credentials
2. Go to `/admin`
3. You'll see vendor, product, orders, and analytics tabs

**Key Actions:**
- Approve/reject vendor KYC applications
- Review and approve products
- Monitor vendor performance
- Manage vendor disputes
- View vendor analytics

---

### 5. **Marketing & Support** (Access Level: 50%)
**Responsibilities:** Customer relations and marketing campaigns

**Access to:**
- ✅ Analytics Dashboard
- ✅ Support Tickets Management
- ✅ Promotions & Ads Management
- ❌ KYC Approval
- ❌ Product Management
- ❌ Orders
- ❌ Escrow
- ❌ Payouts
- ❌ Admin Management

**How to Access:**
1. Login with Marketing & Support credentials
2. Go to `/admin`
3. You'll see analytics, support tickets, and promotions tabs

**Key Actions:**
- Respond to customer support tickets
- Create promotional banners
- Manage advertising campaigns
- View customer engagement analytics
- Handle customer complaints

---

## How Super Admin Creates New Admin Users

### Step 1: Access Admin User Management
1. Login as Super Admin
2. Go to `/admin`
3. Click on the **"Admin Users"** tab (visible only to Super Admin)

### Step 2: View Current Admins
- See a table of all existing admin users
- View their roles, access levels, and creation dates

### Step 3: Assign New Admin Role
1. Click **"Add Admin"** button
2. Select a user email from the dropdown (must be existing user)
3. Choose the admin role from the role dropdown:
   - Super Admin
   - IT Admin
   - Finance Admin
   - Vendor Manager
   - Marketing & Support
4. Click **"Assign Role"**

### Step 4: Remove Admin Access
1. Click the **"Remove"** button next to any admin
2. Confirm the action
3. User will lose admin access immediately

---

## Direct URL Access

Each admin role can directly access their dashboard:

```
https://yourdomain.com/admin
```

**Access is controlled by:**
1. User must be logged in
2. User must have an assigned admin role
3. User's role permissions determine visible tabs and features

---

## Admin Dashboard Tabs Explained

### Analytics Tab
- **Available to:** All admin roles
- **Shows:** Dashboard statistics, KPIs, revenue charts
- **Access Level:** View-only for most, detailed for Super Admin

### KYC Approval Tab
- **Available to:** Super Admin, IT Admin, Vendor Manager
- **Shows:** Pending vendor applications
- **Actions:** Approve/Reject KYC, request documents

### Products Tab
- **Available to:** Super Admin, IT Admin, Vendor Manager
- **Shows:** Pending product listings
- **Actions:** Approve/Reject products, flag for review

### Orders Tab
- **Available to:** Super Admin, IT Admin, Vendor Manager
- **Shows:** All marketplace orders
- **Actions:** Track orders, manage disputes

### Escrow Tab
- **Available to:** Super Admin, IT Admin
- **Shows:** Held escrow payments
- **Actions:** Release/Hold payments, manage disputes

### Payouts Tab
- **Available to:** Super Admin, Finance Admin
- **Shows:** Pending and completed vendor payouts
- **Actions:** Approve payouts, set payment methods

### Support Tab
- **Available to:** Super Admin, IT Admin, Marketing & Support
- **Shows:** Customer support tickets
- **Actions:** Respond to tickets, close issues

### Promotions Tab
- **Available to:** Super Admin, IT Admin, Marketing & Support
- **Shows:** Active and scheduled promotional campaigns
- **Actions:** Create promotions, manage ad banners

### Admin Users Tab
- **Available to:** Super Admin only
- **Shows:** List of all admin users and their roles
- **Actions:** Assign/remove admin roles

---

## Security Best Practices

1. **Only Super Admin should:**
   - Create other admin accounts
   - Manage system configuration
   - View audit logs

2. **Each role should:**
   - Use strong, unique passwords
   - Not share login credentials
   - Log out after sessions
   - Report suspicious activity

3. **Role Assignment:**
   - Assign minimal necessary permissions
   - Review admin access quarterly
   - Remove access for inactive admins
   - Document admin changes

---

## Troubleshooting

### "Access Denied" Error
- **Cause:** User doesn't have an admin role assigned
- **Solution:** Super Admin must assign a role via Admin Users tab

### "You don't have permission to view this"
- **Cause:** Your role doesn't have that permission
- **Solution:** Contact Super Admin to upgrade your role

### Can't find a tab?
- **Cause:** Your role doesn't have permission for that feature
- **Solution:** Check your role in the dashboard header (shows "Role • Access Level: X%")

---

## Next Steps

1. **Super Admin:** 
   - Log in and navigate to `/admin` to get started
   - Use "Admin Users" tab to add team members
   - Configure each role's permissions as needed

2. **Other Admins:**
   - Wait for Super Admin to assign your role
   - Log in and navigate to `/admin`
   - Access only the tabs shown for your role

---

## Support

For issues accessing the admin dashboard:
1. Verify your account is created in the system
2. Ask Super Admin to check your role assignment
3. Check your role permissions in the Admin Users tab
4. Clear browser cache and try again

---

**Last Updated:** November 2024
**System:** Dan'g Group Ltd Marketplace v1.0
