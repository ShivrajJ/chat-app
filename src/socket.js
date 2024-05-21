import {io} from 'socket.io-client';

// const URL = process.env.NODE_ENV == 'production' ? undefined : 'https://localhost:3000';
const URL = 'https://localhost:3000';
const token = sessionStorage.getItem("token");
const username = sessionStorage.getItem("username");

export let socket;
if(token) {
    socket = io(URL, {
        autoConnect: true,
        // auth : {token},
        // query:{username:username},
    });
} else {
    socket = io(URL, {
        autoConnect: false
    });
}