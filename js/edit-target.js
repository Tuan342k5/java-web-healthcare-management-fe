document.addEventListener("DOMContentLoaded", function () {
  const goalForm = document.getElementById("goalForm");
  const metricSelect = document.getElementById("metricId");
  const jwtToken = localStorage.getItem("jwtToken");

  const editTarget = localStorage.getItem("editTarget");
  if (!editTarget) {
    alert("❌ Không có dữ liệu mục tiêu để chỉnh sửa.");
    return;
  }
  const targetData = JSON.parse(editTarget);

  if (!jwtToken) {
    alert("❌ Chưa đăng nhập!");
    return;
  }

  // ✅ Hàm giải mã JWT token để lấy userId
  function parseJwt(token) {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = decodeURIComponent(
      atob(base64Url)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(base64);
  }

  // ✅ Giải mã token để lấy userId
  const decodedToken = parseJwt(jwtToken);
  const currentUserId = decodedToken?.userId || decodedToken?.sub;

  function loadMetricTypesAndData() {
    fetch("http://localhost:8286/api/metrics", {
      headers: { "Authorization": "Bearer " + jwtToken }
    })
      .then(res => res.json())
      .then(metrics => {
        metricSelect.innerHTML = '<option value="">Select Metric</option>';
        metrics.forEach(metric => {
          const option = document.createElement("option");
          option.value = metric.metricId;
          option.textContent = metric.name;
          metricSelect.appendChild(option);
        });

        // Populate form fields
        const d = targetData.details[0];
        goalForm.title.value = targetData.title;
        goalForm.status.value = targetData.status;
        goalForm.startDate.value = targetData.startDate;
        goalForm.endDate.value = targetData.endDate;
        goalForm.metricId.value = d.metricId;
        goalForm.comparisonType.value = d.comparisonType;
        goalForm.aggregationType.value = d.aggregationType;
        goalForm.targetValue.value = d.targetValue;
      });
  }

  goalForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const payload = {
      targetId: targetData.targetId,
      title: goalForm.title.value,
      status: goalForm.status.value,
      startDate: goalForm.startDate.value,
      endDate: goalForm.endDate.value,
      userId: currentUserId, // ✅ Lấy userId từ token thay vì localStorage
      details: [{
        tdetailId: targetData.details[0].tdetailId,
        metricId: parseInt(goalForm.metricId.value),
        comparisonType: goalForm.comparisonType.value,
        aggregationType: goalForm.aggregationType.value,
        targetValue: parseFloat(goalForm.targetValue.value)
      }]
    };

    try {
      const res = await fetch(`http://localhost:8286/api/targets/targets/${targetData.targetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + jwtToken
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("✅ Cập nhật mục tiêu thành công!");
        window.location.href = "my-targets.html";
      } else {
        let errorMessage = "Đã xảy ra lỗi.";
        try {
          const text = await res.text();
          const data = text ? JSON.parse(text) : null;
          if (data?.message) {
            errorMessage = data.message;
          }
        } catch (err) {
          console.warn("Không thể phân tích lỗi JSON:", err);
        }
        alert(`❌ Lỗi cập nhật: ${errorMessage}`);
      }
    } catch (err) {
      console.error("Lỗi kết nối:", err);
    }
  });

  loadMetricTypesAndData();
});
