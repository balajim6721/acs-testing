import React, { useState } from 'react';
import { initializeIcons } from '@fluentui/react';
import JoinRoomScreen from './components/JoinRoomScreen';
import CallScreen from './components/CallScreen';
import './App.css';

// Initialize Fluent UI icons
initializeIcons();

function App() {
  const [callState, setCallState] = useState(null);

  // Handle joining a call
  const handleJoinCall = (callDetails) => {
    // callDetails should contain: { userId, token, displayName, roomId }
    setCallState(callDetails);
  };

  // Handle leaving a call
  const handleLeaveCall = () => {
    setCallState(null);
  };

  return (
    <div className="App ">
      {!callState ? (
        <JoinRoomScreen onJoinCall={handleJoinCall} />
      ) : (<CallScreen
        userId={callState.userId}
        token={callState.token}
        displayName={callState.displayName}
        roomId={callState.roomId}
        onLeaveCall={handleLeaveCall}
      />
      )}
    </div>
  );
}

export default App;