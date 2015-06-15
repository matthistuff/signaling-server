/*global console*/
var uuid = require('node-uuid'),
    socket = require('socket.io'),
    _ = require('lodash'),

    loglevel = parseInt(process.env.LOGLEVEL) || 1,
    port = parseInt(process.env.HTTP_SERVER) || 8080;

var io = socket.listen(port);
io.set('log level', loglevel);

io.sockets.on('connection', function (client) {
    // Socket functions
    var describeRoom = function (name) {
            return {
                clients: _.reduce(io.sockets.clients(name), function (result, client) {
                    result[client.id] = client.resources;
                    return result;
                }, {})
            };
        },
        leaveRooms = function () {
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

    // pass a message to another id
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

    client.on('create', function (name, cb) {
        cb = cb || new Function;

        if (arguments.length == 2) {
            cb = (typeof cb == 'function') ? cb : function () {
            };
            name = name || uuid();
        } else {
            cb = name;
            name = uuid();
        }
        // check if exists
        if (io.sockets.clients(name).length) {
            cb('taken');
        } else {
            join(name);
            cb(null, name);
        }
    });
});

console.log('Connection server started on port ' + port);