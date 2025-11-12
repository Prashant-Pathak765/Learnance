
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "../public"))); // Serve frontend


const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/learnance";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));


const userSchema = new mongoose.Schema({
  fullname: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
});
const User = mongoose.model("User", userSchema);


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/signup.html"));
});


app.post("/api/auth/signup", async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;
    if (!fullname || !email || !password || !role)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    await new User({ fullname, email, password, role }).save();
    res.status(201).json({ message: "Signup successful!" });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email, role });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.password !== password)
      return res.status(401).json({ message: "Invalid password" });

    res.status(200).json({
      message: "Login successful!",
      user: { fullname: user.fullname, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});
app.get("/student", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/student.html"));
});
app.get("/teacher", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/teacher.html"));
});
app.get("/camera.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/camera.html"));
});

io.on("connection", (socket) => {
  console.log("🔗 User connected:", socket.id);

  socket.on("offer", (offer) => socket.broadcast.emit("offer", offer));
  socket.on("answer", (answer) => socket.broadcast.emit("answer", answer));
  socket.on("ice-candidate", (candidate) =>
    socket.broadcast.emit("ice-candidate", candidate)
  );

  socket.on("disconnect", () => console.log("❌ User disconnected:", socket.id));
});


server.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
