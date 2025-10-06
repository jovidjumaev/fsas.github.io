# FSAS - Furman Smart Attendance System

A comprehensive QR-based attendance tracking system designed for Furman University. This project is part of my seminar course project and demonstrates modern web development practices with real-time features and advanced security.

## Features

**Core Functionality**
- QR Code Attendance: Secure, rotating QR codes for attendance marking
- Real-time Updates: Live attendance tracking with WebSocket communication
- Role-based Access: Separate interfaces for professors and students
- Mobile Optimized: Progressive Web App with offline support
- Analytics Dashboard: Comprehensive attendance analytics and reporting

**Security Features**
- Device Fingerprinting: Prevents QR code sharing between devices
- Geofencing: Location-based attendance validation
- Secure QR Generation: HMAC-signed QR codes with time-based expiration
- Rate Limiting: API protection against abuse
- One-time Use: QR codes can only be scanned once per student

**Technical Features**
- Real-time Communication: WebSocket-based live updates
- Offline Support: Service worker for offline functionality
- Responsive Design: Works on desktop, tablet, and mobile
- Type Safety: Full TypeScript implementation
- Modern UI: Tailwind CSS with custom components

## Technology Stack

**Frontend**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Zustand for state management
- Socket.io Client for real-time communication

**Backend**
- Express.js with TypeScript
- Socket.io for real-time communication
- Supabase for authentication and database
- Redis for caching and session management

**Database**
- PostgreSQL with Supabase
- Row Level Security (RLS) policies
- Comprehensive schema with proper relationships

## Usage

**For Professors**
1. Login with Furman credentials
2. Create courses and manage class sessions
3. Start sessions to generate QR codes
4. Monitor attendance in real-time
5. View analytics and export reports

**For Students**
1. Login with Furman credentials
2. Scan QR codes displayed in class
3. View attendance history and statistics
4. Get notifications for class updates

## Project Structure

```
fsas/
├── src/                    # Next.js frontend application
├── backend/               # Express.js backend API
├── database/              # SQL schema files
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

## Development

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build
```

## Deployment

The application is configured for GitHub Pages deployment with automatic builds via GitHub Actions. The frontend is deployed as a static site, while the backend requires separate hosting.

## License

This project is licensed under the MIT License.

## Author

**Jovid Jumaev** - Seminar Course Project - Furman University

For questions or support, contact jumajo8@furman.edu