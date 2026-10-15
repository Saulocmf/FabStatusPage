// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../db/status_db.db');

db.serialize(() => {
    // Table for raw health check pings
    db.run(`
        CREATE TABLE IF NOT EXISTS checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_id TEXT NOT NULL,
            status TEXT NOT NULL, -- 'operational', 'degraded', 'outage'
            response_time_ms INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            `);
});

module.exports = db;