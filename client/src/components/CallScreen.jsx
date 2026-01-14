// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { CallClient, VideoStreamRenderer, LocalVideoStream } from "@azure/communication-calling";
// import { AzureCommunicationTokenCredential } from "@azure/communication-common";
// import {
//   Mic,
//   MicOff,
//   Video,
//   VideoOff,
//   PhoneOff,
//   MonitorUp,
//   MonitorX,
//   Users,
//   Settings,
//   Maximize2,
//   Minimize2,
//   Volume2,
//   VolumeX
// } from 'lucide-react';
// import { toast } from 'sonner';

// const CallScreen = ({ token, displayName, roomId, onLeaveCall }) => {
//   // Call state
//   const [call, setCall] = useState(null);
//   const [callAgent, setCallAgent] = useState(null);
//   const [deviceManager, setDeviceManager] = useState(null);
//   const [remoteParticipants, setRemoteParticipants] = useState([]);

//   // Media controls
//   const [isMuted, setIsMuted] = useState(false);
//   const [isCameraOn, setIsCameraOn] = useState(false);
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [isSpeakerOn, setIsSpeakerOn] = useState(true);

//   // UI state
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [showSettings, setShowSettings] = useState(false);
//   const [connectionState, setConnectionState] = useState('Connecting...');
//   const [participantCount, setParticipantCount] = useState(0);

//   // Refs
//   const localVideoRef = useRef(null);
//   const [localVideoStream, setLocalVideoStream] = useState(null);
//   const [localVideoRenderer, setLocalVideoRenderer] = useState(null);
//   const callScreenRef = useRef(null);

//   // Initialize Call Agent and Device Manager
//   useEffect(() => {
//     const initializeCall = async () => {
//       try {
//         setConnectionState('Initializing...');

//         const callClient = new CallClient();
//         const credential = new AzureCommunicationTokenCredential(token);

//         // Create call agent
//         const agent = await callClient.createCallAgent(credential, { displayName });
//         setCallAgent(agent);

//         // Get device manager
//         const devManager = await callClient.getDeviceManager();
//         setDeviceManager(devManager);

//         setConnectionState('Joining room...');

//         // Join the room
//         const groupCall = agent.join({ roomId });
//         setCall(groupCall);

//         // Set up event listeners
//         setupCallEventListeners(groupCall);

//         setConnectionState('Connected');
//         toast.success('Successfully joined the room');

//       } catch (error) {
//         console.error('Failed to initialize call:', error);
//         setConnectionState('Connection failed');
//         toast.error('Failed to join the room', {
//           description: error.message
//         });
//       }
//     };

//     initializeCall();

//     // Cleanup on unmount
//     return () => {
//       if (call) {
//         call.hangUp();
//       }
//       if (localVideoRenderer) {
//         localVideoRenderer.dispose();
//       }
//     };
//   }, [token, roomId, displayName]);

//   const setupCallEventListeners = useCallback((groupCall) => {
//     // Remote participants updated
//     groupCall.on('remoteParticipantsUpdated', (e) => {
//       const participants = Array.from(groupCall.remoteParticipants.values());
//       setRemoteParticipants(participants);
//       setParticipantCount(participants.length + 1); // +1 for local user

//       e.added.forEach(participant => {
//         toast.info(`${participant.displayName || 'Someone'} joined the call`);
//       });

//       e.removed.forEach(participant => {
//         toast.info(`${participant.displayName || 'Someone'} left the call`);
//       });
//     });

//     // Screen sharing state changes
//     groupCall.on('isScreenSharingOnChanged', () => {
//       setIsScreenSharing(groupCall.isScreenSharingOn);
//     });

//     // Call state changes
//     groupCall.on('stateChanged', () => {
//       console.log('Call state:', groupCall.state);
//       if (groupCall.state === 'Connected') {
//         setConnectionState('Connected');
//       } else if (groupCall.state === 'Disconnected') {
//         setConnectionState('Disconnected');
//         onLeaveCall();
//       }
//     });

//     // Mute state changes
//     groupCall.on('isMutedChanged', () => {
//       setIsMuted(groupCall.isMuted);
//     });
//   }, [onLeaveCall]);

//   // Camera controls
//   const toggleCamera = async () => {
//     if (!call || !deviceManager) return;

