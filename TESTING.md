# 🧪 Testing Guide - AI Business Plan Generator

**Status**: App running on `http://localhost:3000`  
**Database**: Connected ✅  
**Prisma Client**: Generated ✅  
**NextAuth**: Configured ✅

---

## ✅ Complete Testing Checklist

### 1️⃣ **Test Homepage**
```bash
curl http://localhost:3000/ | head -5
```
Expected: HTML with "AI Business Plan Generator"

### 2️⃣ **Test User Registration**

**Via API:**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"pass123","name":"User One"}'
```

Expected Response:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "user1@test.com",
    "name": "User One"
  }
}
```

**Via Browser:**
1. Go to http://localhost:3000/register
2. Fill form with:
   - Name: John Doe
   - Email: john@test.com
   - Password: password123
3. Click "Daftar"
4. Should redirect to login with message

### 3️⃣ **Test Login**

**Via Browser:**
1. Go to http://localhost:3000/login
2. Email: user1@test.com
3. Password: pass123
4. Click "Login"
5. Should redirect to `/dashboard`

### 4️⃣ **Test Dashboard Access**

**Without Login:**
```bash
curl http://localhost:3000/dashboard 2>&1 | grep -o "<!DOCTYPE\|redirected"
```
Expected: HTML redirect or auth error

**With Login:**
1. Login successfully (step 3)
2. You should see dashboard with:
   - Form: Industri, Modal, Skill
   - Button: "Generate Business Plan"
   - Section: History

### 5️⃣ **Test Generate Business Plan**

1. Ensure you're logged in
2. Fill form:
   - **Industri**: F&B
   - **Modal**: Rp 5.000.000
   - **Skill**: memasak, manajemen
3. Click "Generate Business Plan"
4. Wait for Claude API response
5. Result should appear below

> ⚠️ **Note**: Requires valid `ANTHROPIC_API_KEY` in `.env`

### 6️⃣ **Test History**

After generating plans:
1. History section should show past plans
2. Click any plan to view its result
3. List shows: Industry, Capital, Date

### 7️⃣ **Test Logout**

1. Click "Logout" button
2. Should redirect to homepage
3. Session should be cleared

---

## 🔍 Database Verification

### Check Users Table
```bash
npx prisma studio
```
Then navigate to User table to see registered users.

### Manual MySQL Check
```bash
mysql -u root -p ai-business-plan

SELECT * FROM User;
SELECT * FROM BusinessPlan;
```

---

## 📊 Expected Test Results

| Feature | Status | Notes |
|---------|--------|-------|
| Homepage | ✅ | Loads correctly |
| Register | ✅ | Creates user in DB |
| Login | ✅ | Creates JWT session |
| Dashboard | ✅ | Shows only if logged in |
| Generate | ⏳ | Requires API key |
| History | ✅ | Fetches user's plans |
| Logout | ✅ | Clears session |
| Static Assets | ✅ | CSS/JS load |

---

## 🐛 Troubleshooting

### "Cannot find module @prisma/client"
```bash
rm -rf node_modules/.prisma
npx prisma generate
npm run dev
```

### "NextAuth error" in console
- Check `.env` for `NEXTAUTH_SECRET`
- Verify `NEXTAUTH_URL=http://localhost:3000`
- Check browser console for exact error

### Database Connection Error
```bash
mysql -u root -p -e "SELECT 1;"
npx prisma migrate status
```

### Claude API not responding
- Verify `ANTHROPIC_API_KEY` is set: `echo $ANTHROPIC_API_KEY`
- Check API quota at https://console.anthropic.com
- Try smaller prompt

---

## 📝 Test Data

### Test Accounts (Pre-created)
```
Email: test@test.com
Password: test123
```

### Sample Business Plans to Generate

**Scenario 1: Coffee Shop**
- Industri: Kopi
- Modal: Rp 10.000.000
- Skill: memasak, customer service

**Scenario 2: Tech Startup**
- Industri: SaaS
- Modal: Rp 50.000.000
- Skill: coding, product design

---

## ✨ Success Indicators

After completing all tests, you should see:
- ✅ Database populated with users
- ✅ Generated business plans saved
- ✅ No errors in browser console
- ✅ No errors in server logs
- ✅ All pages load with styling
- ✅ Login flow works smoothly

---

## 🚀 Ready for Deployment When:

- [x] Register works
- [x] Login works  
- [x] Dashboard accessible
- [x] Prisma connected
- [x] No console errors
- [ ] Add ANTHROPIC_API_KEY
- [ ] Test generate endpoint
- [ ] Update password hashing
- [ ] Add input validation
- [ ] Deploy to Vercel + Railway

---

**Test Date**: June 6, 2026  
**App Version**: 1.0.0 (Pre-release)
