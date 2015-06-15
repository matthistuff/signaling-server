/*global console*/
var socket = require('socket.io'),
    _ = require('lodash');

var handleClient = function (io) {
    var describeRoom = function (name) {
        return {
            clients: _.reduce(io.sockets.clients(name), function (result, client) {
                result[client.id] = client.resources;
                return result;
            }, {})
        };
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
            if (!details) return;

            var otherClient = io.sockets.sockets[details.to];
            if (!otherClient) return;

            otherClient.emit('message', _.merge({
                from: client.id
            }, details));
        });

        client.on('join', function (name, cb) {
            cb = cb || new Function;
            // sanity check
            if (typeof name !== 'string') return;
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
    }
};

module.exports = function (server) {
    var io = socket.listen(server.listener);
    io.set('log level', parseInt(process.env.LOGLEVEL) || 1);
    io.sockets.on('connection', handleClient(io));
    return io;
};