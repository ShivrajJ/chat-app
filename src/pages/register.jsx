import {React, useState} from "react"

export default function Register({socket, setRegister}) {
    const [usernameExists, setUsernameExists] = useState(false);
    function handleRegistration(e) {
        e.preventDefault();
        const username = document.getElementsByName("username")[0];
        const password = document.getElementsByName("password")[0];
        console.log(username.value);
        console.log(password.value);
        socket.on('registrationSuccess', onRegister);
        socket.on('registrationFailure', onFailure);
        socket.on('existingUsername', () => {setUsernameExists(true)})
        socket.emit('register', username.value, password.value);
    }
    function onRegister() {
        alert("Registration Successful! Redirecting back to Login page in a few seconds...");
        setUsernameExists(false);
        socket.off('registrationSuccess', onRegister);
        socket.off('registrationFailure', onFailure);
        socket.off('existingUsername', () => {setUsernameExists(true)});
        setTimeout(()=>{setRegister(false)}, 4000);
    }
    function onFailure() {
        alert("Registration Unsuccessful...");
    }
    return (
        <>
            <form onSubmit={handleRegistration}>
                <input type="text" name="username" placeholder="Username"></input><br></br>
                <input type="password" name="password" placeholder="Password"></input><br></br>
                <button type="submit">Register</button>
            </form>
            {usernameExists ? <p style={{color:"red"}}>Username already exists!</p>:null}
        </>
    )
}