//     try {
//       if (isCameraOn && localVideoStream) {
//         // Turn off camera
//         await call.stopVideo(localVideoStream);
//         if (localVideoRenderer) {
//           localVideoRenderer.dispose();
//           setLocalVideoRenderer(null);
//         }
//         if (localVideoRef.current) {
//           localVideoRef.current.innerHTML = '';
//         }
//         setLocalVideoStream(null);
//         setIsCameraOn(false);
//         toast.info('Camera turned off');
//       } else {
//         // Turn on camera
//         const cameras = await deviceManager.getCameras();
//         if (cameras.length === 0) {
//           throw new Error('No cameras found');
//         }

//         const localStream = new LocalVideoStream(cameras[0]);
//         setLocalVideoStream(localStream);

//         // Render local video
//         const renderer = new VideoStreamRenderer(localStream);
//         setLocalVideoRenderer(renderer);
//         const view = await renderer.createView();

//         if (localVideoRef.current) {
//           localVideoRef.current.innerHTML = '';
//           localVideoRef.current.appendChild(view.target);
//         }

//         await call.startVideo(localStream);
//         setIsCameraOn(true);
//         toast.info('Camera turned on');
//       }
//     } catch (error) {
//       console.error('Camera toggle error:', error);
//       toast.error('Camera error', {
//         description: 'Please ensure camera permissions are granted and you\'re on HTTPS'
//       });
//     }
//   };

//   // Microphone controls
//   const toggleMicrophone = async () => {
//     if (!call) return;

//     try {
//       if (isMuted) {
//         await call.unmute();
//         toast.info('Microphone unmuted');
//       } else {
//         await call.mute();
//         toast.info('Microphone muted');
//       }
//     } catch (error) {
//       console.error('Microphone toggle error:', error);
//       toast.error('Microphone error');
//     }
//   };

//   // Screen sharing controls
//   const toggleScreenShare = async () => {
//     if (!call) return;

//     try {
//       if (isScreenSharing) {
//         await call.stopScreenSharing();
//         toast.info('Screen sharing stopped');
//       } else {
//         await call.startScreenSharing();
//         toast.info('Screen sharing started');
//       }
//     } catch (error) {
//       console.error('Screen share error:', error);
//       toast.error('Screen sharing failed', {
//         description: 'Screen sharing was cancelled or failed'
//       });
//     }
//   };

//   // Leave call
//   const handleLeaveCall = async () => {
//     try {
//       if (call) {
//         await call.hangUp();
//       }
//       toast.info('Call ended');
//       onLeaveCall();
//     } catch (error) {
//       console.error('Leave call error:', error);
//       onLeaveCall(); // Force leave even if hangup fails
//     }
//   };

//   // Fullscreen toggle
//   const toggleFullscreen = () => {
//     if (!document.fullscreenElement) {
//       callScreenRef.current?.requestFullscreen();
//       setIsFullscreen(true);
//     } else {
//       document.exitFullscreen();
//       setIsFullscreen(false);
//     }
//   };

//   return (
//     <div
//       ref={callScreenRef}
//       className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col text-white overflow-hidden"
//     >
//       {/* Header */}
//       <div className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-sm border-b border-white/10">
//         <div className="flex items-center gap-4">
//           <div className="flex items-center gap-2">
//             <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
//             <span className="text-sm font-medium">{connectionState}</span>
//           </div>
//           <div className="flex items-center gap-2 text-slate-300">
//             <Users className="h-4 w-4" />
//             <span className="text-sm">{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
//           </div>
//         </div>

//         <div className="flex items-center gap-3">
//           <div className="px-3 py-1 bg-white/10 rounded-full text-sm font-mono">
//             {roomId.substring(0, 8)}...
//           </div>
//           <button
//             onClick={toggleFullscreen}
//             className="p-2 hover:bg-white/10 rounded-lg transition-colors"
//           >
//             {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
//           </button>
//           <button
//             onClick={() => setShowSettings(!showSettings)}
//             className="p-2 hover:bg-white/10 rounded-lg transition-colors"
//           >
//             <Settings className="h-4 w-4" />
//           </button>
//         </div>
//       </div>

