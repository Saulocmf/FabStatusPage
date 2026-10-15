const cron = require('node-cron');
const db = require('./db');

const SERVICES = [
  { id: 'status-service', url: 'https://app.leila.one/api/status' },
//   { id: 'auth-service', url: 'https://auth.yourdomain.com/health' },
//   { id: 'cdn-service', url: 'https://cdn.yourdomain.com/status' }
];

async function pingService(service) {
  const start = Date.now();
  try {
    const response = await fetch(service.url, { timeout: 5000 });
    const duration = Date.now() - start;

    const data = await response.json();

    console.log(`[${new Date().toISOString()}] Response from ${service.id}:`, data);

    // Adjust logic if "healthy" is the only operational state
    let mappedStatus = 'degraded';
    if (response.ok && data.status === 'healthy') {
      mappedStatus = 'operational';
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
}

function startScheduler() {
  // Runs every 5 minutes: '*/5 * * * *'
  cron.schedule('*/5 * * * *', () => {
    console.log(`\n--- Health Check Triggered [${new Date().toISOString()}] ---`);
    SERVICES.forEach(pingService);
  });
}

// Call once immediately on startup to avoid waiting for the first cron tick
pingService(SERVICES[0]);

module.exports = startScheduler;