import React, {useRef, useState, useEffect} from 'react'
import Messages from './messages.jsx'
import Users from './users.jsx'
import notifSound from './assets/notif.wav'
// import {getMessages} from 'getMessages.jsx'

export default function Chat({socket, rooms, setRooms, onLogout}) {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeRoom, setActiveRoom] = useState("general");
    var newMessageRooms = {};
    rooms.forEach((room) => {newMessageRooms[room] = false;});
    function updateMessages(newMessages, initial) {
        if(initial) setMessages([...newMessages])
        else setMessages([...messages, ...newMessages]);
    }
    function playNotification(newMessage, initial) {
        if(newMessage[0].user != socket.username) {
            const audio = new Audio(notifSound);
            audio.play();
            // console.log(newMessage[0].room);
            var room = newMessage[0].room;
            newMessageRooms[room] = true;
            console.log(newMessageRooms);
        }
    }
    function updateUsers(newUsers, initial) {
        if(initial) setUsers([...newUsers])
        else if(!(newUsers in users)) setUsers([...users, ...newUsers]);
    }
    function removeUser(user) {
        console.log(`remove user ${user}`);
        console.log(users);
        console.log([...users.toSpliced(users.indexOf(user),1)]);
        setUsers([...users.toSpliced(users.indexOf(user),1)]);
    }
    function createPrivateRoom(name) {
        if(name!=socket.username) socket.emit('newPrivateRoom', name, socket.username);
    }
    function onNewRoom(r) {
        console.log(rooms);
        if(!rooms.includes(r[0])) {
            setRooms([...rooms, ...r]);
            newMessageRooms.r = false;
        }
    }
    useEffect(() => {
        socket.on('loadedMessages', updateMessages);
        socket.on('newMessage', updateMessages);
        socket.on('newMessage', playNotification);
        // socket.on('disconnect', () => {setMessages([])});
        return () => {
            socket.off("loadedMessages", updateMessages);
            socket.off('newMessage', updateMessages);
            // socket.off('disconnect', () => {setMessages([])});
        }
    }, [messages])
    useEffect(() => {
        socket.on('loadedUsers', updateUsers);
        socket.on('newUser', updateUsers);
        socket.on('removeUser', removeUser);
        // socket.on('disconnect', () => {setMessages([])});
        return () => {
            socket.off("loadedUsers", updateUsers);
            socket.off('newUser', updateUsers);
            socket.off('removeUser', removeUser);
            // socket.off('disconnect', () => {setMessages([])});
        }
    }, [users])
    useEffect(() => {
        socket.emit("requestMessages", activeRoom, 0);
        socket.emit("requestUsers", activeRoom);
    }, [activeRoom])
    useEffect(() => {
        socket.on('joinNewRoom', onNewRoom);
        return(() => {
            socket.off('joinNewRoom', onNewRoom);
        })
    })
    function sendMessage(e) {
        e.preventDefault();
        const input = document.getElementsByName("message")[0];
        const message = input.value;
        socket.emit('messageFromClient', message, activeRoom);
        input.value = "";
    }
    return(
        <div className="chat-div">
            <div className='rooms-div'>
                {rooms.map((roomName, idx) => {
                    console.log(newMessageRooms[roomName]);
                    return(
                        <div className={roomName == activeRoom ? 'room-tab active-room-tab' : (newMessageRooms[roomName] ? 'room-tab notif-tab' : 'room-tab')}>
                            <button className='room-button' onClick={() => {setActiveRoom(roomName); newMessageRooms[roomName] = false;}}>
                                {roomName}
                            </button>
                        </div>
                    )
                })}
                <div>
                    <p>Logged in as: {socket.username}</p>
                    <button onClick={onLogout}>Log Out</button>
                </div>
            </div>
            <div className='messages-div'>
                <div className='messages-list-div'>
                    <ul className="messages-list">
                        <Messages messages={messages}/>
                    </ul>
                </div>
                <div>
                    <form id="form" action="" onSubmit={sendMessage}>
                        <input id="input" name="message" autoComplete="off" /><button type="submit">Send</button>
                    </form>
                </div>
            </div>
            <div className='users-div'>
                <Users users={users} createPrivateRoom={createPrivateRoom}/>
            </div>
        </div>
    );
}