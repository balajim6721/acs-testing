// import React, { useMemo, useCallback, useEffect } from 'react';
// import {
//   FluentThemeProvider,
//   CallComposite,
//   fromFlatCommunicationIdentifier,
//   useAzureCommunicationCallAdapter
// } from '@azure/communication-react';
// import { AzureCommunicationTokenCredential } from '@azure/communication-common';
// import './CallScreen.css';

// const CallScreen = ({ userId, token, displayName, roomId, onLeaveCall }) => {
//   // ✅ Create stable credential reference
//   const credential = useMemo(() => {
//     if (!token) {
//       console.error('❌ No token provided');
//       return undefined;
//     }
//     console.log('✅ Creating credential for token');
//     return new AzureCommunicationTokenCredential(token);
//   }, [token]);

//   // ✅ Create stable user identifier reference
//   const userIdentifier = useMemo(() => {
//     if (!userId) {
//       console.error('❌ No userId provided');
//       return undefined;
//     }
//     console.log('✅ Creating user identifier:', userId);
//     return fromFlatCommunicationIdentifier(userId);
//   }, [userId]);

//   // ✅ Create stable locator reference
//   const locator = useMemo(() => {
//     if (!roomId) {
//       console.error('❌ No roomId provided');
//       return undefined;
//     }
//     console.log('✅ Creating locator for room:', roomId);
//     return { roomId };
//   }, [roomId]);

//   // ✅ IMPORTANT: useAzureCommunicationCallAdapter must be called at the top level
//   // It cannot be inside useEffect or any other function
//   const adapter = useAzureCommunicationCallAdapter({
//     userId: userIdentifier,
//     displayName: displayName,
//     credential: credential,
//     locator: locator,
//   });
//   console.log("adapter",adapter);
  

//   // Log when adapter is ready
//   useEffect(() => {
//     if (adapter) {
//       console.log('✅ Adapter ready');
//       console.log('   Room ID:', roomId);
//       console.log('   User ID:', userId);
//       console.log('   Display Name:', displayName);
//     }
//   }, [adapter, roomId, userId, displayName]);

//   // ✅ Cleanup adapter on unmount
//   useEffect(() => {
//     return () => {
//       if (adapter) {
//         console.log('🧹 Cleaning up adapter');
//         try {
//           adapter.dispose();
//         } catch (error) {
//           console.error('Error disposing adapter:', error);
//         }
//       }
//     };
//   }, [adapter]);

//   // ✅ Handle call end with useCallback to prevent recreation
//   const handleCallEnd = useCallback(async () => {
//     console.log('🔴 Leaving call...');
//     try {
//       if (adapter) {
//         await adapter.leaveCall();
//         adapter.dispose();
//         console.log('✅ Successfully left call');
//       }
//     } catch (error) {
//       console.error('❌ Error leaving call:', error);
//     } finally {
//       onLeaveCall();
//     }
//   }, [adapter, onLeaveCall]);
//   // Show loading state while adapter is being created
//   if (!adapter) {
//     return (
//       <div className="call-screen-loading">
//         <div className="spinner"></div>
//         <p>Connecting to call...</p>
//         <div className="loading-details">
//           <p>Room: {roomId}</p>
//           <p>User: {displayName}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="call-screen-container">
//       <FluentThemeProvider>
//         <div className="call-header">
//           <div className="room-info">
//             <span className="room-label">Room:</span>
//             <span className="room-id">{roomId}</span>
//           </div>
//           <button className="leave-button" onClick={handleCallEnd}>
//             Leave Call
//           </button>
//         </div>

//         <div className="call-composite-container">
//           <CallComposite
//             adapter={adapter}
//             formFactor="desktop"
//             options={{

//               callControls: {
//                 cameraButton: true,
//                 microphoneButton: true,
//                 screenShareButton: true,
//                 participantsButton: true,
//                 devicesButton: true,
//                 endCallButton: true,
//               }
//             }}
//           />
//         </div>
//       </FluentThemeProvider>
//     </div>
//   );
// };

// export default CallScreen;


import React, { useMemo, useCallback } from 'react';
import {
  FluentThemeProvider,
  CallComposite,
  fromFlatCommunicationIdentifier,
  useAzureCommunicationCallAdapter
} from '@azure/communication-react';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import './CallScreen.css';

const CallScreen = ({ userId, token, displayName, roomId, onLeaveCall }) => {
  /**
   * 1️⃣ Create credential (stable)
   */
  const credential = useMemo(() => {
    if (!token) {
      console.error('❌ No token provided');
      return undefined;
    }

    try {
      return new AzureCommunicationTokenCredential(token);
    } catch (e) {
      console.error('❌ Invalid ACS token', e);
      return undefined;
    }
  }, [token]);

  /**
   * 2️⃣ Create user identifier (stable)
   */
  const userIdentifier = useMemo(() => {
    if (!userId) {
      console.error('❌ No userId provided');
      return undefined;
    }
    return fromFlatCommunicationIdentifier(userId);
  }, [userId]);

  /**
   * 3️⃣ Create locator (Room)
   */
  const locator = useMemo(() => {
    if (!roomId) {
      console.error('❌ No roomId provided');
      return undefined;
    }
    return { roomId };
  }, [roomId]);

  /**
   * 4️⃣ Leave callback (called by composite)
   */
  const onCompositeLeave = useCallback(async () => {
    console.log('🔴 Composite requested leave');
    onLeaveCall(); // navigate away / update UI
  }, [onLeaveCall]);

  /**
   * 5️⃣ Create adapter (ASYNC, managed by hook)
   */
  const adapter = useAzureCommunicationCallAdapter(
    {
      userId: userIdentifier,
      displayName,
      credential,
      locator
    },
    undefined,
    onCompositeLeave
  );

  console.log();
  
  /**
   * 6️⃣ Loading state while adapter initializes
   */
  if (!adapter) {
    return (
      <div className="call-screen-loading">
        <div className="spinner" />
        <p>Connecting to call…</p>
        <p><strong>Room:</strong> {roomId}</p>
        <p><strong>User:</strong> {displayName}</p>
      </div>
    );
  }

  /**
   * 7️⃣ Render CallComposite
   */
  return (
    <div className="call-screen-container">
      <FluentThemeProvider>
        <CallComposite
          adapter={adapter}
          formFactor="desktop"
          options={{
            callControls: {
              cameraButton: true,
              microphoneButton: true,
              screenShareButton: true,
              participantsButton: true,
              devicesButton: true,
              endCallButton: true
            }
          }}
        />
      </FluentThemeProvider>
    </div>
  );
};

export default CallScreen;
