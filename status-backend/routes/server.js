var express = require('express');
const db = require('../db.js');
var router = express.Router();
const startScheduler = require('../scheduler');
const { getLocalDateString } = require('../utils/dateHelper');
// const cors = require('cors');

// GET /api/status-history - Super fast read directly from daily_summaries
router.get('/status-history', (req, res) => {
  const timeZone = process.env.APP_TIMEZONE || 'UTC';
  // 1. Calculate the local date 30 days ago
  const d = new Date();
  d.setDate(d.getDate() - 30);
  const thirtyDaysAgoStr = getLocalDateString(d, timeZone);

  // 2. Pass the computed string into the query parameter
  const query = `
    SELECT service_id, date, worst_status AS status
    FROM daily_summaries
    WHERE date >= ?
    ORDER BY date ASC
  `;

  db.all(query, [thirtyDaysAgoStr], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Format output grouped by service
    const formattedData = {};
    rows.forEach(row => {
      if (!formattedData[row.service_id]) {
        formattedData[row.service_id] = [];
      }
      formattedData[row.service_id].push({
        date: row.date,
        status: row.status
      });
    });

    res.json(formattedData);
  });
});


// GET /api/status-live - Fetches the most recent ping status from the 'checks' table
router.get('/status-live', (req, res) => {
  const query = `
    SELECT c.service_id, c.status, c.response_time_ms, c.timestamp
    FROM checks c
    INNER JOIN (
      SELECT service_id, MAX(timestamp) AS max_time
      FROM checks
      GROUP BY service_id
    ) latest ON c.service_id = latest.service_id AND c.timestamp = latest.max_time
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Format output as an object keyed by service_id
    const liveStatusData = {};
    rows.forEach(row => {
      liveStatusData[row.service_id] = {
        status: row.status,
        response_time_ms: row.response_time_ms,
        timestamp: row.timestamp
      };
    });

    res.json(liveStatusData);
  });
});

startScheduler();

module.exports = router;