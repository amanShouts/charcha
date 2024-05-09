"use client"

import { useEffect, useRef, useState } from "react"
import { GetSocketCtx } from "../SocketContext";

export default function Chat() {

  const { socketRef, name, players, setPlayers, userId } = GetSocketCtx();
  const voiceRecRef = useRef(null);

  console.log(socketRef, "--------------", name, "------------------", players);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log(msg, " recived form backend in PAGE", msg.MsgType, typeof msg.MsgType);
        if (msg.MsgType == "connect") {
          setPlayers(prev => [...msg.UserSlice]);
        }
        else if (msg.msgType == "call" && msg.userID != userId) {
          console.log(msg, " recived form backend uin caLLLLLLLLLLLLLLLLLLLLLLL");
          // const binaryData = atob(msg.data);
          // const byteArray = new Uint8Array(binaryData.length);
          // for (let i = 0; i < binaryData.length; i++) {
          //   byteArray[i] = binaryData.charCodeAt(i);
          // }
          // const arrayBuffer = byteArray.buffer;
          // let uint8Array = new TextEncoder().encode(msg.data);
          // let arrayBuffer = uint8Array.buffer;
          // Play audio chunk received from WebSocket server
          const audioContext = new AudioContext();
          audioContext.decodeAudioData(msg.data, function (buffer) {
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start();
          });
        }
        else {
          console.log("some different kind of message recicved ", msg)
        }
      };
    }
  }, [])

  const handleRecordStart = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log("getUserMedia supported -------------------");
      navigator.mediaDevices
        .getUserMedia(
          {
            audio: true,
          },
        )
        // Success callback
        .then((stream) => {
          voiceRecRef.current = new MediaRecorder(stream);

          // Create an array to store chunks of recorded audio
          let chunks = [];
          console.log(stream, " stream", chunks, " chunks", voiceRecRef.current, " voice ref")

          // Event handler when data is available
          voiceRecRef.current.ondataavailable = function (e) {
            chunks.push(e.data);
            console.log(e.data, " this data is actual one $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
            const fileReader = new FileReader();

            // Set up a callback for when the file data is loaded
            fileReader.onloadend = function () {
              // Inside this callback, 'this.result' will contain the ArrayBuffer
              const arrayBuffer = this.result;

              // Now you can convert the ArrayBuffer to a Uint8Array or perform other operations
              const byteArray = new Uint8Array(arrayBuffer);
              const byteStream = Array.from(byteArray);

              // Send the byte array over the WebSocket connection
              console.log(arrayBuffer, byteArray, byteStream, " ----------------------------------")
              const msgObj = {
                data: byteStream,
                msgType: 'call',
                userId: userId
              };

              const jsonString = JSON.stringify(msgObj);

              // Encode the JSON string as binary data (UTF-8)
              const encoder = new TextEncoder();
              const binaryData = encoder.encode(jsonString);
              socketRef.current.send(binaryData);
            };

            // Start reading the Blob as an ArrayBuffer
            if (e.data)
              fileReader.readAsArrayBuffer(e.data);
            console.log(chunks, " cunks arr ----------")
            // if (e.data) {
            //   const msgObj = {
            //     data: e.data,
            //     msgType: 'call',
            //     userId: userId
            //   }
            //   console.log(msgObj)
            //   socketRef.current.send(JSON.stringify(msgObj));
            // }
          }

          voiceRecRef.current.onstop = function (e) {
            // Combine the recorded chunks into a single Blob
            var blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });

            // Create a URL for the Blob
            var audioURL = window.URL.createObjectURL(blob);

            // Create an audio element to play back the recording
            var audio = new Audio(audioURL);
            audio.controls = true;
            document.body.appendChild(audio);
          }

          voiceRecRef.current.start(1000)
        })

        // Error callback
        .catch((err) => {
          console.error(`The following getUserMedia error occurred: ${err}`);
        });
    } else {
      console.log("getUserMedia not supported on your browser!");
    }

    console.log('Recording started');
  }

  const handleRecordStop = () => {
    if (voiceRecRef.current == null) {
      console.log("voice ref not defined");
      return;
    }
    voiceRecRef.current.stop();
  }

  return (
    <div>
      <h2>Welcome to chat</h2>
      <hr className="mt-2 mb-2"></hr>

      <div className="bg-slate-700 flex justify-center items-center gap-2">
        {/* <p>{name}</p> */}
        {players.length > 0 && players.map((elem, index) => (
          <p key={index} className="px-4 py-2 bg-slate-200 text-slate-700 rounded">
            {elem.username}
          </p>
        ))}
      </div>

      <div className="flex justify-center items-center mt-16 gap-8">
        <input type="button" value={"Start"} className="p-4 bg-slate-200 text-slate-800" onClick={handleRecordStart} />
        <input type="button" value={"Stop"} className="p-4 bg-slate-200 text-slate-800" onClick={handleRecordStop} />
      </div>
    </div>
  )
}