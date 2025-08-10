// ✅ Hàm giải mã JWT để lấy userId
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = decodeURIComponent(atob(base64Url).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(base64);
  } catch (e) {
    console.error("Token decode error:", e);
    return null;
  }
}

// ✅ Gọi API với userId từ token
async function fetchHealthRecords() {
  const token = localStorage.getItem("jwtToken");
  if (!token) throw new Error("JWT token not found");

  const decoded = parseJwt(token);
  const userId = decoded?.userId;

  if (!userId) throw new Error("User ID not found in token");

  const res = await fetch(`http://localhost:8286/api/healthrecords/user/${userId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) throw new Error("Failed to fetch data");
  return await res.json();
}

// ✅ Nhóm dữ liệu theo metric
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
      value: parseFloat(r.value),
    });
  });
  return grouped;
}

// ✅ Tạo mảng 7 ngày trong tuần dựa trên ngày được chọn
function getWeekLabels(selectedDateStr) {
  const selectedDate = new Date(selectedDateStr);
  const dayOfWeek = selectedDate.getDay(); // 0 = CN
  const start = new Date(selectedDate);
  start.setDate(selectedDate.getDate() - dayOfWeek);

  const labels = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    labels.push(d.toISOString().split("T")[0]);
  }
  return labels;
}

// ✅ Lấy khoảng tuần (format dd/MM/yyyy)
function getWeekRange(selectedDateStr) {
  const selectedDate = new Date(selectedDateStr);
  const dayOfWeek = selectedDate.getDay();
  const start = new Date(selectedDate);
  start.setDate(selectedDate.getDate() - dayOfWeek);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const formatDate = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  return `${formatDate(start)} - ${formatDate(end)}`;
}

// ✅ Chuẩn hóa dữ liệu theo labels (ngày trong tuần)
function prepareChartData(metricData, labels) {
  const valueMap = {};
  metricData.forEach((entry) => {
    valueMap[entry.date] = entry.value;
  });
  return labels.map((date) => valueMap[date] || null);
}

// ✅ Màu sắc cho các biểu đồ
function getColor(index) {
  const colors = ["#4BC0C0", "#FF6384", "#FFCE56", "#36A2EB", "#9966FF", "#8BC34A", "#FF9F40"];
  return colors[index % colors.length];
}

// ✅ Vẽ toàn bộ biểu đồ theo tuần
async function renderAllCharts(selectedDateStr) {
  const container = document.getElementById("chartsContainer");
  container.innerHTML = "";

  // 📅 Hiển thị khoảng tuần
  const weekRangeElem = document.getElementById("weekRange");
  if (weekRangeElem) {
    weekRangeElem.textContent = `Tuần: ${getWeekRange(selectedDateStr)}`;
  }

  try {
    const records = await fetchHealthRecords();
    console.log("📥 Raw records:", records);

    const labels = getWeekLabels(selectedDateStr);
    console.log("📅 Week labels:", labels);

    const grouped = groupByMetric(records);
    console.log("📊 Grouped by metric:", grouped);

    let index = 0;
    for (const metricId in grouped) {
      const { name, unit, data } = grouped[metricId];
      const chartData = prepareChartData(data, labels);

      console.log(`📈 Metric ${name} (${unit}) - Raw data:`, data);
      console.log(`🔢 Chart data (${name}):`, chartData);

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
          labels: labels,
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
    container.innerHTML = `<p class="error">⚠️ Failed to load health charts.</p>`;
  }
}

// ✅ Khởi động khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("selectedDate").value = today;
  renderAllCharts(today);

  document.getElementById("selectedDate").addEventListener("change", (e) => {
    renderAllCharts(e.target.value);
  });
});
