/**
 * import(s)
 */

var expect = require('expect.js');
var amqp = require('amqplib');
var msgpack = require('msgpack-js');
var Emitter = require('../');


/**
 * test(s)
 */

function bail(err) {
    console.error(err);
    process.exit(1);
}

var connection = null;

describe('socket.io-rabbitmq-emitter', function () {
    this.conn = null;
    var url = process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL : "amqp://192.168.59.103:5672";

    var rabbitConn;
    var channel;
    var exchange = 'socketiorabbitmq';
    var queue;


    after(function on_after(done) {
        if (connection)
            connection.close();

        done();
    });

    it('should be emit', function (done) {

        var emitter = Emitter({url: url});

        var args = ['hello', 'world'];

        if (connection !== undefined) {

            // Create the rabbit connection
            amqp.connect(url).then(function (conn) {
                rabbitConn = conn;
                // Create the rabbit channel
                return rabbitConn.createChannel();
            }).then(function (ch) {
                channel = ch;
                // Create the exchange (or do nothing if it exists)
                return channel.assertExchange(exchange, 'topic', {durable: false});
            }).then(function () {
                // Create the queue
                return channel.assertQueue('', {exclusive: true});
            }).then(function (q) {
                queue = q.queue;
                // Bind the queue to all topics about given key.
                return channel.bindQueue(queue, exchange, 'socketiorabbitmq.*');
            }).then(function () {
                console.log('Started listening...');

                //EMIT DATA
                emitter.emit(args[0], args[1]);

                channel.consume(queue, function (msg) {
                    // Handle each message as it comes in from RabbitMQ

                    msg = msg.content;
                    var getOffset = function (msg) {
                        var offset = 0;
                        for (var i = 0; i < msg.length; i++) {
                            if (msg[i] === 0x20) { // space
                                offset = i;
                                break;
                            }
                        }
                        return offset;
                    };

                    var offset = getOffset(msg);

                    var key = msg.slice(0, offset);
                    var payload = msgpack.decode(msg.slice(offset + 1, msg.length));
                    var data = payload[0];
                    expect(key).to.match(/^socketiorabbitmq\.emitter/);
                    expect(payload).to.be.an(Array);
                    expect(data.data[0]).to.contain('hello');
                    expect(data.data[1]).to.contain('world');
                    expect(data.nsp).to.eql('/');

                    done();
                })
            }).catch(function (err) {
                console.log(err.message);
                process.exit(1);
            });
        }
    });
});
