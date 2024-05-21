import express from 'express';
import {createServer} from 'node:https';
import fs from 'fs';
import {Server} from 'socket.io';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {MongoClient} from 'mongodb';
import { fileURLToPath } from 'node:url';

const uri = "mongodb://127.0.0.1:27017/";
const client = new MongoClient(uri);

async function getUserPasswordHash(user) {
    const db = client.db("chat-app");
    const table = db.collection("users");
    console.log("Connection to Database successful...");
    // console.log(table.dbName);
    console.log(user);
    const query = {username:user};
    const result = await table.find(query).toArray();
    if(result.length == 0) {
        throw Error("User Not Found!");
    }
    const passwordHash = result[0].password;
    const rooms = result[0].rooms;
    return [passwordHash, rooms];
}

async function getRooms(username) {
    const db = client.db("chat-app");
    const table = db.collection("users");
    console.log("Connection to Database successful...");
    console.log(username);
    const query = {username:username};
    const result = await table.find(query).toArray();
    if(result.length == 0) {
        throw Error("User Not Found!");
    }
    const rooms = result[0].rooms;
    return rooms;
}

async function addPrivateRoom(room, first, second) {
    const db = client.db("chat-app");
    const table = db.collection("users");
    const filter = {$or:[{username:first}, {username:second}]};
    const updateDoc = {$addToSet: {rooms:room}};
    const result = await table.updateMany(filter, updateDoc);
}

async function registerNewUser(username, password) {
    const db = client.db("chat-app");
    const table = db.collection("users");
    console.log("Connection to the Database successful");
    var query = {username:username};
    var result = await table.find(query).toArray();
    if(result.length > 0) {
        throw Error("Username Already Exists!");
    }
    var passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync());
    query = {username:username, password:passwordHash};
    result = await table.insertOne(query);
    if(result.insertedId) {
        console.log(`User Registered with ID: ${result.insertedId}`);
    } else {
        throw Error("Registration Failed...");
    }
}

async function insertMessage(room, user, message) {
    const db = client.db("chat-app");
    const table = db.collection("dev");

    const query = {user:user, message:message, timestamp:new Date(), room:room};
    const result = await table.insertOne(query);
    console.log(`document inserted with _id: ${result.insertedId}`);
}

async function readMessages(room, index) {
    const db = client.db("chat-app");
    const table = db.collection("dev");
    
    const query = {room:room};
    const projection = {user:1, message:1};
    const result = await table.find(query).project(projection).skip(index).limit(20).toArray();
    return result;
}

const app = express();
const server = createServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem")
}, app);
const io = new Server(server, {
    cors: {
        origin:['http://127.0.0.1:5173', 'http://localhost:5173']
    }
});

app.get('/', (req, res) => {
    res.sendFile(fileURLToPath(new URL('./server.html', import.meta.url)));
});

io.on('connection', (socket) => {
    console.log('a user connected: ' + socket.id);
    socket.on('loginToken', (token, username) => {
        console.log("JWT-based Auth...");
        jwt.verify(token, fs.readFileSync("key.pem"), (err, decoded) => {
            if(err){
                console.log(err);
                return socket.emit("AuthError", {message: "AuthError"});
            }
            socket.decoded = decoded;
            socket.username = username;
            getRooms(username).then((r) => {
                socket.join(r);
                socket.emit('loginSuccess', r);
                io.in(r).emit('newUser', [username], false);
            });
        })
    })
    socket.on('loginPass', (username, password) => {
        console.log("Authenticating...");
        getUserPasswordHash(username).then(([h, r]) => {
            const result = bcrypt.compareSync(password, h);
            if(result) {
                const token = jwt.sign("password", fs.readFileSync("key.pem"), {algorithm:'RS256'});
                socket.emit("token", token);
                socket.username = username;
                socket.join(r);
                socket.emit('loginSuccess', r);
                io.in(r).emit('newUser', [username], false);
            }
            else socket.emit("AuthError", {message: "AuthError"});
        }).catch((err) => {
            console.log(err);
            socket.emit("AuthError", {message: "AuthError"});
        });
    });
    socket.on('register', (username, password) => {
        console.log("Registering...");
        registerNewUser(username, password).then(() => {
            console.log("Registration Successful!");
            socket.join(["general", "sports"]);
            socket.emit('registrationSuccess');
        }).catch((err) => {
            if(err.message == "Username Already Exists!") {
                socket.emit("existingUsername");
            } else {
                socket.emit("registrationFailure");
            }
        });
    });
    socket.on('disconnecting', () => {
        console.log([...socket.rooms.keys()]);
        io.in([...socket.rooms.keys()]).emit('removeUser', socket.username);
    })
    socket.on('disconnect', () => {
        console.log('a user disconnected: ' + socket.username);
    });
    socket.on('requestMessages', (room, index) => {
        readMessages(room, index).then((messages) => {
            socket.emit("loadedMessages", messages, true);
        });
    });  
    socket.on('requestUsers', (room) => {
        io.sockets.in(room).fetchSockets().then((users) => {
            const usernames = [];
            // console.log("USERS");
            // console.log(users);
            for(const user of users) {
                // console.log(user);
                usernames.push(user.username);
            }
            // console.log(usernames);
            socket.emit("loadedUsers", usernames, true);
        });
    });
    socket.on('joinNewRoom', () => {
        getRooms(socket.username).then((rooms)=> {
            socket.join(rooms);
        })
    })
    socket.on('newPrivateRoom', (first, second) => {
        console.log(first);
        console.log(second);
        if(first > second) {
            var temp = first;
            first = second;
            second = temp;
        }
        var room = `${first}-${second}`;
        addPrivateRoom(room, first, second).then(() => {
            io.sockets.fetchSockets().then((users) => {
                for(const user of users) {
                    if(user.username == first || user.username == second) {
                        user.emit("joinNewRoom", [room]);
                    }
                }
            })
        })
    });  
    socket.on('messageFromClient', (message, room) => {
        insertMessage(room, socket.username, message);
        io.in(room).emit('newMessage', [{user:socket.username, message:message, room:room}], false);
    });
});
server.listen(3000, () => {
    console.log("Server running at https://localhost:3000");
});