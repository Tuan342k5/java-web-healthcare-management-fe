document.addEventListener("DOMContentLoaded", async function () {
  const userId = localStorage.getItem("userId");
  const goalList = document.getElementById("goalList");

  if (!userId) {
    goalList.innerHTML = "<p class='text-danger'>User not logged in.</p>";
    return;
  }

  console.log("Fetching goals for userId:", userId);

  try {
    const response = await fetch(
      `http://localhost:8286/api/targets/user/${userId}`
    );
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
          <h5 class="card-title">${target.title || "Untitled Goal"}</h5>
          <p class="card-text">
            <strong>Target:</strong> ${
              target.details &&
              target.details[0] &&
              target.details[0].targetValue
                ? target.details[0].targetValue
                : "N/A"
            }
            <br>
            <strong>Status:</strong> ${target.status} <br>
            <strong>Start Date:</strong> ${target.startDate} <br>
            <strong>End Date:</strong> ${target.endDate}
          </p>
          <button class="btn btn-sm btn-outline-primary edit-btn">
          <i class="fas fa-edit me-1"></i>Edit</button>
          <button class="btn btn-sm btn-outline-danger delete-btn">
          <i class="fas fa-trash me-1"></i>Delete</button>
        </div>
      `;

      // Handle Edit
      card.querySelector(".edit-btn").addEventListener("click", () => {
        localStorage.setItem("editTarget", JSON.stringify(target));
        window.location.href = "add-target.html";
      });

      // Handle Delete
      card.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this target?")) {
          try {
            const res = await fetch(
              `http://localhost:8286/api/targets/${target.targetId}`,
              {
                method: "DELETE",
              }
            );
            if (!res.ok) throw new Error("Failed to delete");

            card.remove(); // Remove card from UI
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
