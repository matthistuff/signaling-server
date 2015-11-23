describe('/ route', function () {
    var server;

    beforeEach(function () {
        server = createServer();
        require('../../../lib/api/home.js')(server);
    });

    it('should return a welcome message', function () {
        return server.injectThen({method: 'GET', url: '/'}).then((response) => {
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.equal('hello there!');
        });
    });
});