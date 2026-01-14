import React, { useState, useEffect } from 'react';
import {
  Video,
  Users,
  UserPlus,
  LogIn,
  Copy,
  CheckCircle,
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle,
  Shield,
  Clock,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { generateToken, createRoom, joinRoom, validateRoom, healthCheck, getRoomParticipants } from '../services/api';

const JoinRoomScreen = ({ onJoinCall }) => {
  const [displayName, setDisplayName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState('join'); // 'join' or 'create'
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiHealth, setApiHealth] = useState(null);
  const [validatingRoom, setValidatingRoom] = useState(false);
  const [roomValid, setRoomValid] = useState(null);

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  // Validate room when roomId changes
  useEffect(() => {
    if (roomId.trim() && mode === 'join') {
      validateRoomId();
    } else {
      setRoomValid(null);
    }
  }, [roomId, mode]);

  const checkApiHealth = async () => {
    try {
      await healthCheck();
      setApiHealth(true);
    } catch (error) {
      setApiHealth(false);
      toast.error('API connection failed', {
        description: 'Please check if the backend server is running'
      });
    }
  };

  const validateRoomId = async () => {
    if (!roomId.trim()) return;

    setValidatingRoom(true);
    try {
      const isValid = await validateRoom(roomId);
      setRoomValid(isValid);
    } catch (error) {
      setRoomValid(false);
    } finally {
      setValidatingRoom(false);
    }
  };

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
      toast.info('Generating authentication token...');
      const tokenData = await generateToken(displayName);

      if (!tokenData.userId || typeof tokenData.userId !== 'string') {
        throw new Error('Invalid user ID received from authentication service');
      }

      // 2. Create room
      toast.info('Creating new room...');
      const roomData = await createRoom(
        tokenData.userId,
        displayName,
        roomName || `${displayName}'s Room`
      );

      console.log('✅ Room created successfully:', roomData.roomId);

      // 3. Test room immediately
      try {
        const participants = await getRoomParticipants(roomData.roomId);
        console.log('✅ Room validation successful:', participants);
      } catch (participantError) {
        console.warn('⚠️ Room validation warning:', participantError.message);
      }

      // 4. Join call
      onJoinCall({
        userId: tokenData.userId,
        token: tokenData.token,
        displayName,
        roomId: roomData.roomId
      });

      toast.success('Room created successfully!', {
        description: `Room ID: ${roomData.roomId.substring(0, 8)}...`
      });

    } catch (error) {
      console.error('❌ Create room error:', error);
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

    if (roomValid === false) {
      toast.error('Invalid room ID', {
        description: 'Please check the room ID and try again'
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Generate token
      toast.info('Generating authentication token...');
      const tokenData = await generateToken(displayName);

      let userId = tokenData.userId;
      if (userId && typeof userId === 'object') {
        if (userId.communicationUserId) {
          userId = userId.communicationUserId;
        } else if (userId.userId) {
          userId = userId.userId;
        }
      }

      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID received from authentication service');
      }

      // 2. Validate room exists
      toast.info('Validating room...');
      const isValid = await validateRoom(roomId);
      if (!isValid) {
        throw new Error('Room not found. Please check the Room ID.');
      }

      // 3. Join room
      toast.info('Joining room...');
      const joinResult = await joinRoom(roomId, userId, displayName);
      console.log('✅ Successfully joined room:', joinResult);

      // 4. Enter call
      onJoinCall({
        userId: userId,
        token: tokenData.token,
        displayName,
        roomId
      });

      toast.success('Successfully joined the room!');

    } catch (error) {
      console.error('❌ Join room error:', error);

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

  const getRoomValidationIcon = () => {
    if (validatingRoom) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (roomValid === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (roomValid === false) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* API Health Status */}
      <div className="mb-6 flex items-center justify-center">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm ${apiHealth === true
            ? 'bg-green-100 text-green-800 border border-green-200'
            : apiHealth === false
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
          {apiHealth === true ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>API Connected</span>
            </>
          ) : apiHealth === false ? (
            <>
              <WifiOff className="h-4 w-4" />
              <span>API Disconnected</span>
            </>
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking API...</span>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-8 text-white">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <Video className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-bold mb-3">
              Join Video Conference
            </h1>
            <p className="text-blue-100 text-lg">
              Connect with others using Azure Communication Services
            </p>
          </div>
        </div>

        <div className="p-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column - Form */}
            <div className="space-y-8">
              {/* Display Name */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  <UserPlus className="inline h-4 w-4 mr-2" />
                  Your Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  disabled={loading}
                />
              </div>

              {/* Mode Selection */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode('join')}
                    className={`p-4 rounded-xl text-center transition-all duration-200 border-2 ${mode === 'join'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    <LogIn className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-semibold">Join Room</div>
                    <div className="text-sm opacity-75">Enter existing room</div>
                  </button>
                  <button
                    onClick={() => setMode('create')}
                    className={`p-4 rounded-xl text-center transition-all duration-200 border-2 ${mode === 'create'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    <Video className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-semibold">Create Room</div>
                    <div className="text-sm opacity-75">Start new meeting</div>
                  </button>
                </div>

                {/* Mode-specific inputs */}
                {mode === 'create' && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-semibold text-slate-700">
                      Room Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="e.g., Team Meeting, Daily Standup"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                )}

                {mode === 'join' && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-semibold text-slate-700">
                      Room ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter room ID"
                        className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${roomValid === false
                            ? 'border-red-300 focus:ring-red-500'
                            : roomValid === true
                              ? 'border-green-300 focus:ring-green-500'
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
                        disabled={loading}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {getRoomValidationIcon()}
                      </div>
                    </div>
                    {roomValid === false && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Room not found or invalid
                      </p>
                    )}
                    {roomValid === true && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Room found and available
                      </p>
                    )}
                    {roomId && (
                      <button
                        onClick={copyRoomId}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied!' : 'Copy Room ID'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
                disabled={
                  loading ||
                  !displayName.trim() ||
                  (mode === 'join' && (!roomId.trim() || roomValid === false)) ||
                  apiHealth === false
                }
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${mode === 'create'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl disabled:from-slate-400 disabled:to-slate-500'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl disabled:from-slate-400 disabled:to-slate-500'
                  } disabled:cursor-not-allowed disabled:shadow-none`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {mode === 'create' ? 'Creating Room...' : 'Joining Room...'}
                  </>
                ) : (
                  <>
                    {mode === 'create' ? <Video className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                    {mode === 'create' ? 'Create & Join Room' : 'Join Room'}
                  </>
                )}
              </button>

              {/* API Health Check Button */}
              <button
                onClick={checkApiHealth}
                className="w-full py-3 px-4 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Test API Connection
              </button>
            </div>

            {/* Right Column - Instructions */}
            <div className="space-y-8">
              {/* How it works */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                  <Users className="h-6 w-6 mr-3 text-blue-600" />
                  How it works
                </h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-1">Enter your name</h4>
                      <p className="text-sm text-slate-600">This is how others will see you in the call</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-1">
                        {mode === 'create' ? 'Create a new room' : 'Join with Room ID'}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {mode === 'create'
                          ? 'Start a new video call room and share the ID with others'
                          : 'Enter the Room ID provided by the meeting organizer'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-1">Join the call</h4>
                      <p className="text-sm text-slate-600">
                        Grant camera & microphone permissions when prompted
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                  <Shield className="h-6 w-6 mr-3 text-purple-600" />
                  Features
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Video className="h-4 w-4 text-blue-600" />
                    HD Video
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Users className="h-4 w-4 text-green-600" />
                    Multi-user
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Globe className="h-4 w-4 text-purple-600" />
                    Screen Share
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Clock className="h-4 w-4 text-orange-600" />
                    Real-time
                  </div>
                </div>
              </div>

              {/* Testing Instructions */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200">
                <h4 className="font-semibold text-slate-800 mb-3">Testing with multiple users</h4>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2"></div>
                    Open this page in different browsers or devices
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2"></div>
                    Use the same Room ID to join the same call
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2"></div>
                    Test audio, video, and screen sharing features
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomScreen;