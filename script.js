import servicesData from './servicesData.json' with { type: 'json' };
console.log(servicesData);


function renderDashboard(services, totalDays = 30) {
  const dashboard = document.getElementById("status-dashboard");
  dashboard.innerHTML = ""; // Clear existing UI

  services.forEach(service => {
    // 1. Create the card container for this service
    const serviceCard = document.createElement("div");
    serviceCard.className = "status-component";

    // 2. Build the header and bar container markup
    serviceCard.innerHTML = `
      <div class="component-header">
        <span class="component-name">${service.name}</span>
        <span class="component-status status-${service.currentStatus}">
          ${formatStatusText(service.currentStatus)}
        </span>
      </div>
      <div class="status-bar-container" id="bars-${service.id}"></div>
      <div class="status-footer">
        <span>${totalDays} days ago</span>
        <span>Today</span>
      </div>
    `;

    // 3. Append the service card to the main dashboard
    dashboard.appendChild(serviceCard);

    // 4. Fill in the status bars for this specific service
    const barContainer = serviceCard.querySelector(`#bars-${service.id}`);
    renderSingleServiceBars(barContainer, service.history, totalDays);
  });
}

// Helper to render bars into a specific container
function renderSingleServiceBars(container, historyData, totalDays) {
  for (let i = 0; i < totalDays; i++) {
    const bar = document.createElement("div");
    bar.className = "day-bar";

    const dayData = historyData[i] || { status: "operational" };
    bar.classList.add(dayData.status);

    bar.title = `${dayData.date || "Day " + (i + 1)}: ${dayData.status.toUpperCase()}`;
    container.appendChild(bar);
  }
}

// Helper for status text formatting
function formatStatusText(status) {
  switch (status) {
    case "operational": return "Operational";
    case "degraded": return "Partial Outage";
    case "outage": return "Major Outage";
    default: return "Unknown";
  }
}

// Initialize the dashboard
renderDashboard(servicesData, 30);