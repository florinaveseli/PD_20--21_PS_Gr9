const express = require('express');
const app = express();
let randomColor = require('randomcolor');


//Disable x-powered-by header
app.disable('x-powered-by')

//middlewares

const dotenv = require('dotenv');
const cors = require("cors");
const uuid = require('uuid');

const corsOpts = {
    origin: '*',

    methods: [
        'GET',
        'POST',
    ],

    allowedHeaders: [
        'Content-Type',
    ],
};

app.use(cors(corsOpts))

dotenv.config();
const router = require("./routes");

app.use("/api/", router);
app.use(express.static('client'));



//routes
app.get('/', (req,res)=>{
    res.sendFile(__dirname + '/client/index.html');
});


//routes
app.get('/login', (req,res)=>{
    res.sendFile(__dirname + '/views/login.html');
});

app.get('/carRental.html', (req,res)=>{
    res.sendFile(__dirname + '/views/carRental.html');
});

app.get('/main.html', (req,res)=>{
    res.sendFile(__dirname + '/main.html');
});

//Listen on port 5000
server = app.listen( process.env.PORT || 3000);

//socket.io instantiation
const io = require("socket.io")(server);

let users = [];
let connnections = [];

//listen on every connection


io.on('connection', (socket) => {
    console.log('New user connected');
    connnections.push(socket)
    //initialize a random color for the socket
    let color = randomColor();

    socket.username = 'Anonymous';
    socket.color = color;

    //listen on change_username
    socket.on('change_username', data => {
        let id = uuid.v4(); // create a random id for the user
        socket.id = id;
        socket.username = data.nickName;
        users.push({id, username: socket.username, color: socket.color});
        updateUsernames();
    })

    //update Usernames in the client
    const updateUsernames = () => {
        io.sockets.emit('get users',users)
    }

    //listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        io.sockets.emit('new_message', {message : data.message, username : socket.username,color: socket.color});
    })



    //listen on typing
    socket.on('typing', data => {
        socket.broadcast.emit('typing',{username: socket.username})
    })

    //Disconnect
    socket.on('disconnect', data => {

        if(!socket.username)
            return;
        //find the user and delete from the users list
        let user = undefined;
        for(let i= 0;i<users.length;i++){
            if(users[i].id === socket.id){
                user = users[i];
                break;
            }
        }
        users = users.filter( x => x !== user);
        //Update the users list
        updateUsernames();
        connnections.splice(connnections.indexOf(socket),1);
    })
})
