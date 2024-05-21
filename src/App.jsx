import { useEffect, useState } from 'react'
import Chat from './chat.jsx'
import Login from './login.jsx'
import Register from './pages/register.jsx'
import {socket} from './socket.js'
import './App.css'

function App() {
  const username = sessionStorage.getItem("username");
  const token = sessionStorage.getItem("token");
  const [isLoggedIn, setIsLoggedIn] = useState(token?true:false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [register, setRegister] = useState(false);
  const [rooms, setRooms] = useState([]);
  function onLogout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    setIsLoggedIn(false);
  }
  useEffect(()=>{
    function onConnect() {
      console.log("Connected");
    }
    function onDisconnect() {
      console.log("Disconnected");
    }
    function storeToken(token) {
      console.log("TOKEN!");
      sessionStorage.setItem("token", token);
      setIsLoggedIn(true);
      setInvalidPassword(false);
    }
    function onLogin(r) {
      setIsLoggedIn(true);
      socket.username = username;
      setRooms(r);
    }
    function onError(err) {
      console.log(err);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('username');
      if(err.message == "AuthError") {
        setInvalidPassword(true)
      }
    }
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('token', storeToken);
    socket.on('loginSuccess', onLogin);
    socket.on('connect_error', onError);
    socket.on('AuthError', onError);
    if(token && username) {
      socket.emit("loginToken", token, username);
    } else {
      socket.connect();
    }
    return ()=> {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('token', storeToken);
      socket.off('loginSuccess', onLogin);
      socket.off('connect_error', onError);
      socket.off('AuthError', onError);
    }
  }, [socket]);

  if(isLoggedIn) {
    return (
      <>
        {/* <ConnectionManager isConnected={isConnected} socket={socket}/> */}
        <Chat socket={socket} rooms={rooms} setRooms={setRooms} onLogout={onLogout}/>   
      </>
    )
  } else if(!register) {
    return(
      <div>
        <Login socket={socket} invalidPassword={invalidPassword}/>
        <a onClick={() => {setRegister(true)}}><p>Create an account</p></a>
      </div>
    )
  } else {
    return(
      <div>
        <Register socket={socket} setRegister={setRegister}/>
        <a onClick={() => {setRegister(false)}}><p>Already have an account? Login.</p></a>
      </div>
    )
  }
}

export default App;