import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import JoinRoomScreen from './components/JoinRoomScreen';
import CallScreen from './components/CallScreen';
import { Video, Users, Settings } from 'lucide-react';
import { listAllRooms, testRoomId } from './services/api';

function App() {
  const [callState, setCallState] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155'
          }
        }}
      />

      {!callState ? (
        <>
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    ACS Group Call
                  </h1>
                  <p className="text-sm text-slate-500">Azure Communication Services</p>
                </div>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Debug</span>
                </button>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 py-8">
            <JoinRoomScreen onJoinCall={handleJoinCall} />
          </main>

          {/* Debug Panel */}
          {process.env.NODE_ENV === 'development' && showDebug && (
            <div className="fixed bottom-4 right-4 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-6 z-50">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Debug Panel
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Test Room ID
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={debugRoomId}
                      onChange={(e) => setDebugRoomId(e.target.value)}
                      placeholder="Enter room ID to test"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleTestRoomId}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Test
                    </button>
                  </div>
                  <button
                    onClick={handleListAllRooms}
                    className="mt-2 w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    List All Rooms
                  </button>
                </div>

                {debugResult && (
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <h4 className="font-medium mb-2 text-slate-800">Test Results:</h4>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {JSON.stringify(debugResult, null, 2)}
                    </pre>
                  </div>
                )}

                {allRooms.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <h4 className="font-medium mb-2 text-slate-800">All Rooms ({allRooms.length}):</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {allRooms.map((room, index) => (
                        <div key={index} className="text-sm p-2 bg-white rounded border">
                          <div className="font-mono text-xs break-all">{room.id}</div>
                          <div className="text-slate-600 text-xs">
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

          {/* Footer */}
          <footer className="mt-auto border-t bg-white/50 backdrop-blur-sm py-8">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-sm text-slate-600">
                Azure Communication Services Group Call • Production Ready Demo
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Multiple users can join the same room from different browsers
              </p>
            </div>
          </footer>
        </>
      ) : (
        <CallScreen
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