const cron = require('node-cron');
const db = require('./db');

// Read minutes from .env, default to 5 if missing
const intervalMinutes = process.env.CHECK_INTERVAL_MINUTES || 5;
const cronSchedule = `*/${intervalMinutes} * * * *`;

// const SERVICES = JSON.parse(process.env.SERVICES_CONFIG);
let SERVICES = [];
try {
  if (process.env.SERVICES_CONFIG) {
    SERVICES = JSON.parse(process.env.SERVICES_CONFIG);
  }
} catch (error) {
  console.error("❌ Failed to parse SERVICES_CONFIG from .env file. Check your JSON syntax:", error.message);
}
console.log("Loaded services:", SERVICES);

async function pingService(service) {
  const start = Date.now();
  try {
    const response = await fetch(service.url, { timeout: 5000 });
    const duration = Date.now() - start;

    const data = await response.json();
    // console.log(`[${new Date().toISOString()}] Response from ${service.id}:`, data);

    // Adjust logic to map the status coming from the API
    let mappedStatus = "unknown";
    if (response.ok && data.status === 'healthy') {
      mappedStatus = 'operational';
    } else if (data.status === 'degraded') {
      mappedStatus = 'degraded';
    } else if (data.status === 'unhealthy') {
      mappedStatus = 'outage';
    }

    db.run(
      `INSERT INTO checks (service_id, status, response_time_ms) VALUES (?, ?, ?)`,
      [service.id, mappedStatus, duration]
    );

  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error pinging ${service.id}:`, err.message);

    db.run(
      `INSERT INTO checks (service_id, status, response_time_ms) VALUES (?, ?, ?)`,
      [service.id, 'outage', 0]
    );
  }
  // 2. Update daily_summaries table for today
  updateDailySummary(service.id);
}

function updateDailySummary(serviceId) {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  // Calculate today's worst status and save to daily_summaries
  const rollupQuery = `
    INSERT INTO daily_summaries (service_id, date, worst_status)
    VALUES (
      ?, 
      ?, 
      (
        SELECT 
          CASE 
            WHEN SUM(CASE WHEN status = 'outage' THEN 1 ELSE 0 END) > 0 THEN 'outage'
            WHEN SUM(CASE WHEN status = 'degraded' THEN 1 ELSE 0 END) > 0 THEN 'degraded'
            ELSE 'operational'
          END
        FROM checks 
        WHERE service_id = ? AND DATE(timestamp) = ?
      )
    )
    ON CONFLICT(service_id, date) DO UPDATE SET
      worst_status = excluded.worst_status;
  `;

  db.run(rollupQuery, [serviceId, today, serviceId, today]);
}

function startScheduler() {
  // Runs every ${intervalMinutes} minutes: `${cronSchedule}`
  cron.schedule(cronSchedule, () => {
    console.log(`\n--- Health Check Triggered [${new Date().toISOString()}] ---`);
    SERVICES.forEach(pingService);
  });
}

// Call once immediately on startup to avoid waiting for the first cron tick
pingService(SERVICES[0]);

module.exports = startScheduler;