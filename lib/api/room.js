var url = require('url'),
    moniker = require('moniker'),
    names = moniker.generator([moniker.adjective, moniker.noun]),
    createName = function (io) {
        var rnd = names.choose();

        return io.sockets.clients(rnd).length ? createName(io) : rnd;
    };

module.exports = function (server, io) {
    server.route({
        method: 'GET',
        path: '/api/room',
        handler: function (request, reply) {
            var name = createName(io);

            reply({
                url: url.resolve(process.env.VIDEO_HOST || 'https://video.dunlin.io', name),
                name: name
            });
        }
    })
};