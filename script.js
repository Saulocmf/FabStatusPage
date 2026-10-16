// import servicesData from './servicesData.json' with { type: 'json' };

const API_URL = "http://localhost:3000/server/status-history";;

async function fetchLiveStatusData() {
  try {
    // 2. Perform a standard GET request to fetch the 30-day history map
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const historyByService = await response.json();
    console.log("Fetched live status data:", historyByService);

    // 3. Transform the raw backend object into the format renderDashboard expects
    const services = Object.keys(historyByService).map(serviceId => {
      const history = historyByService[serviceId];
      
      // Determine current status based on today's latest recorded status
      const latestEntry = history.length ? history[history.length - 1] : null;
      const currentStatus = latestEntry ? latestEntry.status : "operational";

      return {
        id: serviceId,
        // Format service ID into a clean display title (e.g., "api-service" -> "API SERVICE")
        name: serviceId.replace(/-/g, " ").toUpperCase(),
        currentStatus: currentStatus,
        history: history
      };
    });

    // 4. Render the dashboard with live backend data
    renderDashboard(services, 30);

  } catch (error) {
    console.error("Failed to fetch status data:", error);
  }
}


// Global Banner Renderer
function updateGlobalBanner(services) {
  const banner = document.getElementById("global-status-banner");
  const bannerText = document.getElementById("global-status-text");

  const hasMajorOutage = services.some(s => s.currentStatus === "outage");
  const hasPartialOutage = services.some(s => s.currentStatus === "degraded");

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

// Dashboard Renderer
function renderDashboard(services, totalDays = 30) {
  updateGlobalBanner(services);

  const dashboard = document.getElementById("status-dashboard");
  dashboard.innerHTML = ""; 

  services.forEach(service => {
    const serviceCard = document.createElement("div");
    serviceCard.className = "status-component";

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

    dashboard.appendChild(serviceCard);

    const barContainer = serviceCard.querySelector(`#bars-${service.id}`);
    renderSingleServiceBars(barContainer, service.history, totalDays);
  });
}

// Render Bars Helper
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

// Status Formatting Helper
function formatStatusText(status) {
  switch (status) {
    case "operational": return "Operational";
    case "degraded": return "Partial Outage";
    case "outage": return "Major Outage";
    default: return "Unknown";
  }
}

// Initial fetch on page load
fetchLiveStatusData();

// Optional: Poll every 60 seconds to keep live status updated automatically
setInterval(fetchLiveStatusData, 60000);