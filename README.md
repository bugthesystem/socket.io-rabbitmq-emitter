# socket.io-rabbitmq-emitter

[![Build Status](https://travis-ci.org/ziyasal/socket.io-rabbitmq-emitter.svg)](https://travis-ci.org/ziyasal/socket.io-rabbitmq-emitter)
[![Coverage Status](https://coveralls.io/repos/ziyasal/socket.io-rabbitmq-emitter/badge.svg)](https://coveralls.io/r/ziyasal/socket.io-rabbitmq-emitter)
[![Dependency Status](https://david-dm.org/ziyasal/socket.io-rabbitmq-emitter.svg)](https://david-dm.org/ziyasal/socket.io-rabbitmq-emitter)

socket.io emitter [rabbitmq](https://www.rabbitmq.com/) implementation.

# Installing

```shell
$ npm install socket.io-rabbitmq-emitter
```


# Usage

```js
var emitter = require('socket.io-rabbitmq-emitter')();
setInterval(function () {
  emitter.emit('time', new Date);
}, 1000);
```


# API

`socket.io-rabbitmq-emitter` API is virtually the same as [socket.io-emitter](https://github.com/automattic/socket.io-emitter#api).

## Emitter(opts)

The following options are allowed:

- key: the name of the key to pub/sub events on as prefix (socket.io-rabbitmq)
- host: host to connect to socket.io-rabbitmq-server on (127.0.0.1)
- port: port to connect to socket.io-rabbitmq-server on (5672)


# Testing

```shell
$ make test
```


# TODO
more test !!


# License

[MIT license](http://www.opensource.org/licenses/mit-license.php).

See the `LICENSE`.