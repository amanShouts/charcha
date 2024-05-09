"use client"

const { useContext, createContext, useRef, useState } = require("react")

export const SocketCtx = createContext(null);

export function SocketContextProvider({ children }) {

  const socketRef = useRef(null);
  const [name, setName] = useState('');
  const [players, setPlayers] = useState([]);
  const [userId, setUserId] = useState(null);

  return (
    <SocketCtx.Provider
      value={{
        socketRef: socketRef,
        name: name, 
        setName : setName,
        players: players,
        setPlayers: setPlayers,
        userId : userId,
        setUserId, setUserId
      }}
    >
      {children}
    </SocketCtx.Provider>
  )
}

export function GetSocketCtx() {
  return useContext(SocketCtx);
}
