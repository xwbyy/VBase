# VBase - Professional Database-as-a-Service Platform

## Project Overview
VBase adalah platform database-as-a-service profesional dengan desain modern iOS-style dark mode, sidebar navigation, dan blur effects glassmorphism. Platform ini memungkinkan pengguna untuk membuat, mengelola, dan mengakses database melalui REST API dengan authentication berbasis API key.

## Status Saat Ini
✅ **RUNNING** - Server berjalan di port 5000
✅ **UI/UX** - Mobile-friendly design dengan overflow fixes
✅ **Admin** - Dbadmin implemented (admin@vynaa.web.id)
✅ **Persistence** - Google Sheets integration implemented
✅ **Features** - Loading animations & Plan limits implemented

## Fitur yang Sudah Dibangun

### Design & User Experience
- Premium iOS-style dark mode theme dengan blur effects (glassmorphism)
- Sidebar navigation dengan mobile-responsive behavior
- 70px sidebar on mobile, full 280px on desktop
- Backdrop blur effect untuk navbar dan modals
- Smooth transitions dan hover effects
- Fully responsive di semua devices (mobile, tablet, desktop)

### Authentication & User Management
- Login/Register system
- Session management dengan secure cookies
- User profile dengan API key
- Sidebar user card dengan avatar dan plan info
- Demo account: demo@vbase.com / demo123

### Dashboard & Navigation
- Professional sidebar navigation dengan sections (Main, Developer, Account)
- Dynamic navbar yang menunjukkan page title dan subtitle
- Dashboard dengan statistik real-time
- Quick action buttons
- API usage guide dengan code examples

### Database Management
- Create databases dengan berbagai format (JSON, TEXT, CSV, TABLE)
- Database listing dengan type badge
- Modal dialog untuk create new database
- Delete functionality
- Record count tracking

### API System
- API key authentication dengan header `X-API-Key`
- REST endpoints untuk CRUD operations:
  - `POST /api/db/:dbId/insert` - Insert data
  - `GET /api/db/:dbId/select` - Get all records
  - `POST /api/db/:dbId/update/:recordId` - Update record
  - `DELETE /api/db/:dbId/delete/:recordId` - Delete record
- In-memory database (siap upgrade ke PostgreSQL)

### Developer Tools & Documentation
- **API Tools Page** - Query builder, API reference, API tester
- **Documentation Page** - Full API documentation dengan:
  - Getting started guide
  - Authentication details
  - Complete endpoint reference dengan curl examples
  - Response format examples
  - Error handling guide
  - Best practices

### Subscription Tiers
- **Free**: 500 requests/month (Rp 0)
- **Professional**: Rp 15.000/month, 10.000 requests
- **VIP 1**: Rp 25.000/month, 20.000 requests
- **Enterprise**: Rp 40.000/month, 100.000 requests

## Tech Stack
- **Backend**: Node.js + Express.js
- **Frontend**: EJS templates
- **Styling**: Pure CSS (premium iOS-style design)
- **Authentication**: Session-based
- **Database**: In-memory MVP (ready untuk upgrade)
- **Google Sheets**: Credentials sudah tersimpan di sheet.json

## Project Structure
```
/home/runner/workspace/
├── server.js                 # Express server dengan routes lengkap
├── package.json              # Dependencies
├── sheet.json                # Google Sheets credentials
├── views/
│   ├── header.ejs           # Sidebar + navbar layout
│   ├── footer.ejs           # Footer
│   ├── index.ejs            # Home page
│   ├── login.ejs            # Login page
│   ├── register.ejs         # Register page
│   ├── dashboard.ejs        # User dashboard
│   ├── databases.ejs        # Database management
│   ├── tools.ejs            # API tools & query builder
│   ├── docs.ejs             # API documentation
│   └── profile.ejs          # User settings
├── public/
│   ├── css/style.css        # Premium dark mode CSS dengan sidebar
│   └── js/app.js            # Client-side functionality
└── replit.md                # This file
```

## Responsive Behavior
- **Desktop (> 768px)**: Full 280px sidebar, main content fills remaining space
- **Tablet (768px)**: 70px collapsed sidebar with hover tooltips
- **Mobile (< 480px)**: 60px minimal sidebar, optimized mobile layout
- All cards, buttons, dan forms responsive dan touch-friendly

## Color Scheme (Dark Mode)
- Primary Background: #0f172a
- Secondary Background: #1e293b
- Tertiary Background: #334155
- Primary Text: #f1f5f9
- Secondary Text: #cbd5e1
- Accent: Linear gradient #6366f1 → #8b5cf6
- Borders: #334155 (20% opacity)

## How to Use

### For End Users
1. Sign up atau login dengan demo@vbase.com / demo123
2. View dashboard dengan statistik dan quick actions
3. Navigate via sidebar ke Databases, API Tools, atau Docs
4. Create database di Databases page
5. Copy API key dari dashboard atau profile
6. Use API tools page untuk test requests

### For Developers
1. Check Documentation page (/docs) untuk full API reference
2. Use API Tools page untuk query builder dan tester
3. Copy curl examples dari docs untuk implementation
4. Store API key di environment variables, jangan di code
5. Monitor requests di dashboard

## Features yang Sudah Developer-Friendly
1. **Comprehensive Documentation** - Full API reference dengan examples
2. **Query Builder** - Visual API request builder
3. **API Tester** - Test requests langsung dari dashboard
4. **Code Examples** - curl examples di setiap endpoint
5. **Dashboard Analytics** - Track API usage real-time
6. **Error Handling** - Clear error messages dan HTTP status codes

## Next Steps untuk Production
1. **Database Backend** - Upgrade ke PostgreSQL untuk persistent storage
2. **Google Sheets Sync** - Setup Google Sheets API integration
3. **Payment System** - Implement Stripe untuk subscriptions
4. **Rate Limiting** - Add request throttling per API key
5. **API Key Management** - Reset key, rotation, permissions
6. **Monitoring** - Request logging dan analytics

## Mobile Experience
- Sidebar automatically collapses ke 70px (tablet) dan 60px (mobile)
- All modals, forms, dan content responsive dengan padding adjustments
- Touch-friendly button sizing (min 44px for mobile)
- Optimal font sizes untuk readability di semua screen sizes
- No horizontal scrolling, all content fits viewport

## Notes
- Server runs on 0.0.0.0:5000 dengan auto-restart
- Session timeout: 24 hours
- All user data in-memory (resets on server restart)
- Google Sheets credentials ready di sheet.json
- No emojis di UI (clean professional design)
- CSS menggunakan CSS variables untuk easy theming

---
**Last Updated**: 31 Dec 2024
**Version**: 1.0.0
