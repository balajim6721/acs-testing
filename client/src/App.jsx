import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import JoinRoomScreen from './components/JoinRoomScreen';
import CallScreen from './components/CallScreen';
import { Video, Users } from 'lucide-react';
import { listAllRooms, testRoomId } from './services/api';

function App() {
  const [callState, setCallState] = useState(null);

  const [debugRoomId, setDebugRoomId] = useState('');
  const [debugResult, setDebugResult] = useState(null);
  const [allRooms, setAllRooms] = useState([]);

  const handleTestRoomId = async () => {
    if (!debugRoomId.trim()) return;

    try {
      const result = await testRoomId(debugRoomId);
      setDebugResult(result);
      toast.success('Room test completed');
    } catch (error) {
      toast.error('Room test failed');
    }
  };

  const handleListAllRooms = async () => {
    try {
      const rooms = await listAllRooms();
      setAllRooms(rooms.rooms);
      toast.success(`Found ${rooms.count} rooms`);
    } catch (error) {
      toast.error('Failed to list rooms');
    }
  };

  const handleJoinCall = (callDetails) => {
    setCallState(callDetails);
    toast.success('Joining room...', {
      description: `Room: ${callDetails.roomId}`
    });
  };

  const handleLeaveCall = () => {
    setCallState(null);
    toast.info('Left the room');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Video className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ACS Group Call</h1>
              <p className="text-sm text-gray-500">Azure Communication Services POC</p>
            </div>
          </div>
          {callState && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium">{callState.displayName}</span>
              </div>
              <div className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                Room: {callState.roomId.substring(0, 8)}...
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!callState ? (
          <JoinRoomScreen onJoinCall={handleJoinCall} />
        ) : (
          <CallScreen
            userId={callState.userId}
            token={callState.token}
            displayName={callState.displayName}
            roomId={callState.roomId}
            onLeaveCall={handleLeaveCall}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>Azure Communication Services Group Call POC • For demonstration purposes only</p>
          <p className="mt-1">Multiple users can join the same room from different browsers</p>
        </div>
      </footer>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Debug Panel</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-yellow-700 mb-2">
                Test Room ID
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={debugRoomId}
                  onChange={(e) => setDebugRoomId(e.target.value)}
                  placeholder="Enter room ID to test"
                  className="flex-1 px-3 py-2 border border-yellow-300 rounded"
                />
                <button
                  onClick={handleTestRoomId}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Test
                </button>
                <button
                  onClick={handleListAllRooms}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  List All Rooms
                </button>
              </div>
            </div>

            {debugResult && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium mb-2">Test Results:</h4>
                <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(debugResult, null, 2)}
                </pre>
              </div>
            )}

            {allRooms.length > 0 && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium mb-2">All Rooms ({allRooms.length}):</h4>
                <div className="space-y-2">
                  {allRooms.map((room, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="font-mono">{room.id}</div>
                      <div className="text-gray-600 text-xs">
                        Valid: {new Date(room.validFrom).toLocaleTimeString()} - {new Date(room.validUntil).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;