/*
  config = {
    host: 'example.com',
    port: 8765
  }
*/

engine.devices.WebSocket = function WebSocket (config) {
  this.internal = {
    socket: null,
    content: [],
    host: config.host,
    port: config.port,
    callbacks: {
      "onError": [],
      "onData": []
    }
  };
}

engine.devices.WebSocket.prototype.initialize = function () {
  var that = this;
  return new Promise(function(resolve, reject) {
    try {
      var socket = new WebSocket("ws://"+that.internal.host+":"+(that.internal.port).toString());
      socket.binaryType = 'arraybuffer';
      that.internal.socket = socket;
      socket.onmessage = function(msg){
        for (var i = 0; i < that.internal.callbacks.onData.length; i++) {
          var callback = that.internal.callbacks.onData[i];
          try {
            var ret = callback(msg.data);
          } catch (error) {
            console.warn("WebSocket Callback Failed");
          }
        }
      };
      socket.onopen = function (event) {
        resolve();
        socket.onerror = function(){};
      }
      socket.onerror = function(e){
        reject("WebSocket: " + e);
      };
    } catch (error) {
      reject("WebSocket: " + error);
    }
  });
};

engine.devices.WebSocket.prototype.write = function (msg) {
  var that = this;
  return new Promise(function(resolve, reject) {
    try {
      that.internal.socket.send(msg);
      resolve();
    } catch (error) {
      reject("WebSocket:" + error);
    }
  });
};

engine.devices.WebSocket.prototype.registerCallback = function (type, callback) {
  this.internal.callbacks[type].push(callback);
};

engine.devices.WebSocket.prototype.finalize = function () {
  var that = this;
  return new Promise(function(resolve, reject) {
    that.internal.socket.close();
    //that.internal.socket.onclose = resolve;
    resolve();
  });
};
