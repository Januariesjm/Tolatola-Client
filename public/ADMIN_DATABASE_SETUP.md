# Admin System Database Setup Guide

## Database Schema Overview

The admin system uses the following database tables:

### 1. `admin_roles` Table
Stores the 5 admin roles with their access levels.

```sql
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  access_level INTEGER (0-100),
  description TEXT,
  created_at TIMESTAMPTZ
);
```

**Pre-populated Roles:**
- Super Admin (100%)
- IT Admin (90%)
- Finance Admin (70%)
- Vendor Manager (65%)
- Marketing & Support (50%)

### 2. `admin_permissions` Table
Stores 12 different permissions that can be assigned to roles.

```sql
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id UUID PRIMARY KEY,
  permission_key TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ
);
```

**Permissions:**
- view_dashboard
- manage_vendors
- manage_products
- manage_orders
- manage_payouts
- manage_escrow
- manage_support
- manage_promotions
- manage_admins
- view_analytics
- manage_system
- manage_transactions

### 3. `role_permissions` Junction Table
Maps permissions to roles (many-to-many relationship).

```sql
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID (references admin_roles),
  permission_id UUID (references admin_permissions),
  created_at TIMESTAMPTZ,
  UNIQUE(role_id, permission_id)
);
```

### 4. `users` Table Update
Added `admin_role_id` column to link users to their admin role.

```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS admin_role_id UUID 
REFERENCES public.admin_roles(id) ON DELETE SET NULL;

CREATE INDEX idx_users_admin_role_id ON public.users(admin_role_id);
```

## Migration Scripts

### Script 015: Create Admin Roles Schema
**File:** `scripts/015_create_admin_roles.sql`

This script:
- Creates `admin_roles` table
- Creates `admin_permissions` table
- Creates `role_permissions` junction table
- Inserts 5 default roles
- Inserts 12 default permissions
- Assigns permissions to each role
- Enables RLS policies

**Run first if schema doesn't exist.**

### Script 016: Seed Initial Super Admin (Optional)
**File:** `scripts/016_seed_initial_super_admin.sql`

This script provides template SQL for assigning Super Admin role to a specific email.

**Template:**
```sql
UPDATE public.users 
SET admin_role_id = (SELECT id FROM public.admin_roles WHERE role_name = 'Super Admin')
WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with your actual email.

### Script 017: Fix Admin Role Schema
**File:** `scripts/017_fix_admin_role_schema.sql`

This script:
- Ensures `admin_role_id` column exists in `users` table
- Creates index for faster lookups
- Verifies all admin roles are properly set up

**Run after scripts 015 if you encounter migration errors.**

## How to Execute Migration Scripts

### Option 1: Using Supabase Dashboard
1. Go to Supabase Dashboard
2. Select your project
3. Go to SQL Editor
4. Click "New Query"
5. Copy and paste script content
6. Click "Run"

### Option 2: Using v0 Script Execution
1. Files are in `/scripts` folder
2. v0 can execute SQL scripts directly
3. Request execution through the UI

## Verifying Setup

After running migrations, verify everything is set up:

```sql
-- Check if admin_roles exist
SELECT COUNT(*) as role_count, role_name, access_level 
FROM public.admin_roles 
GROUP BY role_name, access_level
ORDER BY access_level DESC;

-- Check if admin_permissions exist
SELECT COUNT(*) as permission_count 
FROM public.admin_permissions;

-- Check if role_permissions are mapped
SELECT 
  ar.role_name, 
  COUNT(ap.permission_key) as permission_count
FROM public.role_permissions rp
JOIN public.admin_roles ar ON rp.role_id = ar.id
JOIN public.admin_permissions ap ON rp.permission_id = ap.id
GROUP BY ar.role_name;

-- Check users with admin roles
SELECT 
  u.email, 
  u.full_name,
  ar.role_name,
  ar.access_level
FROM public.users u
LEFT JOIN public.admin_roles ar ON u.admin_role_id = ar.id
WHERE u.admin_role_id IS NOT NULL;
```

## RLS (Row Level Security) Policies

The admin system includes RLS policies that:
- Only allow admins to view admin-related tables
- Only allow Super Admin to assign/remove roles
- Prevent unauthorized access to admin data

Policies are automatically created by the migration scripts.

## Troubleshooting Database Issues

### Issue: "Column admin_role_id does not exist"
**Solution:**
1. Run script 017 to add the column
2. Verify the column was created: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS admin_role_id UUID;`

### Issue: "Table admin_roles does not exist"
**Solution:**
1. Run script 015 to create all necessary tables

### Issue: Admin roles not showing up
**Solution:**
1. Run script 015 to seed default roles
2. Verify: `SELECT * FROM public.admin_roles;`

### Issue: Permissions not assigned to roles
**Solution:**
1. Run script 015 - it includes permission assignment
2. Verify: Check the role_permissions table

## Data Model Diagram

```
┌─────────────────────┐
│      users          │
├─────────────────────┤
│ id (PK)             │
│ email               │
│ full_name           │
│ user_type           │
│ admin_role_id (FK)  │◄─────┐
├─────────────────────┤      │
│ ... other fields    │      │
└─────────────────────┘      │
                             │
                        ┌────┴──────────────┐
                        │                   │
                   ┌────▼──────────────┐   │
                   │  admin_roles      │   │
                   ├───────────────────┤   │
                   │ id (PK)           │   │
                   │ role_name         │   │
                   │ access_level      │   │
                   │ description       │   │
                   └────┬──────────────┘   │
                        │                   │
                        │ (1 to Many)       │
                        │                   │
            ┌───────────▼──────────────┐   │
            │ role_permissions         │   │
            ├──────────────────────────┤   │
            │ id (PK)                  │   │
            │ role_id (FK)────────────────┘
            │ permission_id (FK)       │
            └──────────────┬───────────┘
                           │
                           │ (Many to Many)
                           │
            ┌──────────────▼───────────┐
            │ admin_permissions        │
            ├──────────────────────────┤
            │ id (PK)                  │
            │ permission_key           │
            │ permission_name          │
            │ description              │
            └──────────────────────────┘
```

## Next Steps

1. ✅ Run script 015 to create admin role schema
2. ✅ Run script 017 to ensure all columns exist
3. ✅ Verify using SQL queries above
4. ✅ Assign Super Admin role to your account
5. ✅ Go to `/admin` and access dashboard
6. ✅ Assign roles to team members
