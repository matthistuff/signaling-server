describe('/room route', function () {
    var rewire = require('rewire'),
        server,
        io,
        room,
        namesStub = {
            choose: sinon.stub()
        };

    before(function () {
        io = {
            clients: {},
            sockets: {
                clients: function (id) {
                    return io.clients[id] ? io.clients[id] : [];
                }
            }
        };

        namesStub.choose.onFirstCall().returns('slow-loris')
            .onSecondCall().returns('foraging-dunlin');
    });

    beforeEach(function () {
        namesStub.choose.reset();

        room = rewire('../../../lib/api/room.js');
        room.__set__({
            names: namesStub
        });

        server = createServer();
        room(server, io);
    });

    it('should return a new room', function () {
        return server.injectThen({method: 'GET', url: '/api/room'}).then((response) => {
            expect(namesStub.choose).to.have.been.calledOnce;
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.deep.equal({
                url: 'https://video.dunlin.io/slow-loris',
                name: 'slow-loris'
            });
        });
    });

    it('should return a different room when a room is occupied', function () {
        io.clients['slow-loris'] = [1];

        return server.injectThen({method: 'GET', url: '/api/room'}).then((response) => {
            expect(namesStub.choose).to.have.been.calledTwice;
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.deep.equal({
                url: 'https://video.dunlin.io/foraging-dunlin',
                name: 'foraging-dunlin'
            });
        }).finally(function () {
            delete io.clients['slow-loris'];
        });
    });

    it('should respect URL settings in the ENV', function () {
        process.env.VIDEO_HOST = 'https://dunlin.dev';

        return server.injectThen({method: 'GET', url: '/api/room'}).then((response) => {
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.deep.equal({
                url: 'https://dunlin.dev/slow-loris',
                name: 'slow-loris'
            });
        }).finally(function () {
            delete process.env.VIDEO_HOST;
        });
    })
});