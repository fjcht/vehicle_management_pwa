
# Vehicle Management PWA - Vercel Deployment Guide

This guide will help you deploy the Vehicle Management PWA to Vercel with all necessary configurations.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- PostgreSQL database (we recommend Vercel Postgres)

## Step-by-Step Deployment

### 1. Prepare Your Repository

1. **Upload to GitHub:**
   ```bash
   # Initialize git repository (if not already done)
   git init
   git add .
   git commit -m "Initial commit - Vehicle Management PWA"
   
   # Create repository on GitHub and push
   git remote add origin https://github.com/yourusername/vehicle-management-pwa.git
   git branch -M main
   git push -u origin main
   ```

### 2. Set Up Database

#### Option A: Vercel Postgres (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Storage" → "Create Database" → "Postgres"
3. Choose your region and create the database
4. Copy the `DATABASE_URL` from the connection details

#### Option B: External PostgreSQL Service
- **Supabase:** Create project at [supabase.com](https://supabase.com)
- **Railway:** Create database at [railway.app](https://railway.app)
- **PlanetScale:** Create database at [planetscale.com](https://planetscale.com)

### 3. Deploy to Vercel

1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository: `vehicle-management-pwa`

2. **Configure Build Settings:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `app`
   - **Build Command:** `yarn build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `yarn install` (default)

3. **Set Environment Variables:**
   Click "Environment Variables" and add:
   ```
   DATABASE_URL=your_database_connection_string
   NEXTAUTH_SECRET=your_generated_secret
   NEXTAUTH_URL=https://your-project-name.vercel.app
   ```

   **To generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete (usually 2-3 minutes)

### 4. Post-Deployment Setup

1. **Initialize Database:**
   After successful deployment, the database schema will be automatically created via Prisma migrations.

2. **Create Admin User:**
   You'll need to create your first admin user through the registration page:
   - Visit: `https://your-project-name.vercel.app/register`
   - Create your admin account
   - This will be your main administrative user

3. **Test the Application:**
   - Login with your admin credentials
   - Test core features:
     - Vehicle management
     - VIN scanner (requires HTTPS for camera access)
     - Client management
     - Appointment scheduling

### 5. Domain Configuration (Optional)

1. **Custom Domain:**
   - In Vercel Dashboard → Project Settings → Domains
   - Add your custom domain
   - Update `NEXTAUTH_URL` environment variable to your custom domain

### 6. Monitoring and Maintenance

1. **Check Logs:**
   - Vercel Dashboard → Project → Functions tab
   - Monitor for any runtime errors

2. **Database Management:**
   - Use Prisma Studio for database inspection:
   ```bash
   npx prisma studio
   ```

3. **Updates:**
   - Push changes to your GitHub repository
   - Vercel will automatically redeploy

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check that all environment variables are set
   - Ensure `DATABASE_URL` is accessible from Vercel
   - Verify Prisma schema is valid

2. **Database Connection Issues:**
   - Verify `DATABASE_URL` format
   - Check database service is running
   - Ensure IP restrictions allow Vercel access

3. **Authentication Issues:**
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your domain
   - Ensure HTTPS is enabled (required for production)

4. **Camera/VIN Scanner Issues:**
   - VIN scanner requires HTTPS to access camera
   - Test on mobile devices for best camera experience

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Generated 32-character string |
| `NEXTAUTH_URL` | Full URL of your application | `https://your-app.vercel.app` |

### Performance Optimization

1. **Database Optimization:**
   - Use connection pooling for production
   - Consider read replicas for high traffic

2. **Caching:**
   - Vercel automatically handles static file caching
   - Consider implementing API response caching for frequently accessed data

3. **Monitoring:**
   - Set up Vercel Analytics for performance insights
   - Monitor function execution times and errors

## Support

For deployment issues:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Review build logs in Vercel Dashboard
3. Check database connectivity and permissions

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use strong, unique secrets for production

2. **Database Security:**
   - Use SSL connections for database
   - Implement proper access controls
   - Regular security updates

3. **Application Security:**
   - HTTPS is enforced by Vercel
   - NextAuth.js handles secure authentication
   - Input validation is implemented throughout the app

---

**Deployment Checklist:**
- [ ] Repository uploaded to GitHub
- [ ] Database created and accessible
- [ ] Environment variables configured in Vercel
- [ ] Project deployed successfully
- [ ] Admin user created
- [ ] Core features tested
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring set up
