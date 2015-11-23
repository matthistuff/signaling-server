/*
 * Dunlin signaling server
 * =======================
 *
 * Exposes a socket.io and REST interface for handling rooms and P2P connections.
 *
 * ENV
 * ---
 * Uses these ENV variables:
 *
 * `VIDEO_HOST` - The main application URL, used for a convenience link of the GET /api/room route
 */
var Hapi = require('hapi'),
    home = require('./lib/api/home'),
    api = require('./lib/api/room'),
    signaling = require('./lib/signaling');

var port = parseInt(process.env.HTTP_SERVER) || 8080,
    server = new Hapi.Server({
        connections: {
            routes: {
                cors: true
            }
        }
    }),
    io;

server.connection({
    port: port
});

home(server);

io = signaling(server.listener);
api(server, io);

server.start(function () {
    console.log('Connection server started on port ' + port);
});
