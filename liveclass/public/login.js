document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const role = document.getElementById("role").value.trim().toLowerCase();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!role || !email || !password) {
    alert("Please fill all fields.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Invalid email or password.");
      return;
    }

    // ✅ Store user data consistently
    localStorage.setItem("userEmail", data.user.email);
    localStorage.setItem("userRole", data.user.role);
    localStorage.setItem("userName", data.user.fullname);

    // ✅ Redirect correctly by role
    if (data.user.role === "student") {
      alert("Login successful! Redirecting to student dashboard...");
      window.location.href = "student.html";
    } else if (data.user.role === "teacher") {
      alert("Login successful! Redirecting to teacher dashboard...");
      window.location.href = "teacher.html";
    } else {
      alert("Unknown role. Please contact admin.");
    }
  } catch (error) {
    console.error("❌ Login error:", error);
    alert("Something went wrong. Please try again.");
  }
});
