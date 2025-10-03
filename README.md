# FSAS - Furman Smart Attendance System

A comprehensive QR-based attendance tracking system designed for Furman University, built with modern web technologies and advanced security features.

## 🚀 Features

### Core Functionality
- **QR Code Attendance**: Secure, rotating QR codes for attendance marking
- **Real-time Updates**: Live attendance tracking with Socket.io
- **Role-based Access**: Separate interfaces for professors and students
- **Mobile Optimized**: PWA with offline support and mobile-first design
- **Analytics Dashboard**: Comprehensive attendance analytics and reporting

### Security Features
- **Device Fingerprinting**: Prevents QR code sharing between devices
- **Geofencing**: Location-based attendance validation
- **Secure QR Generation**: HMAC-signed QR codes with time-based expiration
- **Rate Limiting**: API protection against abuse
- **One-time Use**: QR codes can only be scanned once per student

### Technical Features
- **Real-time Communication**: WebSocket-based live updates
- **Offline Support**: Service worker for offline functionality
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Progressive Web App**: Installable with native app-like experience
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: Tailwind CSS with custom components

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Socket.io Client** for real-time communication
- **PWA** capabilities with service worker

### Backend
- **Express.js** with TypeScript
- **Socket.io** for real-time communication
- **Supabase** for authentication and database
- **Redis** for caching and session management
- **Rate limiting** and security middleware

### Database
- **PostgreSQL** with Supabase
- **Row Level Security** (RLS) policies
- **Comprehensive schema** with proper relationships
- **Analytics views** and functions
- **Time-series data** support

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Redis instance (optional, for production)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fsas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_API_URL=http://localhost:3001
   API_PORT=3001
   JWT_SECRET=your_jwt_secret_key
   QR_SECRET=your_qr_secret_key
   REDIS_URL=redis://localhost:6379
   ```

4. **Database Setup** ⚠️ **CRITICAL STEP**
   ```bash
   # Automated database setup (recommended)
   npm run setup-db
   
   # OR manual setup:
   # 1. Open Supabase dashboard
   # 2. Go to SQL Editor
   # 3. Copy contents of database/fixed-user-schema.sql
   # 4. Execute the SQL script
   ```

5. **Start Development Servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:frontend  # Frontend on :3000
   npm run dev:backend   # Backend on :3001
   ```

## 🔐 **Authentication Setup**

**⚠️ IMPORTANT:** The authentication system has been completely fixed and requires proper database setup.

### **Quick Setup:**
1. Run `npm run setup-db` to set up the database
2. Test registration and login at `http://localhost:3000`
3. See `AUTHENTICATION_SETUP.md` for detailed instructions

### **What Was Fixed:**
- ✅ Database schema mismatch resolved
- ✅ User authentication tables created
- ✅ Supabase Auth integration fixed
- ✅ Role-based access control implemented
- ✅ Row Level Security policies added

## 🎯 Usage

### For Professors

1. **Login** with your Furman credentials
2. **Create Courses** and manage class sessions
3. **Start Sessions** to generate QR codes
4. **Monitor Attendance** in real-time
5. **View Analytics** and export reports

### For Students

1. **Login** with your Furman credentials
2. **Scan QR Codes** displayed in class
3. **View Attendance History** and statistics
4. **Get Notifications** for class updates

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get user's courses
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Sessions
- `GET /api/sessions/:courseId` - Get course sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id/qr` - Get current QR code
- `POST /api/sessions/:id/qr/refresh` - Refresh QR code

### Attendance
- `POST /api/sessions/:id/scan` - Scan QR code
- `GET /api/sessions/:id/attendance` - Get attendance records
- `GET /api/sessions/:id/export` - Export attendance data

### Analytics
- `GET /api/analytics/:courseId` - Get course analytics

## 🛡️ Security

### QR Code Security
- **Time-based Expiration**: QR codes expire every 30 seconds
- **HMAC Signatures**: Cryptographically signed QR codes
- **One-time Use**: Each QR code can only be used once per student
- **Device Binding**: Device fingerprinting prevents sharing

### Location Security
- **Geofencing**: Attendance only valid within classroom coordinates
- **GPS Validation**: Real-time location verification
- **Radius Checking**: Configurable proximity requirements

### API Security
- **Rate Limiting**: Prevents API abuse
- **Authentication**: JWT-based authentication
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Comprehensive request validation

## 📱 PWA Features

### Offline Support
- **Service Worker**: Caches essential resources
- **Background Sync**: Syncs data when connection restored
- **Offline Page**: Custom offline experience

### Mobile Optimization
- **Responsive Design**: Works on all screen sizes
- **Touch Gestures**: Optimized for mobile interaction
- **Camera Access**: Native QR code scanning
- **Install Prompt**: Add to home screen functionality

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Build the application
npm run build

# Deploy to Vercel
vercel --prod
```

### Backend (Railway/Render)
```bash
# Deploy backend
# Configure environment variables
# Deploy to your preferred platform
```

### Database (Supabase)
- Set up production database
- Configure RLS policies
- Set up monitoring and backups

## 📊 Monitoring

### Health Checks
- `GET /api/health` - API health status
- Database connection monitoring
- Redis connection monitoring

### Logging
- Structured logging with timestamps
- Error tracking and alerting
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Jovid Jumaev** - *Initial work* - [GitHub](https://github.com/jovidjumaev)

## 🙏 Acknowledgments

- Furman University Computer Science Department
- Supabase for backend services
- Next.js team for the amazing framework
- All open-source contributors

## 📞 Support

For support, email jumajo8@furman.edu or create an issue in the repository.

---

**FSAS** - Making attendance tracking smart, secure, and simple. 🎓
