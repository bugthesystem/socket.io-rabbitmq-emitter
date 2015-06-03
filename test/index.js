/**
 * import(s)
 */

var expect = require('expect.js');
var format = require('util').format;
var amqp = require('amqplib/callback_api');
var parser = require('socket.io-parser');
var msgpack = require('msgpack-js');
var Emitter = require('../');


/**
 * test(s)
 */

describe('socket.io-rabbitmq-emitter', function () {
  
  beforeEach(function (done) {
   
  });

  afterEach(function (done) {
   
  });

  it('should be emit', function (done) {
    var emitter = Emitter();
    var args = ['hello', 'world'];
    
    //TODO:
    
    // emit !!
    setTimeout(function () {
      emitter.emit(args[0], args[1]);
    }, 5);
  });
});