//       {/* Video Grid */}
//       <div className="flex-1 p-6 overflow-hidden">
//         <div className="h-full grid gap-4 auto-rows-fr" style={{
//           gridTemplateColumns: `repeat(${Math.min(Math.ceil(Math.sqrt(participantCount)), 4)}, 1fr)`
//         }}>
//           {/* Local Video Tile */}
//           <VideoTile
//             ref={localVideoRef}
//             displayName="You"
//             isLocal={true}
//             isCameraOn={isCameraOn}
//             isMuted={isMuted}
//             isScreenSharing={false}
//           />

//           {/* Remote Video Tiles */}
//           {remoteParticipants.map((participant) => (
//             <RemoteParticipantTile
//               key={participant.identifier.communicationUserId}
//               participant={participant}
//             />
//           ))}
//         </div>
//       </div>

//       {/* Control Bar */}
//       <div className="pb-8 flex justify-center">
//         <div className="bg-black/40 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-3 border border-white/10">
//           <ControlButton
//             icon={isMuted ? MicOff : Mic}
//             isActive={!isMuted}
//             onClick={toggleMicrophone}
//             label={isMuted ? "Unmute" : "Mute"}
//             variant={isMuted ? "danger" : "default"}
//           />

//           <ControlButton
//             icon={isCameraOn ? Video : VideoOff}
//             isActive={isCameraOn}
//             onClick={toggleCamera}
//             label={isCameraOn ? "Turn off camera" : "Turn on camera"}
//             variant={!isCameraOn ? "danger" : "default"}
//           />

//           <ControlButton
//             icon={isScreenSharing ? MonitorX : MonitorUp}
//             isActive={isScreenSharing}
//             onClick={toggleScreenShare}
//             label={isScreenSharing ? "Stop sharing" : "Share screen"}
//             variant={isScreenSharing ? "primary" : "default"}
//           />

//           <div className="w-px h-8 bg-white/20 mx-2"></div>

//           <button
//             onClick={handleLeaveCall}
//             className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105"
//           >
//             <PhoneOff className="h-5 w-5" />
//             End Call
//           </button>
//         </div>
//       </div>

//       {/* Settings Panel */}
//       {showSettings && (
//         <div className="absolute top-16 right-4 w-80 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 p-6 z-50">
//           <h3 className="text-lg font-semibold mb-4">Call Settings</h3>
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <span className="text-sm">Speaker</span>
//               <button
//                 onClick={() => setIsSpeakerOn(!isSpeakerOn)}
//                 className={`p-2 rounded-lg ${isSpeakerOn ? 'bg-green-600' : 'bg-slate-600'}`}
//               >
//                 {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
//               </button>
//             </div>
//             <div className="text-xs text-slate-400">
//               Room ID: {roomId}
//             </div>
//             <div className="text-xs text-slate-400">
//               Display Name: {displayName}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Control Button Component
// const ControlButton = ({ icon: Icon, isActive, onClick, label, variant = "default" }) => {
//   const getVariantClasses = () => {
//     switch (variant) {
//       case "danger":
//         return "bg-red-600 hover:bg-red-700";
//       case "primary":
//         return "bg-blue-600 hover:bg-blue-700";
//       default:
//         return isActive ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-600 hover:bg-slate-500";
//     }
//   };

//   return (
//     <button
//       onClick={onClick}
//       title={label}
//       className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${getVariantClasses()}`}
//     >
//       <Icon className="h-5 w-5" />
//     </button>
//   );
// };

// // Video Tile Component
// const VideoTile = React.forwardRef(({ displayName, isLocal, isCameraOn, isMuted, isScreenSharing }, ref) => {
//   return (
//     <div className="relative aspect-video bg-slate-800 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
//       <div ref={ref} className="w-full h-full object-cover" />

//       {!isCameraOn && (
//         <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
//           <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center text-2xl font-bold">
//             {displayName[0]?.toUpperCase()}
//           </div>
//         </div>
//       )}

//       {/* Overlay */}
//       <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

//       {/* Name and status */}
//       <div className="absolute bottom-3 left-3 flex items-center gap-2">
//         <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-medium">
//           {displayName}
//         </div>
//         {isMuted && (
//           <div className="bg-red-600 p-1 rounded">
//             <MicOff className="h-3 w-3" />
//           </div>
//         )}
//         {isScreenSharing && (
//           <div className="bg-blue-600 p-1 rounded">
//             <MonitorUp className="h-3 w-3" />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// });

