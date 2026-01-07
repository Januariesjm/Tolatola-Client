# Quick Admin Reference Card

## 🔑 Your Admin Access

**Your Role:** Super Admin  
**Access Level:** 100%  
**Dashboard URL:** `https://yourdomain.com/admin`

---

## 📱 Dashboard Access for All Roles

| Role | Login URL | Can Access |
|------|-----------|-----------|
| Super Admin | /admin | Everything |
| IT Admin | /admin | KYC, Products, Orders, Transactions, Support, Promotions |
| Finance Admin | /admin | Analytics, Payouts Only |
| Vendor Manager | /admin | KYC, Products, Orders, Analytics |
| Marketing & Support | /admin | Support Tickets, Promotions, Analytics |

---

## ⚙️ Setting Up New Admins

### Super Admin Only:
1. Go to `/admin` → "Admin Users" tab
2. Click "Add Admin"
3. Select team member email
4. Choose their role
5. Click "Assign Role"
6. Done ✅

---

## 🎯 What Each Admin Can Do

### Super Admin (You)
- ✅ Approve/reject vendors
- ✅ Approve/reject products  
- ✅ Process payouts
- ✅ Manage support tickets
- ✅ Create promotional banners
- ✅ Create other admins
- ✅ View full analytics

### IT Admin
- ✅ Approve/reject vendors & products
- ✅ Manage orders & transactions
- ✅ Handle support tickets
- ✅ Create promotions
- ❌ Cannot process payouts

### Finance Admin
- ✅ Process vendor payouts
- ✅ View financial reports
- ❌ Cannot approve vendors/products

### Vendor Manager
- ✅ Approve/reject vendors
- ✅ Approve/reject products
- ✅ View orders
- ❌ Cannot process payouts

### Marketing & Support
- ✅ Manage support tickets
- ✅ Create promotions
- ✅ View engagement analytics
- ❌ Cannot approve vendors

---

## 🔐 Security Reminders

1. **Never share admin passwords**
2. **Logout after each session**
3. **Remove admin access for inactive team members**
4. **Only assign minimum needed permissions**

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Team member can't access `/admin` | Assign their admin role via Admin Users tab |
| Can't see a specific tab | That role doesn't have permission for it |
| Can't assign a role | Only Super Admin can do this |
| User was removed, still has access | Clear browser cache, log out/in again |

---

## 📞 Getting Help

- **Dashboard Guide:** See `ADMIN_DASHBOARD_GUIDE.md`
- **Setup Info:** See `ADMIN_SETUP_CHECKLIST.md`
- **Issue:** Contact Super Admin

---

**Ready to go! 🚀**
```
