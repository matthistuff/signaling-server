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
    api = require('./lib/api'),
    signalingServer = require('./lib/signaling-server');

var port = parseInt(process.env.HTTP_SERVER) || 8080,
    server = new Hapi.Server(),
    io;

server.connection({
    port: port
});

io = signalingServer(server);
api(server, io);

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('hello there!');
    }
});

server.start(function () {
    console.log('Connection server started on port ' + port);
});
