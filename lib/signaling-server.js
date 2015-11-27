/*global console*/
var socket = require('socket.io'),
    _ = require('lodash');

var maxClientsPerRoom = 5;

var handleClient = function (io) {
    var describeRoom = function (name) {
        return {
            clients: _.reduce(io.sockets.clients(name), function (result, client) {
                result[client.id] = client.resources;
                return result;
            }, {})
        };
    },

    slotsAvialable = function (name, client) {
        if (io.sockets.clients(name).length === maxClientsPerRoom) {
            return false;
        }

        return true;
    };

    return function (client) {
        var leaveRooms = function () {
            if (client.room) {
                io.sockets.in(client.room).emit('remove', {
                    id: client.id
                });

                client.leave(client.room);
                client.room = undefined;
                console.log('Client ' + client.id + ' disconnected');
            }
        };

        client.resources = {
            screen: false,
            video: true,
            audio: false
        };

        client.on('message', function (details) {
            var otherClient;
            if (!details) return;

            otherClient = io.sockets.sockets[details.to];
            if (!otherClient) return;

            otherClient.emit('message', _.merge({
                from: client.id
            }, details));
        });

        client.on('join', function (name, cb) {
            var clientSocket = io.sockets.sockets[client.id];
            cb = cb || new Function;

            // sanity check
            if (typeof name !== 'string') return;

            // Check if there is space left in the room
            if (slotsAvialable(name, client) === false) {
                client.emit('noSlotsAvailable', {
                    title: 'No seats left',
                    message: 'Room already has 5 clients connected'
                });
                return;
            }

            // leave any existing rooms
            leaveRooms();
            cb(null, describeRoom(name));
            client.join(name);
            client.room = name;
            console.log('Client ' + client.id + ' connected');
        });

        // we don't want to pass "leave" directly because the
        // event type string of "socket end" gets passed too.
        client.on('disconnect', leaveRooms);

        client.on('leave', leaveRooms);
    };
};

module.exports = function (server) {
    var io = socket.listen(server.listener);
    io.set('log level', parseInt(process.env.LOGLEVEL) || 1);
    io.sockets.on('connection', handleClient(io));
    return io;
};
