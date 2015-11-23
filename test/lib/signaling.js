var io = require('socket.io-client'),
    Bluebird = require('bluebird'),
    signaling = require('../../lib/signaling');

var socketURL = 'http://0.0.0.0:8888',
    options = {
        'force new connection': true
    };

function connectClient() {
    var c = io.connect(socketURL, options);

    return new Promise(function (resolve) {
        c.on('connect', function () {
            resolve(this);
        });
        c.on('connect_failed', function () {
            throw 'Cannot connect client';
        });
    });
}

function joinRoom(client, room) {
    return new Promise(function (resolve, reject) {
        client.emit('join', room, function (err, roomDescription) {
            if (err) {
                return reject(err);
            }
            resolve(roomDescription);
        });
    });
}

describe('socket signaling server', function () {
    var socket;

    before(function () {
        process.env.LOGLEVEL = 0;
        socket = signaling(8888);
    });

    after(function () {
        socket.server.close();
    });

    it('should be able to connect clients', function () {
        return connectClient().then(function (client) {
            client.disconnect();
        });
    });

    it('should put clients into the requested room', function () {
        return connectClient().then(function (client) {
            return joinRoom(client, 'slow-loris').then(function () {
                expect(socket.sockets.clients('slow-loris').length).to.equal(1);
                client.disconnect();
            });
        });
    });

    it('should enforce a maximum number of clients in a room', function (done) {
        var clients = [1, 2, 3, 4, 5].map(function () {
            return connectClient().then(function (client) {
                return joinRoom(client, 'slow-loris').then(function () {
                    return client;
                });
            });
        });

        Bluebird.all(clients).then(function (connections) {
            expect(socket.sockets.clients('slow-loris').length).to.equal(5);

            connectClient().then(function (client) {
                client.on('noSlotsAvailable', function () {
                    expect(socket.sockets.clients('slow-loris').length).to.equal(5);
                    connections.forEach(function (connection) {
                        connection.disconnect();
                    });
                    client.disconnect();
                    done();
                });

                joinRoom(client, 'slow-loris');
            });
        });
    });

    it('should remove a client from all existing rooms before joining a new room', function () {
        return connectClient().then(function (client) {
            return joinRoom(client, 'slow-loris').then(function () {
                expect(socket.sockets.clients('slow-loris').length).to.equal(1);

                return joinRoom(client, 'even-slower-loris').then(function () {
                    expect(socket.sockets.clients('slow-loris').length).to.equal(0);
                    expect(socket.sockets.clients('even-slower-loris').length).to.equal(1);

                    client.disconnect();
                });
            });
        });
    })
});