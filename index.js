// server init
let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
const path = require('path');

// serve index.html
const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

app.get('/', function (req, res) {
    res.sendFile(INDEX);
});

// users list
let Users = [];

// search for user of given attribute name and value, returns user data and index
function getUserByAnything(attribute, value) {
    let i = 0;
    if (Users.length <= i) { return false; }
    while (Users[i][attribute] !== value || (Users.length <= i)) {
        i++;
        if (Users.length <= i) { return false; }
    }
    if (Users.length <= i) { return false; }
    let user = {
        data: Users[i],
        index: i
    }
    return user;
}

// search for users of given attribute name and value, returns list of users attributes
function getUsersListByAnything(attribute, getattribute, value) {
    let i = 0;
    let usersList = [];
    for (i = 0; i < Users.length; i++) {
        if (Users[i][attribute] == value) {
            usersList.push(Users[i][getattribute]);
        }
    }
    return usersList;
}

// on user connected
io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('check nickname', function (msg, fn) {
        let isNicknameFree = true;
        console.log(isNicknameFree);

        if (getUserByAnything("nickname", msg) == false) {
            isNicknameFree = true;
            console.log(isNicknameFree);
        } else {
            isNicknameFree = false;
        }
        console.log(isNicknameFree);
        fn(isNicknameFree);
    });

    // on user connected
    socket.on('new user', function (msg) {
        let user = {
            socketid: socket.id,
            nickname: msg,
            typing: false
        }
        // add user to list
        Users.push(user);

        // get currently typing users
        let typingUsers = getUsersListByAnything("typing", "nickname", true);
        if (typingUsers !== null) {
            socket.emit('typing users', typingUsers);
        }

        // new user announce
        io.emit('chat message', "User " + msg + " has joined the chat!");
        console.log("User " + msg + " has joined the chat!");
    });

    // on any user starts typing
    socket.on('user typing', function (msg) {
        let user = getUserByAnything("nickname", msg);
        Users[user.index].typing = true;
        // send message to other users
        socket.broadcast.emit('user typing', msg);
        console.log("user " + msg + " is typing");
    });

    // on any user ends typing
    socket.on('user not typing', function (msg) {
        let user = getUserByAnything("nickname", msg);
        Users[user.index].typing = false;
        // send message to other users
        socket.broadcast.emit('user not typing', msg);
        console.log("user " + msg + " ended typing");
    });

    // on received chat message
    socket.on('chat message', function (msg) {
        // send message to other users
        socket.broadcast.emit('chat message', msg);
    });

    // on user disconnected
    socket.on('disconnect', function () {
        let user = getUserByAnything("socketid", socket.id);
        if (user !== false) {
            Users.splice(user.index, 1);
            io.emit('chat message', "User " + user.data.nickname + " has left the chat!");
            io.emit('user not typing', user.data.nickname);
            console.log("User " + user.data.nickname + " has left the chat!");
        }
    });
});

http.listen(PORT, function () {
    console.log('listening on *:' + PORT);
});