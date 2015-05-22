/*global console*/
var uuid = require('node-uuid'),
    socket = require('socket.io'),

    loglevel = parseInt(process.env.LOGLEVEL) || 1,
    port = parseInt(process.env.HTTP_SERVER) || 8080;

var io = socket.listen(port);
io.set('log level', loglevel);

io.sockets.on('connection', function (client) {
    // Socket functions
    var describeRoom = function (name) {
            var clients = io.sockets.clients(name);
            var result = {
                clients: {}
            };

            clients.forEach(function (client) {
                result.clients[client.id] = client.resources;
            });

            return result;
        },
        removeFeed = function (type) {
            if (client.room) {
                io.sockets.in(client.room).emit('remove', {
                    id: client.id,
                    type: type
                });
                if (!type) {
                    client.leave(client.room);
                    client.room = undefined;
                    console.log(colors.red('Client ' + client.id + ' disconnected'));
                }
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

        details.from = client.id;
        otherClient.emit('message', details);
    });

    client.on('join', function (name, cb) {
        cb = cb || new Function;
        // sanity check
        if (typeof name !== 'string') return;
        // leave any existing rooms
        removeFeed();
        cb(null, describeRoom(name));
        client.join(name);
        client.room = name;
        console.log(colors.green('Client ' + client.id + ' connected'));
    });

    // we don't want to pass "leave" directly because the
    // event type string of "socket end" gets passed too.
    client.on('disconnect', function () {
        removeFeed();
    });

    client.on('leave', function () {
        removeFeed();
    });

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