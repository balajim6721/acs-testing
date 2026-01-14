import React, { useState, useEffect, useMemo } from 'react';
import {
    VideoTile,
    ControlBar,
    CameraButton,
    MicrophoneButton,
    EndCallButton,
    ScreenShareButton,
    ParticipantItem
} from '@azure/communication-react';
import { CallClient } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

const CustomGroupCall = ({ token, roomId, displayName, onLeave }) => {
    const [call, setCall] = useState(null);
    const [remoteParticipants, setRemoteParticipants] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isLocalVideoOn, setIsLocalVideoOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // 1. Initialize Call
    useEffect(() => {
        const initCall = async () => {
            const callClient = new CallClient();
            const credential = new AzureCommunicationTokenCredential(token);
            const agent = await callClient.createCallAgent(credential, { displayName });
            const groupCall = agent.join({ roomId });

            setCall(groupCall);

            // Track participants
            groupCall.on('remoteParticipantsUpdated', (e) => {
                setRemoteParticipants([...groupCall.remoteParticipants.values()]);
            });
        };
        initCall();
    }, [token, roomId, displayName]);

    // 2. Handlers using the SDK
    const handleMute = async () => {
        isMuted ? await call.unmute() : await call.mute();
        setIsMuted(!isMuted);
    };

    const handleVideo = async () => {
        // Logic to toggle camera using localVideoStream
        setIsLocalVideoOn(!isLocalVideoOn);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-white font-sans">
            {/* HEADER SECTION */}
            <header className="p-6 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Project Synapse Meeting</h1>
                    <p className="text-slate-400 text-sm">Room ID: {roomId}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                        Live • 00:45:12
                    </div>
                </div>
            </header>

            {/* VIDEO GRID SECTION (Custom Layout) */}
            <main className="flex-1 p-6 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full auto-rows-fr">

                    {/* LOCAL VIDEO TILE */}
                    <div className="relative group rounded-3xl overflow-hidden bg-slate-900 ring-1 ring-slate-800 shadow-2xl">
                        <VideoTile
                            displayName={`${displayName} (You)`}
                            isMuted={isMuted}
                            renderElement={<div className="bg-slate-800 w-full h-full flex items-center justify-center">Camera Off</div>}
                        // styles here allow for small tweaks, but Tailwind handles the outer shell
                        />
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-sm border border-white/10">You</span>
                        </div>
                    </div>

                    {/* REMOTE VIDEO TILES */}
                    {remoteParticipants.map((participant) => (
                        <div key={participant.identifier.communicationUserId}
                            className="relative group rounded-3xl overflow-hidden bg-slate-900 ring-1 ring-slate-800 shadow-2xl transition-all hover:ring-blue-500/50">
                            <VideoTile
                                displayName={participant.displayName || "Guest"}
                                isMuted={participant.isMuted}
                            // Azure will automatically render the stream inside this component 
                            // if we hook up the 'renderElement' prop correctly to the participant's stream
                            />
                        </div>
                    ))}
                </div>
            </main>

            {/* CUSTOMIZED CONTROL BAR (Using Azure UI Buttons + Tailwind) */}
            <footer className="h-24 flex items-center justify-center bg-slate-950">
                <div className="flex items-center gap-4 px-8 py-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                    <MicrophoneButton
                        checked={!isMuted}
                        onClick={handleMute}
                        styles={{ root: { borderRadius: '12px' } }}
                    />
                    <CameraButton
                        checked={isLocalVideoOn}
                        onClick={handleVideo}
                        styles={{ root: { borderRadius: '12px' } }}
                    />
                    <ScreenShareButton
                        checked={isScreenSharing}
                        onClick={() => setIsScreenSharing(!isScreenSharing)}
                        styles={{ root: { borderRadius: '12px' } }}
                    />

                    <div className="w-px h-8 bg-slate-800 mx-2" />

                    <EndCallButton
                        onClick={onLeave}
                        styles={{ root: { borderRadius: '12px', background: '#ef4444' } }}
                    />
                </div>
            </footer>
        </div>
    );
};

export default CustomGroupCall;