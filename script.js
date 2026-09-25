// Simulated health data for the past 30 days
const mockHistory = [
  { date: "2026-09-01", status: "operational" },
  { date: "2026-09-02", status: "operational" },
  { date: "2026-09-03", status: "degraded" },   // Partial incident
  { date: "2026-09-04", status: "operational" },
  { date: "2026-09-05", status: "outage" },     // Major outage
  // ... fill out or fetch dynamically
];


// Fallback to operational if no specific incident data exists
function renderStatusBars(containerId, historyData, totalDays = 30) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  for (let i = 0; i < totalDays; i++) {
    const bar = document.createElement("div");
    bar.className = "day-bar";

    const dayData = historyData[i] || { status: "operational" };
    bar.classList.add(dayData.status);

    // Add tooltip on hover
    bar.title = `${dayData.date || "Day " + (i + 1)}: ${dayData.status.toUpperCase()}`;

    container.appendChild(bar);
  }
}

// Initialize on page load
renderStatusBars("api-status-bars", mockHistory, 30);
