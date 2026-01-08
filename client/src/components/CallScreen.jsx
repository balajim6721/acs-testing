import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  FluentThemeProvider,
  CallComposite,
  fromFlatCommunicationIdentifier,
  useAzureCommunicationCallAdapter
} from '@azure/communication-react';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import {
  PhoneOff,
  Settings,
  Users,
  Share2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getRoomParticipants } from '../services/api';

const CallScreen = ({ userId, token, displayName, roomId, onLeaveCall }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  // Fetch participants periodically
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const data = await getRoomParticipants(roomId);
        setParticipants(data.participants);
      } catch (error) {
        console.error('Failed to fetch participants:', error);
      } finally {
        setLoadingParticipants(false);
      }
    };

    fetchParticipants();
    const interval = setInterval(fetchParticipants, 60000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [roomId]);

  // Create credential
  const credential = useMemo(() => {
    if (!token) {
      toast.error('No token provided');
      return undefined;
    }
    try {
      return new AzureCommunicationTokenCredential(token);
    } catch (e) {
      toast.error('Invalid ACS token');
      return undefined;
    }
  }, [token]);

  // Create user identifier
  const userIdentifier = useMemo(() => {
    if (!userId) {
      toast.error('No user ID provided');
      return undefined;
    }
    return fromFlatCommunicationIdentifier(userId);
  }, [userId]);

  // Create room locator
  const locator = useMemo(() => {
    if (!roomId) {
      toast.error('No room ID provided');
      return undefined;
    }
    return { roomId };
  }, [roomId]);

  // Leave callback
  const onCompositeLeave = useCallback(async () => {
    toast.info('Left the call');
    onLeaveCall();
  }, [onLeaveCall]);

  // Create adapter
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

  // Loading state
  if (!adapter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6 animate-pulse">
            <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connecting to call...</h2>
          <div className="space-y-2 text-gray-600">
            <p>Room: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{roomId}</span></p>
            <p>User: <span className="font-semibold">{displayName}</span></p>
          </div>
          <div className="mt-8 text-sm text-gray-500">
            <p>Make sure you allow camera and microphone access when prompted</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Video Call</h2>
          <div className="flex items-center space-x-4 mt-1">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {loadingParticipants ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Loading participants...
                  </span>
                ) : (
                  `${participants.length} participant${participants.length !== 1 ? 's' : ''}`
                )}
              </span>
            </div>
            <div className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              Room: {roomId.substring(0, 8)}...
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            icon={<Settings />}
            label="Settings"
            severity="secondary"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-3"
          />
          <Button
            icon={<PhoneOff />}
            label="Leave Call"
            severity="danger"
            onClick={onCompositeLeave}
            className="p-3"
          />
        </div>
      </div>

      {/* Main Call Area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Call Composite - Takes 2/3 width */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] overflow-hidden p-0">
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
                    endCallButton: false // We have our own leave button
                  }
                }}
              />
            </FluentThemeProvider>
          </Card>
        </div>

        {/* Participants Sidebar */}
        <div>
          <Card title={
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              <span>Participants</span>
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                {participants.length}
              </span>
            </div>
          }>
            {loadingParticipants ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">Loading participants...</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>Waiting for others to join...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-primary-600">
                          {participant.displayName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {participant.displayName || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {participant.role?.toLowerCase() || 'attendee'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-gray-700 mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  icon={<Share2 />}
                  label="Share Room"
                  severity="info"
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(roomId);
                    toast.success('Room ID copied to clipboard');
                  }}
                />
                <Button
                  icon={<Video />}
                  label="Video"
                  severity="secondary"
                  size="small"
                />
                <Button
                  icon={<Mic />}
                  label="Audio"
                  severity="secondary"
                  size="small"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Testing Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="mr-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Share2 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Testing Instructions</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Open this application in another browser/incognito window</li>
              <li>• Join using the same Room ID: <code className="bg-blue-100 px-2 py-1 rounded">{roomId}</code></li>
              <li>• Verify you can see and hear each other</li>
              <li>• Test screen sharing functionality</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CallScreen;