document.addEventListener("DOMContentLoaded", function () {
  loadMetricTypesFromAPI();

  const goalForm = document.getElementById("goalForm");
  const metricSelect = document.getElementById("goalMetricType");
  const editTarget = JSON.parse(localStorage.getItem("editTarget"));
  const userId = parseInt(localStorage.getItem("userId"));

  if (!userId || isNaN(userId)) {
    alert("UserId not found! Have you logged in?");
    return;
  }

  // Nếu đang chỉnh sửa mục tiêu → nạp lại dữ liệu vào form
  if (editTarget) {
    document.getElementById("goalNotes").value = editTarget.title || "";
    document.getElementById("targetDate").value = editTarget.endDate || "";

    const detail = editTarget.details?.[0];
    const metricId = detail?.metricId;
    const comparisonType = detail?.comparisonType;
    const aggregationType = detail?.aggregationType;
    const targetValue = detail?.targetValue;

    document.getElementById("comparisonType").value = comparisonType || "equal";
    document.getElementById("statisticsType").value =
      aggregationType || "latest";

    // Đợi metricTypesMap load xong rồi chọn đúng option
    const interval = setInterval(() => {
      if (Object.keys(metricTypesMap).length > 0) {
        const metricEntry = Object.entries(metricTypesMap).find(
          ([k, v]) => v === metricId
        );
        if (metricEntry) {
          document.getElementById("goalMetricType").value = metricEntry[0];
          triggerMetricChange(metricEntry[0]);

          // Gán giá trị theo từng kiểu
          if (
            metricEntry[0] === "bloodpressure" &&
            typeof targetValue === "string"
          ) {
            const [sys, dia] = targetValue.split("/").map((v) => parseInt(v));
            document.getElementById("goalSystolic").value = sys || "";
            document.getElementById("goalDiastolic").value = dia || "";
          } else if (
            comparisonType === "range" &&
            typeof targetValue === "string"
          ) {
            const [min, max] = targetValue.split("-").map((v) => parseFloat(v));
            document.getElementById("rangeMin").value = min || "";
            document.getElementById("rangeMax").value = max || "";
          } else {
            document.getElementById("goalValue").value = targetValue;
          }
        }
        clearInterval(interval);
      }
    }, 100);

    // Cập nhật tiêu đề
    const titleEl = document.getElementById("formTitle");
    if (titleEl) titleEl.textContent = "✏️ Chỉnh sửa mục tiêu";
  }

  // Xử lý SUBMIT FORM
  goalForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const metricKey = metricSelect.value.toLowerCase().replace(/\s+/g, "");
    const metricId = metricTypesMap[metricKey];

    if (!metricId) {
      alert(`Không tìm thấy metricId cho metric "${metricSelect.value}"`);
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
        targetValue = Math.round(value);
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
      let response;
      if (editTarget) {
        response = await fetch(
          `http://localhost:8286/api/targets/${editTarget.targetId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        localStorage.removeItem("editTarget");
      } else {
        response = await fetch("http://localhost:8286/api/targets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const contentType = response.headers.get("content-type");
      const responseData = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      console.log("📬 Phản hồi từ server:", response.status, responseData);

      if (!response.ok) {
        alert(
          `❌ Gửi thất bại (${response.status}) - Xem console để biết thêm.`
        );
      } else {
        alert(
          editTarget
            ? "✅ Đã cập nhật mục tiêu thành công!"
            : "🎯 Mục tiêu đã được tạo thành công!"
        );
        window.location.href = "my-targets.html";
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

      console.log("✅ metricTypesMap loaded:", metricTypesMap);
    })
    .catch((err) => {
      console.error("Không tải được metric-types:", err);
    });

  document
    .getElementById("goalMetricType")
    .addEventListener("change", function () {
      triggerMetricChange(this.value);
    });
}

function triggerMetricChange(selectedKey) {
  const goalValueGroup = document.getElementById("goalValueGroup");
  const goalBPGroup = document.getElementById("goalBloodPressureGroup");

  if (selectedKey === "bloodpressure") {
    goalValueGroup.style.display = "none";
    goalBPGroup.style.display = "block";
  } else {
    goalValueGroup.style.display = "block";
    goalBPGroup.style.display = "none";
  }
}
