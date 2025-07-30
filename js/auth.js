// js/login-script.js

document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const username = localStorage.getItem("loggedInUser");

    if (isLoggedIn === "true" && username) {
      const nameSpan = document.getElementById("current-user-name");
      if (nameSpan) {
        nameSpan.textContent = username;
      }

      const helloHeading = document.querySelector("header h2");
      if (helloHeading) {
        helloHeading.textContent = `Hello, ${username}!`;
      }
    } else {
      window.location.href = "login.html";
    }
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const BASE_URL = 'http://localhost:8286/api/auth'; // Đảm bảo đây là URL backend của bạn

    // --- Xử lý Đăng nhập ---
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch(`${BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password }) // Gửi email và password
                });

                if (!response.ok) {
                    const errorData = await response.json(); // Backend có thể trả về thông báo lỗi JSON
                    throw new Error(errorData.message || 'Đăng nhập không thành công.');
                }

                const loginResponse = await response.json(); // Nhận LoginResponse từ backend
                console.log('Login successful:', loginResponse);

                // Lưu trạng thái đăng nhập và vai trò/tên người dùng
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('current-user-name', loginResponse.user.username); // Lưu username từ phản hồi
                localStorage.setItem('userRole', loginResponse.user.role); // Lưu vai trò của người dùng
                localStorage.setItem("userId", loginResponse.user.userId); // lưu id người dùng

                alert(loginResponse.message || 'Đăng nhập thành công!');

                // Chuyển hướng dựa trên vai trò
                if (loginResponse.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'main-page.html'; // Hoặc trang chủ của người dùng thường
                }

            } catch (error) {
                console.error('Lỗi đăng nhập:', error);
                alert(`Lỗi đăng nhập: ${error.message}. Vui lòng kiểm tra lại email và mật khẩu.`);
            }
        });
    }

    // --- Xử lý Đăng ký ---
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;

            if (password !== confirmPassword) {
                alert('Mật khẩu xác nhận không khớp!');
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    // Gửi dữ liệu đăng ký
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password,
                        role: "user" // Mặc định là 'user' khi đăng ký từ frontend
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json(); // Backend có thể trả về thông báo lỗi JSON
                    throw new Error(errorData.message || 'Đăng ký không thành công.');
                }

                const newUser = await response.json(); // Nhận User object đã đăng ký
                console.log('Registered user:', newUser);

                alert('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
                window.location.href = 'login.html'; // Chuyển hướng về trang đăng nhập

            } catch (error) {
                console.error('Lỗi đăng ký:', error);
                alert(`Lỗi đăng ký: ${error.message}. Vui lòng thử lại.`);
            }
        });
    }
});