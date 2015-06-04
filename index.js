/**
 * import(s)
 */

var debug = require('debug')('socket.io-rabbitmq-emitter');
var format = require('util').format;
var uid2 = require('uid2');
var parser = require('socket.io-parser');
var hasBin = require('has-binary-data');
var msgpack = require('msgpack-js');
var amqp = require('amqplib/callback_api');


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
    opts.key = opts.key || 'socket.io-rabbitmq';

    this.url = opts.url ? opts.url : format('amqp://%s:%s', this.host, this.port);

    this.key = format('%s#emitter', opts.key);

    this._channel = null;

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

    if (this._channel === null) {
        var _that = this;
        amqp.connect(_that.url, function (err, conn) {
            if (err) {
                console.error("[AMQP]", err.message);
                //TODO: Try to start
                return;
            }
            conn.on("error", function (err) {
                if (err.message !== "Connection closing") {
                    console.error("[AMQP] conn error", err.message);
                }
            });
            conn.on("close", function () {
                console.error("[AMQP] reconnecting");
                //TODO: restart
                return;
            });

            conn.createChannel(function on_open(err, ch) {
                if (err != null) bail(err);

                _that._channel = ch;
                _that._channel.assertQueue(_that.key);
                //_that._channel.sendToQueue(_that.key, data);
                _that._channel.publish("fanout", _that.key, data);
            });
        });

    } else {
        this._channel.sendToQueue(this.key, data);
    }

    // reset state
    this._rooms = [];
    this._flags = {};

    return this;
};
