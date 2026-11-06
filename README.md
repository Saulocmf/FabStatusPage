========================================================================
CUSTOM STATUS PAGE APPLICATION - README
========================================================================

A lightweight, self-hosted system status page inspired by GitHub Status.
Features live health-checking, 30-day historical uptime bars with custom 
tooltips, daily status rollups via SQLite, and timezone-aware scheduling.

------------------------------------------------------------------------
1. PROJECT STRUCTURE
------------------------------------------------------------------------
/status-page
├── backend/
│   ├── db.js             # SQLite database connection & table schemas
│   ├── scheduler.js      # Background cron worker for API health checks
│   ├── server.js         # Express server & API routes (/status-live, /status-history)
│   ├── utils/
│   │   └── dateHelper.js # Timezone utilities using Intl.DateTimeFormat
│   └── package.json
└── frontend/
    ├── index.html        # Main dashboard UI
    ├── config.js         # Frontend configurations & API endpoints
    ├── script.js         # Frontend logic, parallel fetching, & bar rendering
    └── style.css         # Styling, grid layout, & custom popover tooltips

------------------------------------------------------------------------
2. PREREQUISITES & INSTALLATION
------------------------------------------------------------------------
* Node.js (v18+ recommended)
* npm

Installation steps:
1. Navigate to the backend folder:
   cd backend

2. Install dependencies:
   npm install express cors sqlite3 node-cron dotenv

------------------------------------------------------------------------
3. CONFIGURATION (.env)
------------------------------------------------------------------------
Create a `.env` file in your backend root directory with the following 
parameters:

# Server Port Configuration
PORT=3000

# Background Cron Check Frequency (in minutes)
CHECK_INTERVAL_MINUTES=5

# Timezone for calendar rollups and date formatting (e.g., Europe/Paris, America/Sao_Paulo)
APP_TIMEZONE=Europe/Paris

# JSON array of services to monitor
SERVICES_CONFIG='[
  {"id": "api-service", "url": "https://api.yourdomain.com/health"},
  {"id": "auth-service", "url": "https://auth.yourdomain.com/health"},
  {"id": "cdn-service", "url": "https://cdn.yourdomain.com/status"}
]'

------------------------------------------------------------------------
4. RUNNING THE APPLICATION
------------------------------------------------------------------------
1. Start the backend server:
   cd backend
   node server.js

   (The server will perform an initial health check immediately upon 
   startup and then continue running checks according to CHECK_INTERVAL_MINUTES).

2. Open the frontend:
   Serve the `frontend/` directory using any static file server (e.g., Live Server 
   in VS Code, or http-server) and ensure `config.js` points to your backend 
   endpoints (`http://localhost:3000`).
