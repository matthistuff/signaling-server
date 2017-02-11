var chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai');

global.expect = chai.expect;
chai.use(sinonChai);

global.sinon = sinon;

global.createServer = function (options) {
    options = options || {};
    options.debug = false;

    var Hapi = require('hapi'),
        server = new Hapi.Server(options);

    server.register(require('inject-then'), function (err) {
        if (err) throw err
    });
    server.connection();

    return server;
};