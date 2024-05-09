"use client"

import Image from "next/image";
import { useState } from "react";
import { GetSocketCtx, SocketContextProvider } from "./SocketContext";
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from "next/navigation";

export default function Home() {

  const [error, setError] = useState(false);
  const [username, setUsername] = useState('')
  const { socketRef, name, setName, setPlayers, setUserId } = GetSocketCtx();
  const router = useRouter();

  const handleSubmit = () => {
    // take nname and start a web socket connections 
    // and navigate to next page
    setName(username);
    socketRef.current = new WebSocket("ws://localhost:8080/ws");
    console.log(socketRef.current, " current socket");

    socketRef.current.onopen = (event) => {
      console.log("creating socket conn")
      const userId = uuidv4();
      setUserId(prev => userId)
      const userObj = {
        username: username,
        userID: userId,
        msgType: 'handshake'
      }

      socketRef.current.send(JSON.stringify(userObj));
    };

    socketRef.current.onmessage = (event) => {
      const users = JSON.parse(event.data);
      console.log(users, " recived form backend", typeof users);

      if (users.MsgType == 'connect') {
        setPlayers(prev => ([...users.UserSlice]));
        router.push("/chat")
      }
      else {
        setError(true);
      }
    };

    setUsername('');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">

      <div className="m-auto flex gap-4 items-center justify-center">
        <input placeholder="name" value={username} onChange={(e) => setUsername(e.target.value)} className="text-slate-800" />
        <button onClick={handleSubmit}>Submit</button>
        {error ? <p> Error in connecting to Socket backend</p> : ''}
      </div>

    </main>
  );
}