// // Remote Participant Tile Component
// const RemoteParticipantTile = ({ participant }) => {
//   const videoRef = useRef(null);
//   const [hasVideo, setHasVideo] = useState(false);
//   const [isMuted, setIsMuted] = useState(participant.isMuted);

//   useEffect(() => {
//     const renderStream = async (stream) => {
//       if (stream.isAvailable && videoRef.current) {
//         try {
//           const renderer = new VideoStreamRenderer(stream);
//           const view = await renderer.createView();
//           videoRef.current.innerHTML = '';
//           videoRef.current.appendChild(view.target);
//           setHasVideo(true);
//         } catch (error) {
//           console.error('Error rendering remote stream:', error);
//         }
//       }
//     };

//     // Render existing video streams
//     participant.videoStreams.forEach(renderStream);

//     // Listen for video stream updates
//     const handleVideoStreamsUpdated = (e) => {
//       e.added.forEach(renderStream);
//       e.removed.forEach(() => {
//         if (videoRef.current) {
//           videoRef.current.innerHTML = '';
//           setHasVideo(false);
//         }
//       });
//     };

//     // Listen for mute state changes
//     const handleIsMutedChanged = () => {
//       setIsMuted(participant.isMuted);
//     };

//     participant.on('videoStreamsUpdated', handleVideoStreamsUpdated);
//     participant.on('isMutedChanged', handleIsMutedChanged);

//     return () => {
//       participant.off('videoStreamsUpdated', handleVideoStreamsUpdated);
//       participant.off('isMutedChanged', handleIsMutedChanged);
//     };
//   }, [participant]);

//   return (
//     <VideoTile
//       ref={videoRef}
//       displayName={participant.displayName || "Remote User"}
//       isLocal={false}
//       isCameraOn={hasVideo}
//       isMuted={isMuted}
//       isScreenSharing={false}
//     />
//   );
// };

// export default CallScreen;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CallClient, VideoStreamRenderer, LocalVideoStream } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MonitorX,
  Users,
  Settings,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';

