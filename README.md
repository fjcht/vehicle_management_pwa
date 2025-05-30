
# 🚗 Vehicle Management PWA

A comprehensive Progressive Web Application for vehicle management, featuring VIN scanning, client management, appointment scheduling, and repair tracking.

## ✨ Features

- **🔍 VIN Scanner**: Camera-based VIN code scanning with NHTSA integration
- **👥 Client Management**: Complete customer database with contact information
- **🚗 Vehicle Management**: Detailed vehicle records with maintenance history
- **📅 Appointment Scheduling**: Service appointment booking and management
- **🔧 Repair Tracking**: Work order management and repair history
- **👨‍💼 Employee Management**: Staff roles and access control
- **📱 PWA Support**: Install as mobile app with offline capabilities
- **🔐 Secure Authentication**: Role-based access control
- **📊 Dashboard**: Overview of business metrics and activities

## 🚀 Quick Start

### For Vercel Deployment (Recommended)

1. **Clone and Setup:**
   ```bash
   git clone https://github.com/yourusername/vehicle-management-pwa.git
   cd vehicle-management-pwa
   ./setup-vercel.sh
   ```

2. **Deploy to Vercel:**
   Follow the detailed guide in `README_DEPLOYMENT_VERCEL.md`

### For Local Development

1. **Prerequisites:**
   - Node.js 18+ 
   - Yarn package manager
   - PostgreSQL database

2. **Setup:**
   ```bash
   # Install dependencies
   cd app
   yarn install
   
   # Configure environment
   cp ../.env.example .env
   # Edit .env with your database and auth settings
   
   # Setup database
   npx prisma generate
   npx prisma db push
   
   # Start development server
   yarn dev
   ```

3. **Access the application:**
   - Open http://localhost:3000
   - Register your first admin user
   - Start managing vehicles!

## 📋 Deployment Options

### Vercel (Recommended)
- **Guide**: `README_DEPLOYMENT_VERCEL.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Setup**: `./setup-vercel.sh`

### Other Platforms
The application can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **PWA**: Service Worker, Web App Manifest
- **Camera**: WebRTC for VIN scanning
- **Charts**: Chart.js for analytics

## 📱 PWA Features

- **Installable**: Add to home screen on mobile devices
- **Offline Support**: Core functionality works without internet
- **Camera Access**: VIN scanning using device camera
- **Responsive**: Optimized for all screen sizes
- **Fast Loading**: Optimized performance and caching

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | ✅ |
| `NEXTAUTH_URL` | Application URL | ✅ |

### Database Setup

The application uses PostgreSQL with Prisma. Supported providers:
- Vercel Postgres (recommended for Vercel deployment)
- Supabase
- Railway
- PlanetScale
- Self-hosted PostgreSQL

## 📖 Documentation

- **Deployment Guide**: `README_DEPLOYMENT_VERCEL.md`
- **Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Environment Template**: `.env.example`
- **Setup Script**: `setup-vercel.sh`

## 🔒 Security Features

- **Authentication**: Secure user authentication with NextAuth.js
- **Authorization**: Role-based access control
- **Data Protection**: Input validation and sanitization
- **HTTPS**: Enforced secure connections
- **Environment Security**: Secure environment variable handling

## 🎯 Use Cases

- **Auto Repair Shops**: Manage customer vehicles and service appointments
- **Fleet Management**: Track company vehicle maintenance and repairs
- **Dealerships**: Customer vehicle history and service scheduling
- **Independent Mechanics**: Client and vehicle management system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Deployment Issues**: Check `README_DEPLOYMENT_VERCEL.md`
- **Configuration Help**: Review `.env.example`
- **Feature Questions**: Open an issue on GitHub

---

**Ready to deploy?** Start with `./setup-vercel.sh` and follow `README_DEPLOYMENT_VERCEL.md`!
