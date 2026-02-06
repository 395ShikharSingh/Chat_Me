import { AuthProvider, useAuth } from "./context/AuthContext";
import { useWebSocket } from "./hooks/useWebSocket";
import { AuthForm } from "./components/AuthForm";
import { RoomsList } from "./components/RoomsList";
import { ChatWindow } from "./components/ChatWindow";

function ChatApp() {
  const { isAuthenticated, token } = useAuth();
  const {
    messages,
    notifications,
    isConnected,
    currentRoomId,
    joinRoom,
    leaveRoom,
    sendMessage,
  } = useWebSocket(token);

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <RoomsList
        onJoinRoom={joinRoom}
        currentRoomId={currentRoomId}
        isConnected={isConnected}
      />
      <ChatWindow
        messages={messages}
        notifications={notifications}
        currentRoomId={currentRoomId}
        onSendMessage={sendMessage}
        onLeaveRoom={leaveRoom}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
}

export default App;