const CallScreen = ({ token, displayName, roomId, onLeaveCall }) => {
  // Call state
  const [call, setCall] = useState(null);
  const [callAgent, setCallAgent] = useState(null);
  const [deviceManager, setDeviceManager] = useState(null);
  const [remoteParticipants, setRemoteParticipants] = useState([]);

  // Media controls
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [connectionState, setConnectionState] = useState('Connecting...');
  const [participantCount, setParticipantCount] = useState(0);

  // Refs
  const localVideoRef = useRef(null);
  const [localVideoStream, setLocalVideoStream] = useState(null);
  const [localVideoRenderer, setLocalVideoRenderer] = useState(null);
  const callScreenRef = useRef(null);

  // Initialize Call Agent and Device Manager
  useEffect(() => {
    const initializeCall = async () => {
      try {
        setConnectionState('Initializing...');

        const callClient = new CallClient();
        const credential = new AzureCommunicationTokenCredential(token);

        // Create call agent
        const agent = await callClient.createCallAgent(credential, { displayName });
        setCallAgent(agent);

        // Get device manager
        const devManager = await callClient.getDeviceManager();
        setDeviceManager(devManager);

        setConnectionState('Joining room...');

        // Join the room
        const groupCall = agent.join({ roomId });
        setCall(groupCall);

        // Set up event listeners
        setupCallEventListeners(groupCall);

        setConnectionState('Connected');
        toast.success('Successfully joined the room');

      } catch (error) {
        console.error('Failed to initialize call:', error);
        setConnectionState('Connection failed');
        toast.error('Failed to join the room', {
          description: error.message
        });
      }
    };

    initializeCall();

    // Cleanup on unmount
    return () => {
      if (call) {
        call.hangUp();
      }
      if (localVideoRenderer) {
        localVideoRenderer.dispose();
      }
    };
  }, [token, roomId, displayName]);

  const setupCallEventListeners = useCallback((groupCall) => {
    // Remote participants updated
    groupCall.on('remoteParticipantsUpdated', (e) => {
      const participants = Array.from(groupCall.remoteParticipants.values());
      setRemoteParticipants(participants);
      setParticipantCount(participants.length + 1); // +1 for local user

      e.added.forEach(participant => {
        toast.info(`${participant.displayName || 'Someone'} joined the call`);
      });

      e.removed.forEach(participant => {
        toast.info(`${participant.displayName || 'Someone'} left the call`);
      });
    });

    // Screen sharing state changes
    groupCall.on('isScreenSharingOnChanged', () => {
      setIsScreenSharing(groupCall.isScreenSharingOn);
    });

    // Call state changes
    groupCall.on('stateChanged', () => {
      console.log('Call state:', groupCall.state);
      if (groupCall.state === 'Connected') {
        setConnectionState('Connected');
      } else if (groupCall.state === 'Disconnected') {
        setConnectionState('Disconnected');
        onLeaveCall();
      }
    });

    // Mute state changes
    groupCall.on('isMutedChanged', () => {
      setIsMuted(groupCall.isMuted);
    });
  }, [onLeaveCall]);

  // Camera controls
  const toggleCamera = async () => {
    if (!call || !deviceManager) return;

    try {
      if (isCameraOn && localVideoStream) {
        // Turn off camera
        await call.stopVideo(localVideoStream);
        if (localVideoRenderer) {
          localVideoRenderer.dispose();
          setLocalVideoRenderer(null);
        }
        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
        }
        setLocalVideoStream(null);
        setIsCameraOn(false);
        toast.info('Camera turned off');
      } else {
        // Turn on camera
        const cameras = await deviceManager.getCameras();
        if (cameras.length === 0) {
          throw new Error('No cameras found');
        }

        const localStream = new LocalVideoStream(cameras[0]);
        setLocalVideoStream(localStream);

        // Render local video
        const renderer = new VideoStreamRenderer(localStream);
        setLocalVideoRenderer(renderer);
        const view = await renderer.createView();

        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
          localVideoRef.current.appendChild(view.target);
        }

        await call.startVideo(localStream);
        setIsCameraOn(true);
        toast.info('Camera turned on');
      }
    } catch (error) {
      console.error('Camera toggle error:', error);
      toast.error('Camera error', {
        description: 'Please ensure camera permissions are granted and you\'re on HTTPS'
      });
    }
  };

  // Microphone controls
  const toggleMicrophone = async () => {
    if (!call) return;

    try {
      if (isMuted) {
        await call.unmute();
        toast.info('Microphone unmuted');
      } else {
        await call.mute();
        toast.info('Microphone muted');
      }
    } catch (error) {
      console.error('Microphone toggle error:', error);
      toast.error('Microphone error');
    }
  };

  // Screen sharing controls
  const toggleScreenShare = async () => {
    if (!call) return;

    try {
      if (isScreenSharing) {
        await call.stopScreenSharing();
        toast.info('Screen sharing stopped');
      } else {
        await call.startScreenSharing();
        toast.info('Screen sharing started');
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('Screen sharing failed', {
        description: 'Screen sharing was cancelled or failed'
      });
    }
  };

  // Leave call
  const handleLeaveCall = async () => {
    try {
      if (call) {
        await call.hangUp();
      }
      toast.info('Call ended');
      onLeaveCall();
    } catch (error) {
      console.error('Leave call error:', error);
      onLeaveCall(); // Force leave even if hangup fails
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      callScreenRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={callScreenRef}
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col text-white overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{connectionState}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="h-4 w-4" />
            <span className="text-sm">{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-white/10 rounded-full text-sm font-mono">
            {roomId.substring(0, 8)}...
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="relative h-full">
          {/* Remote Video Grid */}
          <div className="h-full grid gap-4 auto-rows-fr" style={{
            gridTemplateColumns: `repeat(${Math.min(Math.ceil(Math.sqrt(remoteParticipants.length || 1)), 4)}, 1fr)`
          }}>
            {/* Remote Video Tiles */}
            {remoteParticipants.map((participant) => (
              <RemoteParticipantTile
                key={participant.identifier.communicationUserId}
                participant={participant}
              />
            ))}

            {/* Show placeholder if no remote participants */}
            {remoteParticipants.length === 0 && (
              <div className="flex items-center justify-center bg-slate-800 rounded-2xl border border-white/10">
                <div className="text-center text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Waiting for others to join...</p>
                  <p className="text-sm mt-1">Share the room ID to invite participants</p>
                </div>
              </div>
            )}
          </div>

          {/* Floating Local Video */}
          <div className="absolute bottom-4 right-4 w-64 h-auto z-10">
            <VideoTile
              ref={localVideoRef}
              displayName="You"
              isLocal={true}
              isCameraOn={isCameraOn}
              isMuted={isMuted}
              isScreenSharing={false}
            />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="py-4 flex justify-center">
        <div className="bg-black/40 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-3 border border-white/10">
          <ControlButton
            icon={isMuted ? MicOff : Mic}
            isActive={!isMuted}
            onClick={toggleMicrophone}
            label={isMuted ? "Unmute" : "Mute"}
            variant={isMuted ? "danger" : "default"}
          />

          <ControlButton
            icon={isCameraOn ? Video : VideoOff}
            isActive={isCameraOn}
            onClick={toggleCamera}
            label={isCameraOn ? "Turn off camera" : "Turn on camera"}
            variant={!isCameraOn ? "danger" : "default"}
          />

          <ControlButton
            icon={isScreenSharing ? MonitorX : MonitorUp}
            isActive={isScreenSharing}
            onClick={toggleScreenShare}
            label={isScreenSharing ? "Stop sharing" : "Share screen"}
            variant={isScreenSharing ? "primary" : "default"}
          />

          <div className="w-px h-8 bg-white/20 mx-2"></div>

          <button
            onClick={handleLeaveCall}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <PhoneOff className="h-5 w-5" />
            End Call
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-80 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 p-6 z-50">
          <h3 className="text-lg font-semibold mb-4">Call Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Speaker</span>
              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`p-2 rounded-lg ${isSpeakerOn ? 'bg-green-600' : 'bg-slate-600'}`}
              >
                {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
            <div className="text-xs text-slate-400">
              Room ID: {roomId}
            </div>
            <div className="text-xs text-slate-400">
              Display Name: {displayName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Control Button Component
const ControlButton = ({ icon: Icon, isActive, onClick, label, variant = "default" }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700";
      case "primary":
        return "bg-blue-600 hover:bg-blue-700";
      default:
        return isActive ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-600 hover:bg-slate-500";
    }
  };

  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${getVariantClasses()}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
};

// Video Tile Component
const VideoTile = React.forwardRef(({ displayName, isLocal, isCameraOn, isMuted, isScreenSharing }, ref) => {
  return (
    <div className="relative aspect-video bg-slate-800 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
      <div ref={ref} className="w-full h-auto object-cover" />

      {!isCameraOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
          <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {displayName[0]?.toUpperCase()}
          </div>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Name and status */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-medium">
          {displayName}
        </div>
        {isMuted && (
          <div className="bg-red-600 p-1 rounded">
            <MicOff className="h-3 w-3" />
          </div>
        )}
        {isScreenSharing && (
          <div className="bg-blue-600 p-1 rounded">
            <MonitorUp className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  );
});

// Remote Participant Tile Component
const RemoteParticipantTile = ({ participant }) => {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(participant.isMuted);

  useEffect(() => {
    const renderStream = async (stream) => {
      if (stream.isAvailable && videoRef.current) {
        try {
          const renderer = new VideoStreamRenderer(stream);
          const view = await renderer.createView();
          videoRef.current.innerHTML = '';
          videoRef.current.appendChild(view.target);
          setHasVideo(true);
        } catch (error) {
          console.error('Error rendering remote stream:', error);
        }
      }
    };

    // Render existing video streams
    participant.videoStreams.forEach(renderStream);

    // Listen for video stream updates
    const handleVideoStreamsUpdated = (e) => {
      e.added.forEach(renderStream);
      e.removed.forEach(() => {
        if (videoRef.current) {
          videoRef.current.innerHTML = '';
          setHasVideo(false);
        }
      });
    };

    // Listen for mute state changes
    const handleIsMutedChanged = () => {
      setIsMuted(participant.isMuted);
    };

    participant.on('videoStreamsUpdated', handleVideoStreamsUpdated);
    participant.on('isMutedChanged', handleIsMutedChanged);

    return () => {
      participant.off('videoStreamsUpdated', handleVideoStreamsUpdated);
      participant.off('isMutedChanged', handleIsMutedChanged);
    };
  }, [participant]);

  return (
    <VideoTile
      ref={videoRef}
      displayName={participant.displayName || "Remote User"}
      isLocal={false}
      isCameraOn={hasVideo}
      isMuted={isMuted}
      isScreenSharing={false}
    />
  );
};

export default CallScreen;