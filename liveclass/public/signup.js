
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const fullnameEl = document.getElementById("fullname");
  const emailEl = document.getElementById("email");
  const pwdEl = document.getElementById("password");
  const roleEl = document.getElementById("role");

  let status = document.getElementById("signupStatus");
  if (!status) {
    status = document.createElement("div");
    status.id = "signupStatus";
    status.style.marginTop = "12px";
    form.parentNode.insertBefore(status, form.nextSibling);
  }

  const bar = document.querySelector("#pwdStrength .bar");
  const criteriaItems = {
    len: document.querySelector('#pwdStrength .criteria li[data-crit="len"]'),
    upper: document.querySelector('#pwdStrength .criteria li[data-crit="upper"]'),
    lower: document.querySelector('#pwdStrength .criteria li[data-crit="lower"]'),
    digit: document.querySelector('#pwdStrength .criteria li[data-crit="digit"]'),
    symbol: document.querySelector('#pwdStrength .criteria li[data-crit="symbol"]')
  };

  function evaluatePassword(pwd) {
    const result = {
      len: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      digit: /\d/.test(pwd),
      symbol: /[@$#&!]/.test(pwd)
    };
    const score = Object.values(result).reduce((a, ok) => a + (ok ? 20 : 0), 0);
    return { result, score };
  }

  function updateStrengthUI(score, result) {
    if (bar) {
      bar.style.setProperty("--strength-width", `${score}%`);
      const color = score < 40 ? "#ff6b6b" : score < 80 ? "#ffcc66" : "#38d39f";
      bar.style.setProperty("--strength-color", color);
    }
    Object.entries(result).forEach(([k, ok]) => {
      const el = criteriaItems[k];
      if (el) el.classList.toggle("met", !!ok);
    });
  }

  updateStrengthUI(0, { len: false, upper: false, lower: false, digit: false, symbol: false });

  pwdEl.addEventListener("input", () => {
    const { result, score } = evaluatePassword(pwdEl.value);
    updateStrengthUI(score, result);
  });

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    status.style.color = "";

    const fullname = fullnameEl.value.trim();
    const email = emailEl.value.trim();
    const password = pwdEl.value;
    const roleRaw = roleEl ? roleEl.value.trim() : "student";
    const role = roleRaw.toLowerCase();

    if (!fullname || !email || !password || !role) {
      status.style.color = "red";
      status.textContent = "Please fill in all fields.";
      return;
    }

    if (!isValidEmail(email)) {
      status.style.color = "red";
      status.textContent = "Please enter a valid email address.";
      return;
    }

    const { score } = evaluatePassword(password);
    if (score < 40) {
      status.style.color = "red";
      status.textContent = "Password too weak — include uppercase, lowercase, digit, symbol and at least 8 characters.";
      return;
    }

    const signupUser = { fullname, email, password, role };

    try {
      localStorage.setItem("signupUser", JSON.stringify(signupUser));
    } catch (err) {
      console.warn("Could not save signupUser to localStorage:", err);
    }

    try {
      const response = await fetch("http://127.0.0.1:3000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupUser),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        status.style.color = "green";
        status.textContent = data.message || "Signup successful!";

        setTimeout(() => {
          alert("Signup successful! Redirecting to login...");
          window.location.href = "login.html";
        }, 800);
      } else {
        status.style.color = "red";
        status.textContent = data.message || "Signup failed. Try again.";
      }
    } catch (err) {
      console.error("Fetch error:", err);
      status.style.color = "red";
      status.textContent = "⚠️ Server not reachable. Make sure backend is running.";
    }
  });
});
