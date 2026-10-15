import servicesData from './servicesData.json' with { type: 'json' };
// console.log(servicesData);
const API_URL = "https://app.leila.one/api/status";

async function fetchLiveStatusData() {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/html" },
      // body: new URLSearchParams({
      //   format: "json",
      //   custom_uptime_ratios: "30", // Get 30-day uptime ratio
      //   response_times: "1"        // Get recent response logs
      // })
    });

    const data = await response.json();
    console.log("Fetched live status data:", data);
  
  } catch (error) {
    console.error("Failed to fetch status data:", error);
    return null;
  }
}

// setInterval(fetchLiveStatusData, 1000);

function updateGlobalBanner(services) {
  const banner = document.getElementById("global-status-banner");
  const bannerText = document.getElementById("global-status-text");

  // Check if any service has an outage or degraded performance
  const hasMajorOutage = services.some(s => s.currentStatus === "outage");
  const hasPartialOutage = services.some(s => s.currentStatus === "degraded");

  // Reset classes
  banner.className = "global-banner";

  if (hasMajorOutage) {
    banner.classList.add("banner-outage");
    bannerText.textContent = "Major System Outage";
  } else if (hasPartialOutage) {
    banner.classList.add("banner-degraded");
    bannerText.textContent = "Active System Disruption";
  } else {
    banner.classList.add("banner-operational");
    bannerText.textContent = "All Systems Operational";
  }
}

function renderDashboard(services, totalDays = 30) {
  updateGlobalBanner(services)

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

