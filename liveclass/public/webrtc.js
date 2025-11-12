
const socket = io("http://localhost:3000");


function log(...args) {
  console.log("[WebRTC]", ...args);
}

function determineRole() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("role") || "student";
}

function createPeerConnection(socket, remoteVideo) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };

  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
      log("Remote stream added");
    }
  };

  return pc;
}


async function initCamera(role, socket) {
  log("Starting camera with role:", role);

  const localVideo = document.getElementById("localVideo");
  const remoteVideo = document.getElementById("remoteVideo");

  if (!localVideo || !remoteVideo) {
    console.error("Video elements not found on page");
    return;
  }

  let localStream;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    log("Local camera and mic access granted");
  } catch (err) {
    console.error("Camera access error:", err);
    alert("Please allow camera/microphone permissions.");
    return;
  }

  const peerConnection = createPeerConnection(socket, remoteVideo);
  localStream.getTracks().forEach((t) => peerConnection.addTrack(t, localStream));


  socket.off("offer");
  socket.off("answer");
  socket.off("ice-candidate");

  socket.on("offer", async (offer) => {
    if (role === "student") {
      log("Student received offer");
      try {
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", answer);
        log("Student sent answer");
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    }
  });

  socket.on("answer", async (answer) => {
    if (role === "teacher") {
      log("Teacher received answer");
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (err) {
        console.error("Error applying answer:", err);
      }
    }
  });

  socket.on("ice-candidate", async (candidate) => {
    if (!candidate) return;
    try {
      await peerConnection.addIceCandidate(candidate);
      log("Added remote ICE candidate");
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
    }
  });

  if (role === "teacher") {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("offer", offer);
      log("Teacher created and sent offer");
    } catch (err) {
      console.error("Error creating/sending offer:", err);
    }
  } else {
    log("Student waiting for teacher offer...");
  }
}

socket.on("connect", () => {
  log("Connected to signaling server:", socket.id);
});

socket.on("disconnect", (reason) => {
  log("Socket disconnected:", reason);
});


window.startCamera = (r) => {
  const role = r ? r.toLowerCase() : determineRole();
  initCamera(role, socket);
};
