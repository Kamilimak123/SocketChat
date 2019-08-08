let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

app.get('/', function (req, res) {
    res.sendFile(INDEX);
});

let Users = [];

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('new user', function (msg) {
        let user = {
            socketid: socket.id,
            nickname: msg
        }
        Users.push(user);
        io.emit('chat message', "User " + msg + " has joined the chat!");
    });

    socket.on('chat message', function (msg) {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', function () {
        let i = 0;
        while(Users[i].socketid !== socket.id){
            i++;
        }
        io.emit('chat message', "User " + Users[i].nickname + " has left the chat!");
        console.log('user disconnected');
    });
});

http.listen(PORT, function () {
    console.log('listening on *:' + PORT);
});