const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let waitingUser = null;

io.on('connection', (socket) => {
    // --- تحديث عدد المتصلين فور دخول أي شخص ---
    io.emit('online_count', io.engine.clientsCount);

    socket.on('find_partner', () => {
        if (waitingUser && waitingUser !== socket) {
            const roomName = 'room_' + socket.id;
            socket.join(roomName);
            waitingUser.join(roomName);
            
            io.to(roomName).emit('chat_start', 'Stranger joined the chat. Say hi!');
            
            socket.partnerRoom = roomName;
            waitingUser.partnerRoom = roomName;
            waitingUser = null;
        } else {
            waitingUser = socket;
            socket.emit('waiting', 'Waiting for a stranger to connect...');
        }
    });

    socket.on('send_message', (msg) => {
        if (socket.partnerRoom) {
            socket.to(socket.partnerRoom).emit('receive_message', msg);
        }
    });

    socket.on('typing', () => {
        if (socket.partnerRoom) socket.to(socket.partnerRoom).emit('partner_typing');
    });

    socket.on('stop_typing', () => {
        if (socket.partnerRoom) socket.to(socket.partnerRoom).emit('partner_stop_typing');
    });

    socket.on('seen', () => {
        if (socket.partnerRoom) socket.to(socket.partnerRoom).emit('partner_seen');
    });

    socket.on('skip', () => {
        if (socket.partnerRoom) {
            socket.to(socket.partnerRoom).emit('partner_left');
            socket.leave(socket.partnerRoom);
            socket.partnerRoom = null;
        } else if (waitingUser === socket) {
            waitingUser = null;
        }
    });

    socket.on('disconnect', () => {
        // --- تحديث عدد المتصلين فور خروج أي شخص ---
        io.emit('online_count', io.engine.clientsCount);

        if (socket.partnerRoom) {
            socket.to(socket.partnerRoom).emit('partner_left');
        } else if (waitingUser === socket) {
            waitingUser = null;
        }
    });
});

http.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});