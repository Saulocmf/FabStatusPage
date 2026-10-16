const express = require('express');
const cors = require('cors');
const db = require('./db');
const startScheduler = require('./scheduler');

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/status-history - Super fast read directly from daily_summaries
app.get('/api/status-history', (req, res) => {
  const query = `
    SELECT service_id, date, worst_status AS status
    FROM daily_summaries
    WHERE date >= DATE('now', '-30 days')
    ORDER BY date ASC
  `;

  db.all(query, [], (err, rows) => {
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

startScheduler();
app.listen(3000, () => console.log('Status server running on http://localhost:3000'));