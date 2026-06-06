# AI Business Plan Generator - Fullstack Technical Test

**Status**: Development build complete with core features. Ready for Vercel + Railway deployment.

---

## 📋 Project Overview

A fullstack web application that generates AI-powered business plans.

**Stack:**
- **Frontend**: Next.js (App Router, JavaScript, no TypeScript)
- **Styling**: Tailwind 
- **Database**: MySQL (via Prisma ORM v5)
- **AI**: Gemini 3.5 Flash
- **Hosting**: Vercel (fullstack)

---

## ✅ Completed Implementation

### Authentication & Sessions
- ✅ NextAuth configuration (`lib/auth.js`)
- ✅ Credentials provider with password hashing
- ✅ JWT-based sessions (no database sessions)
- ✅ SessionWrapper component for client-side auth
- ✅ Protected API routes using `getServerSession()`

### API Endpoints
- ✅ POST `/api/register` - User registration
- ✅ POST `/api/auth/[...nextauth]` - Authentication
- ✅ POST `/api/generate` - AI business plan generation
- ✅ GET `/api/history` - Fetch user's plans

### Pages & UI
- ✅ Landing page (`app/page.js`)
- ✅ Login page (`app/login/page.js`)
- ✅ Registration page (`app/register/page.js`)
- ✅ Dashboard with generator (`app/dashboard/page.js`)
- ✅ Tailwind CSS styling
- ✅ Responsive design

### Database
- ✅ Prisma schema
- ✅ User management
- ✅ Business plan storage
- ✅ Migrations created


---

## 🚀 Local Development Guide

### Prerequisites
- Node.js 18+
- MySQL 5.7+
- npm

### 1. Setup Environment

```bash
cd "/Applications/MAMP/htdocs/AI Business Plan Generator"
npm install
```

### 2. Database Configuration

**MAMP (Recommended - Already Running)**:
```env
DATABASE_URL="mysql://root:root@localhost:3306/ai-business-plan"
```

### 3. Create `.env` File

```env
DATABASE_URL="mysql://root:root@localhost:3306/ai-business-plan"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="your-key-here"
```

### 4. Initialize Database

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE \`ai-business-plan\`;"

# Generate Prisma
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: View data
npx prisma studio
```

### 5. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

### 6. Test Registration

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

---

## 🎯 Testing Workflow

1. **Register**: Visit `/register` and create account
2. **Login**: Go to `/login` with credentials  
3. **Generate**: On dashboard, fill form and click "Generate"
4. **View History**: See all past plans in history section

---


## 🔧 Technical Details

### Authentication Flow
```
User → Register/Login → NextAuth → JWT Token → Protected Routes
```

### Database Schema
```
User (id, email, password, name, createdAt)
  ├── BusinessPlan (id, userId, industry, capital, skills, result)
  ├── Session (sessionToken - from NextAuth)
  └── Account (OAuth - prepared but not used)
```

### API Security
- ✅ Session validation on protected routes
- ✅ Password hashing (SHA-256 dev, use bcryptjs for prod)
- ✅ NEXTAUTH_SECRET prevents tampering
- ✅ CORS ready for Vercel

---

## 📋 File Checklist

- [x] `app/layout.js` - Root layout with SessionWrapper
- [x] `app/page.js` - Landing page
- [x] `app/login/page.js` - Login form
- [x] `app/register/page.js` - Registration form
- [x] `app/dashboard/page.js` - Main app dashboard
- [x] `app/api/auth/[...nextauth]/route.js` - Auth handler
- [x] `app/api/register/route.js` - Register endpoint
- [x] `app/api/generate/route.js` - AI generation
- [x] `app/api/history/route.js` - History endpoint
- [x] `lib/auth.js` - NextAuth config
- [x] `lib/prisma.js` - Prisma singleton
- [x] `components/SessionWrapper.jsx` - Provider
- [x] `prisma/schema.prisma` - Database schema
- [x] `.env` - Environment template
- [x] `tsconfig.json` - Path aliases
- [x] `package.json` - Dependencies

---

## 🎓 Learning Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [NextAuth.js JWT](https://next-auth.js.org/providers/credentials)
- [Prisma MySQL](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases)
- [Railway Deployment](https://docs.railway.app/databases/mysql)

---

**Status**: Ready for production deployment
**Last Updated**: June 6, 2026


You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
