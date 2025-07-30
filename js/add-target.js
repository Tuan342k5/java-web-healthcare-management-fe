document.addEventListener("DOMContentLoaded", function () {
  loadMetricTypesFromAPI();

  const goalForm = document.getElementById("goalForm");
  const metricSelect = document.getElementById("goalMetricType");

  goalForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const userId = parseInt(localStorage.getItem("userId"));
    if (!userId || isNaN(userId)) {
      alert("UserId not found! Have you logged in?");
      return;
    }

    const metricKey = metricSelect.value.toLowerCase().replace(/\s+/g, "");
    const metricId = metricTypesMap[metricKey];

    console.log("🔍 Chọn metric:", metricSelect.value);
    console.log("🔑 metricKey:", metricKey);
    console.log("🆔 Tìm thấy metricId:", metricId);

    if (!metricId) {
      alert(`Cannot found metricId for metric "${metricSelect.value}"`);
      console.warn(" metricTypesMap: ", metricTypesMap);
      return;
    }

    const comparison = document.getElementById("comparisonType").value;
    const stats = document.getElementById("statisticsType").value;
    const targetDate = document.getElementById("targetDate").value;
    const notes = document.getElementById("goalNotes").value;

    let targetValue = null;

    if (metricKey === "bloodpressure") {
      const sys = parseInt(document.getElementById("goalSystolic").value);
      const dia = parseInt(document.getElementById("goalDiastolic").value);
      if (!isNaN(sys) && !isNaN(dia)) {
        targetValue = `${sys}/${dia}`;
      } else {
        alert("Vui lòng nhập chỉ số huyết áp hợp lệ.");
        return;
      }
    } else if (comparison === "range") {
      const min = parseFloat(document.getElementById("rangeMin").value);
      const max = parseFloat(document.getElementById("rangeMax").value);
      if (!isNaN(min) && !isNaN(max)) {
        targetValue = `${min} - ${max}`;
      } else {
        alert("Vui lòng nhập khoảng giá trị hợp lệ.");
        return;
      }
    } else {
      const value = parseFloat(document.getElementById("goalValue").value);
      if (!isNaN(value)) {
        targetValue = Math.round(value); // kiểu Long
      } else {
        alert("❗ Vui lòng nhập giá trị mục tiêu hợp lệ.");
        return;
      }
    }

    const payload = {
      userId: userId,
      title: notes || `${metricKey} goal`,
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      endDate: targetDate,
      details: [
        {
          comparisonType: comparison,
          targetValue: targetValue,
          aggregationType: stats,
          metricId: parseInt(metricId),
        },
      ],
    };

    console.log("📦 Payload gửi backend:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetch("http://localhost:8286/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");
      let responseData;

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      console.log("📬 Phản hồi từ server:", response.status, responseData);

      if (!response.ok) {
        alert(
          `❌ Gửi thất bại (${response.status}) - Xem console để biết thêm.`
        );
      } else {
        alert("🎯 Mục tiêu đã được tạo thành công!");
        goalForm.reset();
      }
    } catch (error) {
      console.error("🚨 Lỗi kết nối:", error);
      alert("⚠️ Không thể kết nối đến máy chủ. Kiểm tra network.");
    }
  });
});

let metricTypesMap = {};

function loadMetricTypesFromAPI() {
  fetch("http://localhost:8286/api/metrics")
    .then((res) => res.json())
    .then((data) => {
      const dropdown = document.getElementById("goalMetricType");
      dropdown.innerHTML = "";

      metricTypesMap = {};

      data.forEach((metric) => {
        const key = metric.name.toLowerCase().replace(/\s+/g, "");
        metricTypesMap[key] = metric.metricId;

        const option = document.createElement("option");
        option.value = key;
        option.textContent = metric.name;
        dropdown.appendChild(option);
      });

      console.log("metricTypesMap loaded:", metricTypesMap);
    })
    .catch((err) => {
      console.error("Không tải được metric-types:", err);
    });
  document
    .getElementById("goalMetricType")
    .addEventListener("change", function () {
      const selectedKey = this.value;

      const goalValueGroup = document.getElementById("goalValueGroup");
      const goalBPGroup = document.getElementById("goalBloodPressureGroup");

      if (selectedKey === "bloodpressure") {
        goalValueGroup.style.display = "none";
        goalBPGroup.style.display = "block";
      } else {
        goalValueGroup.style.display = "block";
        goalBPGroup.style.display = "none";
      }
    });
}
