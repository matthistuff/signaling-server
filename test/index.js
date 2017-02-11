var terminate = require('terminate');

describe('signaling server', function () {
    var child;

    afterEach(function () {
        if (child && child.pid) {
            terminate(child.pid);
        }
    });

    it('should start without errors', function (done) {
        var spawn = require('child_process').spawn,
            kill = function (err) {
                if (err) {
                    throw new Error(err);
                }

                done();
            };

        child = spawn('npm', ['start']);

        child.stdout.on('data', function (data) {
            data = data.toString();
            console.log(data);

            if (data.indexOf('Error') !== -1) {
                kill(data);
                return;
            }

            if (data.indexOf('Connection server started on port') === 0) {
                kill();
            }
        });

        child.stderr.on('data', function (data) {
            kill(data.toString());
        });
    })
});