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
    while (Users[i][attribute] !== value || (Users.length < i)) {
        i++;
    }
    if (Users.length < i) { return false; }
    let user = {
        data: Users[i],
        index: i
    }
    return user;
}

// search for users of given attribute name and value, returns list of users
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

    socket.on('user typing', function (msg) {
        let user = getUserByAnything("nickname", msg);
        Users[user.index].typing = true;
        socket.broadcast.emit('user typing', msg);
        console.log("user " + msg + " is typing");
    });

    socket.on('user not typing', function (msg) {
        let user = getUserByAnything("nickname", msg);
        Users[user.index].typing = false;
        socket.broadcast.emit('user not typing', msg);
        console.log("user " + msg + " ended typing");
    });


    socket.on('chat message', function (msg) {
        socket.broadcast.emit('chat message', msg);
    });

    socket.on('disconnect', function () {
        let i = 0;
        let user = getUserByAnything("socketid", socket.id);
        Users.splice(user.index, 1);
        io.emit('chat message', "User " + user.data.nickname + " has left the chat!");
        io.emit('user not typing', user.data.nickname);
        console.log("User " + user.data.nickname + " has left the chat!");
    });
});

http.listen(PORT, function () {
    console.log('listening on *:' + PORT);
});