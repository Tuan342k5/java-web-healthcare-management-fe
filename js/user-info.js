// user-info.js

export async function loadCurrentUserData(token) {
  const userNameEl = document.getElementById("current-user-name");
  const userPhoneEl = document.getElementById("user-phone");
  const userEmailEl = document.getElementById("user-email");

  if (!token) {
    userNameEl.textContent = "Guest";
    userPhoneEl.textContent = "N/A";
    userEmailEl.textContent = "N/A";
    return;
  }

  try {
    const res = await fetch('http://127.0.0.1:8286/api/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch user data');
    }

    const user = await res.json();

    userNameEl.textContent = user.fullName || "User";
    userPhoneEl.textContent = user.phoneNumber || "Chưa có SĐT";
    userEmailEl.textContent = user.email || "Chưa có email";
  } catch (err) {
    console.error("Error loading user data:", err);
    userNameEl.textContent = "Error";
    userPhoneEl.textContent = "Error";
    userEmailEl.textContent = "Error";
  }
}
