document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("jwtToken");
  const goalList = document.getElementById("goalList");

  if (!token) {
    goalList.innerHTML = "<p class='text-danger'>User not logged in.</p>";
    return;
  }

  // 👇 Decode JWT to extract userId
  function getUserIdFromToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (err) {
      console.error("Failed to parse token", err);
      return null;
    }
  }

  const userId = getUserIdFromToken(token);

  if (!userId) {
    goalList.innerHTML = "<p class='text-danger'>Invalid token or user ID.</p>";
    return;
  }

  console.log("Fetching goals for userId:", userId);

  try {
    const response = await fetch(`http://localhost:8286/api/targets/user/${userId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch goals");

    const targets = await response.json();

    if (targets.length === 0) {
      goalList.innerHTML = "<p class='text-muted'>You have no targets set.</p>";
      return;
    }

    // Render each target as a card
    targets.forEach((target) => {
      const card = document.createElement("div");
      card.className = "card mb-3";

      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title" style="color: red;">${target.title || "Untitled Goal"}</h5>
          <p class="card-text">
            <strong>Target:</strong> ${
              target.details?.[0]?.targetValue ?? "N/A"
            }
            <br>
            <strong>Status:</strong> ${target.status} <br>
            <strong>Start Date:</strong> ${target.startDate} <br>
            <strong>End Date:</strong> ${target.endDate}
          </p>
          <button class="btn btn-sm btn-outline-primary edit-btn">
            <i class="fas fa-edit me-1"></i>Edit
          </button>
          <button class="btn btn-sm btn-outline-danger delete-btn">
            <i class="fas fa-trash me-1"></i>Delete
          </button>
        </div>
      `;

      // Edit button logic
      card.querySelector(".edit-btn").addEventListener("click", () => {
        localStorage.setItem("editTarget", JSON.stringify(target));
        window.location.href = "edit-target.html";
      });

      // Delete button logic
      card.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this target?")) {
          try {
            const res = await fetch(
              `http://localhost:8286/api/targets/${target.targetId}`,
              {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${token}`,
                },
              }
            );
            if (!res.ok) throw new Error("Failed to delete");

            card.remove(); // Remove from UI
          } catch (err) {
            alert("❌ Failed to delete target.");
            console.error(err);
          }
        }
      });

      goalList.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    goalList.innerHTML =
      "<p class='text-danger'>❌ Failed to load goals. Please try again later.</p>";
  }
});
