document.addEventListener("DOMContentLoaded", function () {
  loadMetricTypesFromAPI();

  const goalForm = document.getElementById("goalForm");
  const metricSelect = document.getElementById("metricId");

  const jwtToken = localStorage.getItem("jwtToken");
  if (!jwtToken) {
    alert("❌ Chưa đăng nhập! Không tìm thấy JWT.");
    return;
  }

  let userId;
  try {
    const decoded = JSON.parse(atob(jwtToken.split('.')[1]));
    userId = decoded.userId || decoded.sub;
    if (!userId) throw new Error("JWT không chứa userId");
  } catch (err) {
    alert("⚠️ JWT Token không hợp lệ hoặc không chứa userId.");
    return;
  }
  // Load metric types để hiển thị trong dropdown
function loadMetricTypesFromAPI() {
  const jwtToken = localStorage.getItem("jwtToken");
  if (!jwtToken) {
    alert("❌ Chưa đăng nhập hoặc thiếu JWT Token!");
    return;
  }

  fetch("http://localhost:8286/api/metrics", {
    headers: {
      "Authorization": "Bearer " + jwtToken
    }
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const dropdown = document.getElementById("metricId");
      dropdown.innerHTML = '<option value="">Select Metric</option>';
      data.forEach(metric => {
        const option = document.createElement("option");
        option.value = metric.metricId;
        option.textContent = metric.name;
        dropdown.appendChild(option);
      });
    })
    .catch(err => {
      console.error("Không tải được metric types:", err);
      alert("❌ Lỗi tải danh sách Metric.");
    });
}

  goalForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const status = document.getElementById("status").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const metricId = parseInt(document.getElementById("metricId").value);
    const comparisonType = document.getElementById("comparisonType").value;
    const aggregationType = document.getElementById("aggregationType").value;
    const valueInput = document.getElementById("targetValue");

    let targetValue = parseFloat(valueInput.value);
    if (isNaN(targetValue)) {
      alert("❗ Vui lòng nhập giá trị mục tiêu hợp lệ.");
      return;
    }

    const payload = {
      targetId: 0,
      title: title,
      status: status,
      startDate: startDate,
      endDate: endDate,
      userId: userId,
      details: [
        {
          tdetailId: 0,
          metricId: metricId,
          comparisonType: comparisonType,
          targetValue: targetValue,
          aggregationType: aggregationType
        }
      ]
    };

    console.log("📤 Gửi payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetch("http://localhost:8286/api/targets/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + jwtToken
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      console.log("📥 Phản hồi:", response.status, responseData);

      if (response.ok) {
        alert("🎯 Mục tiêu đã được tạo thành công!");
        window.location.href = "my-targets.html";
      } else {
        alert(`❌ Tạo thất bại (${response.status}) - ${responseData.message || 'Xem console để biết thêm.'}`);
      }
    } catch (error) {
      console.error("🚨 Lỗi kết nối:", error);
      alert("⚠️ Không thể kết nối đến máy chủ.");
    }
  });
});


