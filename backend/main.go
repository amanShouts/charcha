package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// map[*Client]bool

type User struct {
	Name    string `json:"username"`
	Id      string `json:"userID"`
	MsgType string `json:"msgType"`
	Data    []byte `json:"data"`
}

// ClientList is a map used to help manage a map of clients
// type ConnMap map[*websocket.Conn]User
var userSlice []User

type UserMsg struct {
	UserSlice []User
	MsgType   string
}

type ConnMap struct {
	sync.RWMutex
	connections map[string]*websocket.Conn
}

// var myConnMap ConnMap = make(ConnMap)
var myConnMap = ConnMap{connections: make(map[string]*websocket.Conn)}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all connections by returning true
		return true
	},
}

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "hello\n")
}

func writeToMap(user User, conn *websocket.Conn) {
	myConnMap.Lock()
	defer myConnMap.Unlock()
	myConnMap.connections[user.Id+"-"+user.Name] = conn
}

func broadcast(messageType int, welcomeUserJson []byte) {
	for connKey, connValue := range myConnMap.connections {
		log.Println("Sending message to:", connKey)
		if err := connValue.WriteMessage(messageType, welcomeUserJson); err != nil {
			log.Println("Write message error:", err)
			// Continue sending messages to other clients
			continue
		}
	}
}
func handleClient(conn *websocket.Conn) {
	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println("read message", err)
			return
		}
		text := string(p)
		fmt.Println(p, messageType, "message recived ------------", text)

		var user User
		err = json.Unmarshal(p, &user)
		if err != nil {
			log.Println("JSON:", err)
			return
		}

		fmt.Println(user, " after before changing", user.MsgType, " ------------------")

		if user.MsgType == "handshake" {
			writeToMap(user, conn)
			userSlice = append(userSlice, user)
			log.Printf("Received Message: %+v", user)
			user.MsgType = "connect"
			fmt.Println(user, " after changing msgtype")

			var welcomeUserMsg UserMsg = UserMsg{
				UserSlice: userSlice,
				MsgType:   "connect",
			}

			welcomeUserJson, err := json.Marshal(welcomeUserMsg)
			if err != nil {
				fmt.Println("Error marshaling user:", err)
				return
			}
			fmt.Println(welcomeUserJson, " userarray")
			broadcast(messageType, welcomeUserJson)
		} else if user.MsgType == "call" {
			fmt.Println(user, " inside callllllllllllllllllllll")
			user.MsgType = "call"
			// var newUserMsg = user
			welcomeUserJson, err := json.Marshal(user)
			if err != nil {
				fmt.Println("Error marshaling user:", err)
				return
			}
			fmt.Println(welcomeUserJson, " userarray============================================", user.Data, user)
			broadcast(messageType, welcomeUserJson)
		}

	}
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println(" connections ---------------", myConnMap.connections)

	conn, err := upgrader.Upgrade(w, r, nil)
	// fmt.Printf("%+v", conn)
	connId := uuid.New().String()
	fmt.Println(connId, " connID")

	if err != nil {
		log.Println(err, " 111")
		return
	}
	// myConnMap[conn] = true
	// fmt.Println(" connections ---------------", myConnMap.connections, " after")

	go handleClient(conn)
}

func main() {
	http.HandleFunc("/", handler)
	http.HandleFunc("/ws", wsHandler)

	fmt.Println("Server started on http://localhost:8080/")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Println("ListenAndServe error:", err)
	}
}
