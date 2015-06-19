/**
 * import(s)
 */

var debug = require('debug')('socket.io-rabbitmq-emitter');
var format = require('util').format;
var parser = require('socket.io-parser');
var hasBin = require('has-binary-data');
var msgpack = require('msgpack-js');
var amqp = require('amqplib');


/**
 * export(s)
 */

module.exports = Emitter;

var flags = [
    'json',
    'volatile',
    'broadcast'
];

function Emitter(opts) {
    if (!(this instanceof Emitter)) return new Emitter(opts);

    opts = opts || {};
    opts.port = opts.port || 5672;
    opts.host = opts.host || '127.0.0.1';
    opts.key = opts.key || 'socketiorabbitmq';

    this._exchange = 'socketiorabbitmq';

    this.url = opts.url ? opts.url : format('amqp://%s:%s', this.host, this.port);

    this.key = format('%s.emitter', opts.key);

    this._channel = null;
    this._rabbitConn = null;

    this._rooms = {};
    this._flags = {};
}

flags.forEach(function (flag) {
    Emitter.prototype.__defineGetter__(flag, function () {
        debug('flag %s on', flag);
        this._flags[flag] = true;
        return this;
    });
});

Emitter.prototype.in =
    Emitter.prototype.to = function (room) {
        if (!~this._rooms.indexOf(room)) {
            debug('room %s', room);
            this._rooms.push(room);
        }
        return this;
    };

Emitter.prototype.of = function (nsp) {
    debug('nsp set to %s', nsp);
    this._flags.nsp = nsp;
    return this;
};

Emitter.prototype.emit = function () {
    // packet
    var args = Array.prototype.slice.call(arguments);
    var packet = {};
    packet.type = hasBin(args) ? parser.BINARY_EVENT : parser.EVENT;
    packet.data = args;
    // set namespace to packet
    if (this._flags.nsp) {
        packet.nsp = this._flags.nsp;
        delete this._flags.nsp;
    } else {
        packet.nsp = '/';
    }

    // publish
    var key = new Buffer(format('%s ', this.key), 'binary');
    var payload = msgpack.encode([packet, {
        rooms: this._rooms,
        flags: this._flags
    }]);
    var data = Buffer.concat([key, payload]);
    debug('send data length: key = %d, payload = %d, data = %d', key.length, payload.length, data.length);

    if (this._channel === null && this._rabbitConn === null) {
        var _that = this;

        // Create the rabbit connection
        amqp.connect(_that.url).then(function (conn) {
            _that._rabbitConn = conn;
            // Create the rabbit channel
            return _that._rabbitConn.createChannel();
        }).then(function (ch) {
            _that._channel = ch;
            // Create the exchange (or do nothing if it exists)
            return _that._channel.assertExchange(_that._exchange, 'topic', {durable: false});
        }).then(function () {

            _that._channel.publish(_that._exchange, _that.key, data);

        }).catch(function (err) {
            return console.error("[AMQP]", err.message);
            //TODO: process.exit(1) //??
        });

    } else {
        this._channel.publish(this._exchange, this.key, data);
    }

    // reset state
    this._rooms = [];
    this._flags = {};

    return this;
};
