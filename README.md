# Library Clock In/Out Kiosk System

A web-based kiosk system for school libraries to manage student attendance. Students can clock in and out of the library using a simple, touch-friendly interface. Admins can view attendance logs, manage programs, and generate reports.

## Features

### Kiosk Screen
- **Fast Clock In/Out** - Students enter their student number and are auto-populated on file
- **Smart Detection** - System automatically detects if student is clocked in (shows "Clock Out") or out (shows "Clock In")
- **Touch-Friendly** - Large buttons and fields optimized for touchscreens
- **Auto-Reset** - Form clears after each submission, ready for the next student
- **Real-time Clock** - Shows current time for students

### Admin Dashboard
- **Live View** - See who's currently in the library
- **Attendance Logs** - Filter, search, and paginate through attendance history
- **Export to CSV** - Download reports for analysis
- **Program Management** - Add/edit/remove programs
- **Manual Session Close** - Close stuck sessions manually

### Data Integrity
- Validates student number format
- Prevents duplicate clock-ins
- Auto-creates student records on first visit
- Tracks session duration

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Supabase PostgreSQL (free tier, production-ready) or SQLite (single-PC)

## Quick Start (Development - SQLite)
```bash
npm install
npm run dev
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=5000
DATABASE_PATH=./database/library.db
KIOSK_IDLE_TIMEOUT=180000
KIOSK_AUTO_RESET=4000
ADMIN_DEFAULT_USERNAME=admin
ADMIN_DEFAULT_PASSWORD=admin123
```

## Running the System (Development)

### SQLite Mode (Single PC)
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run server
```

### Windows Kiosk Mode
```bash
start-kiosk.bat
```

## Web Deployment (Supabase - Recommended for Schools)

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Creating a free Supabase project
- Running database migrations
- Deploying to Render/Railway/Vercel
- Free tier hosting options

The system is designed to work with **Supabase PostgreSQL** for web deployment where multiple students access simultaneously from different locations.

### Free Cloud Hosting Options
- **Supabase**: Free tier (500MB DB, 2GB storage)
- **Render**: Free web service tier
- **Railway**: Free tier with auto-deploy
- **Vercel**: Free static hosting

## Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change the default password in production!

## Sample Data

The system comes pre-loaded with:
- 8 programs (BSIT, BSCS, BSBA, BSED, BSN, BSECE, BSME, BSArch)
- 5 sample students (2024-001 through 2024-005)

## Usage

### For Students (Kiosk Screen)
1. Navigate to `http://localhost:5000`
2. Enter your student number (auto-fills if on file)
3. Select your program, year level, and purpose
4. Click "Clock In" or "Clock Out"

### For Admins
1. Navigate to `http://localhost:5000/admin/login`
2. Log in with credentials
3. View live sessions, logs, and statistics
4. Export reports as needed

## Kiosk Setup (Windows)

To run as a dedicated kiosk:

1. Open Chrome/Firefox with kiosk mode:
   ```
   chrome.exe --kiosk --incognito http://localhost:5000
   ```

2. Or use the batch file which auto-starts in kiosk mode

3. Set the PC to auto-login and launch kiosk on boot

## Project Structure

```
library/
├── server/
│   ├── routes/
│   │   ├── attendance.js
│   │   ├── admin.js
│   │   ├── programs.js
│   │   └── students.js
│   ├── database.js
│   └── server.js
├── src/
│   ├── components/
│   │   ├── KioskScreen.jsx
│   │   ├── AdminLogin.jsx
│   │   └── AdminDashboard.jsx
│   ├── App.jsx
│   └── main.jsx
├── database/
│   └── library.db (created on first run)
├── package.json
├── vite.config.js
└── start-kiosk.bat
```

## License

ISC
