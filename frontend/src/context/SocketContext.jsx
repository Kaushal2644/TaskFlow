import { createContext, useState, useEffect, useContext } from "react";
import { io } from 'socket.io-client';
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({children}) => {
  const {user} = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if(!user) return;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected:', newSocket.id);
      // Join personal room for notifications
      newSocket.emit('join', user._id);
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{socket}}>
      {children}
    </SocketContext.Provider>
  )
};

export const useSocket = () => {
  return useContext(SocketContext);
}

export default SocketContext;