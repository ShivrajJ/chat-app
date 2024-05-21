import React from "react";

export default function Login({socket, invalidPassword}) {
    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementsByName("username")[0];
        const password = document.getElementsByName("password")[0];
        // socket.auth.username = username.value;
        // socket.auth.password = password.value;
        // console.log(socket.auth);
        socket.on('loginSuccess', (rooms) => {postLogin(username)});
        console.log(socket.emit('loginPass', username.value, password.value));
        console.log("After calling connect...");
    }
    async function postLogin(username) {
        sessionStorage.setItem("username", username.value);
        socket.username = username.value;
        socket.off('loginSuccess');
    }
    return(
        <div className="login-div">
            <form onSubmit={handleLogin} className="login-form">
                <input type="text" name="username" placeholder="Username"></input><br></br>
                <input type="password" name="password" placeholder="Password"></input><br></br>
                <button type="submit">Login</button>
                {invalidPassword ? <p style={{color:'red'}} className="register-text"> User Credentials Invalid!</p>:null}
            </form>
        </div>
    )
}