const cron = require('node-cron');
const db = require('../db/status_db.db');

const SERVICES = [
  { id: 'api-service', url: 'https://app.leila.one/api/status' },
//   { id: 'auth-service', url: 'https://auth.yourdomain.com/health' },
//   { id: 'cdn-service', url: 'https://cdn.yourdomain.com/status' }
];

async function pingService(service) {
  const start = Date.now();
  try {
    const response = await fetch(service.url, { timeout: 5000 });
    const duration = Date.now() - start;
    if (!response.ok) {
      // HTTP error status (4xx, 5xx)
      recordCheck(service.id, 'outage', duration);
      return;
    }

    const data = await response.json();
    const evaluatedStatus = parseHealthStatus(data);

    recordCheck(service.id, evaluatedStatus, duration);
  } catch (err) {
    // Network failure, DNS issue, or request timeout
    const duration = Date.now() - start;
    recordCheck(service.id, 'outage', duration);
  }
}

function parseHealthStatus(data) {
  // 1. If top-level status is not 'healthy', mark as outage or degraded
  if (!data || data.status !== 'healthy') {
    return 'outage';
  }

  // 2. Check individual nested subsystem health checks
  if (data.checks && typeof data.checks === 'object') {
    const checkValues = Object.values(data.checks);
    const unhealthySubsystems = checkValues.filter(c => c.status !== 'healthy');

    // If some (but not all) subsystems fail, consider it degraded performance
    if (unhealthySubsystems.length > 0 && unhealthySubsystems.length < checkValues.length) {
      return 'degraded';
    } 
    // If all subsystems failed despite top-level status
    else if (unhealthySubsystems.length === checkValues.length) {
      return 'outage';
    }
  }

  return 'operational';
}

function recordCheck(serviceId, status, responseTime) {
  db.run(
    `INSERT INTO checks (service_id, status, response_time_ms) VALUES (?, ?, ?)`,
    [serviceId, status, responseTime],
    (err) => {
      if (err) console.error(`Failed to record check for ${serviceId}:`, err.message);
    }
  );
}

function startScheduler() {
  // Runs every 5 minutes: '*/5 * * * *'
  cron.schedule('*/5 * * * *', () => {
    console.log(`[${new Date().toISOString()}] Running automated health check...`);
    SERVICES.forEach(pingService);
  });
}

module.exports = startScheduler;