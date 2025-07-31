const currentUserId = 1; // 👉 thay bằng userId hiện tại

async function fetchHealthRecords() {
  const res = await fetch(
    `http://localhost:8286/api/healthrecords/user/${currentUserId}`
  );
  if (!res.ok) throw new Error("Failed to fetch data");
  return await res.json();
}

function groupByMetric(records) {
  const grouped = {};
  records.forEach((r) => {
    if (!grouped[r.metricId]) {
      grouped[r.metricId] = {
        name: r.metricName,
        unit: r.unit,
        data: [],
      };
    }
    grouped[r.metricId].data.push({
      date: r.logDate,
      value: r.value,
    });
  });
  return grouped;
}

function getPast7DaysLabels() {
  const labels = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    labels.push(d.toISOString().split("T")[0]);
  }
  return labels;
}

function prepareChartData(metricData, labels) {
  const valueMap = {};
  metricData.forEach((entry) => {
    valueMap[entry.date] = entry.value;
  });
  return labels.map((date) => valueMap[date] || null);
}

function getColor(index) {
  const colors = [
    "#4BC0C0",
    "#FF6384",
    "#FFCE56",
    "#36A2EB",
    "#9966FF",
    "#8BC34A",
    "#FF9F40",
  ];
  return colors[index % colors.length];
}

async function renderAllCharts() {
  const container = document.getElementById("chartsContainer");
  container.innerHTML = "";

  try {
    const data = await fetchHealthRecords();
    const userRecords = data.filter((r) => r.userId === currentUserId);
    const labels = getPast7DaysLabels();
    const grouped = groupByMetric(userRecords);

    let index = 0;
    for (const metricId in grouped) {
      const { name, unit, data } = grouped[metricId];
      const chartData = prepareChartData(data, labels);

      const chartWrapper = document.createElement("div");
      chartWrapper.classList.add("canvas-container");

      const title = document.createElement("h5");
      title.textContent = `${name} (${unit})`;
      chartWrapper.appendChild(title);

      const canvas = document.createElement("canvas");
      chartWrapper.appendChild(canvas);
      container.appendChild(chartWrapper);

      const ctx = canvas.getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: labels.map((d) => `Day ${labels.indexOf(d) + 1}`),
          datasets: [
            {
              label: `${name} (${unit})`,
              data: chartData,
              backgroundColor: getColor(index),
              borderColor: getColor(index),
              fill: false,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: false },
          },
        },
      });

      index++;
    }
  } catch (err) {
    console.error("Chart render error:", err);
    container.innerHTML = `<p class="error">Failed to load health charts.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderAllCharts();
});
