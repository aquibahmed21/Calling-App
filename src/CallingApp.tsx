import React, { useRef, useState, useEffect } from "react";

const CallingApp: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [callActive, setCallActive] = useState(false);

  useEffect(() => {
    window.addEventListener("storage", handleStorageEvent);
    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [peerConnection]);

  const handleStorageEvent = async (event: StorageEvent) => {
    if (!peerConnection) return;

    if (event.key === "answer") {
      const answer = JSON.parse(event.newValue || "null");
      if (answer) {
        await peerConnection.setRemoteDescription(answer);
        console.log("Answer received and set.");
      }
    } else if (event.key === "ice-candidate") {
      const candidate = JSON.parse(event.newValue || "null");
      if (candidate) {
        await peerConnection.addIceCandidate(candidate);
        console.log("ICE candidate added.");
      }
    }
  };

  const createStreamInvite = async () => {
    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        localStorage.setItem("ice-candidate", JSON.stringify(event.candidate));
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const link = `${window.location.origin}?offer=${btoa(JSON.stringify(offer))}`;
    setInviteLink(link);
    setPeerConnection(pc);
    localStorage.setItem("offer", JSON.stringify(offer));
  };

  const joinStream = async (offer: RTCSessionDescriptionInit) => {
    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        localStorage.setItem("ice-candidate", JSON.stringify(event.candidate));
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    localStorage.setItem("answer", JSON.stringify(answer));
    setPeerConnection(pc);
    setCallActive(true);
  };

  const handleInviteLink = async () => {
    const params = new URLSearchParams(window.location.search);
    const encodedOffer = params.get("offer");

    if (encodedOffer) {
      const offer = JSON.parse(atob(encodedOffer));
      await joinStream(offer);
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", margin: "20px", textAlign: "center" }}>
      <h1>WebRTC Calling App</h1>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
        <div>
          <h3>Local Stream</h3>
          <video ref={localVideoRef} autoPlay playsInline style={{ width: "300px", borderRadius: "10px", border: "2px solid #007BFF" }}></video>
        </div>
        <div>
          <h3>Remote Stream</h3>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "300px", borderRadius: "10px", border: "2px solid #28A745" }}></video>
        </div>
      </div>

      {!callActive && (
        <button
          onClick={createStreamInvite}
          style={{ padding: "10px 20px", backgroundColor: "#007BFF", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          Start Call
        </button>
      )}

      {inviteLink && (
        <div style={{ marginTop: "20px" }}>
          <p>Share this invite link:</p>
          <textarea
            readOnly
            value={inviteLink}
            style={{ width: "80%", height: "50px", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}
          />
        </div>
      )}

      <button
        onClick={handleInviteLink}
        style={{ marginTop: "20px", padding: "10px 20px", backgroundColor: "#28A745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
      >
        Join Call
      </button>
    </div>
  );
};

export default CallingApp;
