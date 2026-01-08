import React, { useState } from 'react';
import {
  PrimaryButton,
  TextField,
  Stack,
  MessageBar,
  MessageBarType
} from '@fluentui/react';
import './JoinRoomScreen.css';

const JoinRoomScreen = ({ onJoinCall }) => {
  const [displayName, setDisplayName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!displayName.trim()) {
      setError("Please enter your display name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1️⃣ Get token FIRST
      const tokenResponse = await fetch("http://localhost:4000/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!tokenResponse.ok) {
        throw new Error("Token request failed");
      }

      const tokenData = await tokenResponse.json();
      const userId = tokenData.user.communicationUserId;

      // 2️⃣ Create room with userId
      const roomResponse = await fetch("http://localhost:4000/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: `${displayName}'s Room`,
          createdBy: displayName,
          userId: userId // ✅ Pass userId to automatically add creator
        })
      });

      if (!roomResponse.ok) {
        throw new Error("Room creation failed");
      }

      const roomData = await roomResponse.json();
      const createdRoomId = roomData.roomId;

      console.log("Room created:", createdRoomId);
      console.log("Creator userId:", userId);

      // 3️⃣ Join call UI
      onJoinCall({
        userId,
        token: tokenData.token,
        displayName,
        roomId: createdRoomId
      });

    } catch (err) {
      console.error("Create room error:", err);
      setError("Failed to create room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    debugger
    if (!displayName.trim()) {
      setError("Please enter your display name");
      return;
    }

    if (!roomId.trim()) {
      setError("Please enter a room ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1️⃣ Get ACS token + user
      const tokenResponse = await fetch("http://localhost:4000/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!tokenResponse.ok) {
        throw new Error("Token request failed");
      }

      const tokenData = await tokenResponse.json();
      const userId = tokenData.user.communicationUserId; // ✅ Fixed: use correct path

      console.log("Token received for user:", userId);

      // 2️⃣ Join room
      const joinResponse = await fetch(
        `http://localhost:4000/api/rooms/${roomId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            displayName: displayName
          })
        }
      );
      console.log("joinResponse",joinResponse);
      

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        console.error("Join room failed:", errorData);
        throw new Error(errorData.error || "Join room failed");
      }

      const joinData = await joinResponse.json();
      console.log("Successfully joined room:", joinData);

      // 3️⃣ Enter call UI
      onJoinCall({
        userId,
        token: tokenData.token,
        displayName,
        roomId
      });

    } catch (err) {
      console.error("Join room error:", err);
      setError(err.message || "Failed to join room. Please check the room ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className=" w-[100%] flex justify-center"
   >
     <div className="join-screen-container max-w-lg!">
      <div className="join-screen-card ">
        <h1 className="join-screen-title">Azure Communication Services</h1>
        <p className="join-screen-subtitle">Group Video Call</p>

        <Stack tokens={{ childrenGap: 20 }}>
          {error && (
            <MessageBar
              messageBarType={MessageBarType.error}
              onDismiss={() => setError('')}
              dismissButtonAriaLabel="Close"
            >
              {error}
            </MessageBar>
          )}

          {/* Display Name Input */}
          <TextField
            label="Display Name"
            placeholder="Enter your name"
            value={displayName}
            onChange={(e, newValue) => setDisplayName(newValue || '')}
            required
          />

          {/* Toggle between Create and Join */}
          <div className="toggle-container">
            <button
              className={`toggle-button ${!isCreatingRoom ? 'active' : ''}`}
              onClick={() => setIsCreatingRoom(false)}
            >
              Join Existing Room
            </button>
            <button
              className={`toggle-button ${isCreatingRoom ? 'active' : ''}`}
              onClick={() => setIsCreatingRoom(true)}
            >
              Create New Room
            </button>
          </div>

          {/* Conditional Input based on mode */}
          {!isCreatingRoom && (
            <TextField
              label="Room ID"
              placeholder="Enter room ID to join"
              value={roomId}
              onChange={(e, newValue) => setRoomId(newValue || '')}
              required
            />
          )}

          {/* Action Button */}
          <PrimaryButton
            text={isCreatingRoom ? 'Create Room' : 'Join Room'}
            onClick={isCreatingRoom ? handleCreateRoom : handleJoinRoom}
            disabled={loading}
            styles={{ root: { marginTop: 10 } }}
          />

          {loading && <div className="loading-text">Loading...</div>}
        </Stack>

        <div className="device-setup-note">
          <p>Note: Camera and microphone permissions will be requested when you join.</p>
        </div>
      </div>
    </div>
   </div>
  );
};

export default JoinRoomScreen;