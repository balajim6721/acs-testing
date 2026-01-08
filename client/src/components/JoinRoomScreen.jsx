import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Video, Users, UserPlus, LogIn, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateToken, createRoom, joinRoom, validateRoom, healthCheck, getRoomParticipants } from '../services/api';

const JoinRoomScreen = ({ onJoinCall }) => {
  const [displayName, setDisplayName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState('join'); // 'join' or 'create'
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = async () => {
    if (!displayName.trim()) {
      toast.error('Display name required', {
        description: 'Please enter your name'
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Generate token
      toast.info('Generating token...');
      const tokenData = await generateToken(displayName);

      if (!tokenData.userId) {
        throw new Error('User ID not found in token response');
      }

      if (typeof tokenData.userId !== 'string') {
        throw new Error(`Invalid user ID type: ${typeof tokenData.userId}`);
      }

      // 2. Create room
      toast.info('Creating room...');
      const roomData = await createRoom(
        tokenData.userId,
        displayName,
        roomName || `${displayName}'s Room`
      );

      console.log('✅ Room created SUCCESSFULLY');
      console.log('Room ID:', roomData.roomId);
      console.log('Room ID type:', typeof roomData.roomId);
      console.log('Full room data:', roomData);

      // 3. TEST: Try to get participants immediately
      console.log('🧪 Testing participants API...');
      try {
        const participants = await getRoomParticipants(roomData.roomId);
        console.log('✅ Participants API works:', participants);
      } catch (participantError) {
        console.error('❌ Participants API failed:', participantError.message);
      }

      // 3. Join call
      onJoinCall({
        userId: tokenData.userId,
        token: tokenData.token,
        displayName,
        roomId: roomData.roomId
      });

      toast.success('Room created successfully!', {
        description: `Share the Room ID: ${roomData.roomId}`
      });

    } catch (error) {
      toast.error('Failed to create room', {
        description: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!displayName.trim()) {
      toast.error('Display name required');
      return;
    }

    if (!roomId.trim()) {
      toast.error('Room ID required');
      return;
    }

    setLoading(true);
    try {
      // 1. Generate token FIRST
      toast.info('Generating token...');
      const tokenData = await generateToken(displayName);

      console.log('🔑 Token generated for join:');
      console.log('Full token data:', tokenData);
      console.log('UserId from token:', tokenData.userId);
      console.log('UserId type:', typeof tokenData.userId);

      // Ensure userId is a string
      let userId = tokenData.userId;
      if (userId && typeof userId === 'object') {
        console.warn('⚠️ userId is object, extracting...');
        console.log('Object structure:', JSON.stringify(userId, null, 2));

        if (userId.communicationUserId) {
          userId = userId.communicationUserId;
        } else if (userId.userId) {
          userId = userId.userId;
        } else if (userId.user && userId.user.communicationUserId) {
          userId = userId.user.communicationUserId;
        }
        console.log('Extracted userId:', userId);
      }

      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID received from token service');
      }

      // 2. Validate room exists
      toast.info('Validating room...');
      const isValid = await validateRoom(roomId);

      if (!isValid) {
        throw new Error('Room not found. Please check the Room ID.');
      }

      // 3. Join room with validated userId
      toast.info('Joining room...');
      console.log('🚪 Calling joinRoom API with:');
      console.log('Room ID:', roomId);
      console.log('User ID:', userId);
      console.log('Display Name:', displayName);

      const joinResult = await joinRoom(roomId, userId, displayName);
      console.log('✅ Join room result:', joinResult);

      // 4. Enter call
      onJoinCall({
        userId: userId,
        token: tokenData.token,
        displayName,
        roomId
      });

      toast.success('Joined room successfully!');

    } catch (error) {
      console.error('❌ Join room error details:');
      console.error('Error:', error);
      console.error('Error response:', error.response?.data);

      let errorMessage = error.response?.data?.error || error.message;

      // User-friendly error messages
      if (errorMessage.includes('not found')) {
        errorMessage = 'Room not found. Please check the Room ID and try again.';
      } else if (errorMessage.includes('already in')) {
        errorMessage = 'You are already in this room.';
      } else if (errorMessage.includes('expired')) {
        errorMessage = 'This room has expired. Please create a new room.';
      }

      toast.error('Failed to join room', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast.success('Room ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHealthCheck = async () => {
    try {
      await healthCheck();
      toast.success('API is healthy');
    } catch (error) {
      toast.error('API is unhealthy');
      return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-2xl border-0">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
            <Video className="h-10 w-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Start or Join a Video Call
          </h1>
          <p className="text-gray-600">
            Connect with others using Azure Communication Services
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserPlus className="inline h-4 w-4 mr-2" />
                Your Display Name
              </label>
              <InputText
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-3"
                disabled={loading}
              />
            </div>

            {/* Mode Toggle */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setMode('join')}
                  className={`flex-1 py-3 px-4 rounded-lg text-center transition-all ${mode === 'join'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <LogIn className="inline h-4 w-4 mr-2" />
                  Join Existing Room
                </button>
                <button
                  onClick={() => setMode('create')}
                  className={`flex-1 py-3 px-4 rounded-lg text-center transition-all ${mode === 'create'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Video className="inline h-4 w-4 mr-2" />
                  Create New Room
                </button>
              </div>

              {mode === 'create' && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name (Optional)
                  </label>
                  <InputText
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g., Team Meeting"
                    className="w-full p-3"
                    disabled={loading}
                  />
                </div>
              )}

              {mode === 'join' && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room ID
                  </label>
                  <div className="flex space-x-2">
                    <InputText
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Enter room ID"
                      className="flex-1 p-3"
                      disabled={loading}
                    />
                    <Button
                      icon={copied ? <CheckCircle /> : <Copy />}
                      className="p-3"
                      onClick={copyRoomId}
                      disabled={!roomId}
                      severity="secondary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <Button
              label={
                loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {mode === 'create' ? 'Creating...' : 'Joining...'}
                  </>
                ) : mode === 'create' ? (
                  'Create Room & Join'
                ) : (
                  'Join Room'
                )
              }
              onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
              className="w-full py-3 text-lg"
              disabled={loading || !displayName.trim() || (mode === 'join' && !roomId.trim())}
              icon={mode === 'create' ? <Video /> : <LogIn />}
            />
            <Button
              label={"Health Check"}
              onClick={handleHealthCheck}
              className="w-full py-3 text-lg mt-4!"
            />
          </div>

          {/* Right Column - Instructions */}
          <div className="bg-primary-50 p-6 rounded-xl border border-primary-100">
            <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              How it works
            </h3>

            <div className="space-y-4">
              <div className="flex items-start">
                <Badge value="1" className="mr-3 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Enter your name</h4>
                  <p className="text-sm text-gray-600">This is how others will see you in the call</p>
                </div>
              </div>

              <div className="flex items-start">
                <Badge value="2" className="mr-3 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    {mode === 'create' ? 'Create a new room' : 'Join with Room ID'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {mode === 'create'
                      ? 'Start a new video call room and share the ID with others'
                      : 'Enter the Room ID provided by the meeting organizer'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Badge value="3" className="mr-3 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Join the call</h4>
                  <p className="text-sm text-gray-600">
                    Grant camera & microphone permissions when prompted
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-primary-200">
              <h4 className="font-medium text-primary-800 mb-2">Testing with multiple users</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Open this page in different browsers</li>
                <li>• Use the same Room ID to join</li>
                <li>• Test audio/video from each device</li>
                <li>• Verify screen sharing works</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default JoinRoomScreen;