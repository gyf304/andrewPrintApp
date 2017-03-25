/*
  config = {
    host: 'example.com',
    port: 8765
  }
*/

engine.devices.TcpSocket = function TcpSocket (config) {
  this.internal = {
    socketId: null,
    content: [],
    host: config.host,
    port: config.port,
    callbacks: {
      "onError": [],
      "onData": [],
      "onClose": []
    }
  };
}

engine.devices.TcpSocket.prototype._initCallback = function () {
  var that = this;
  chrome.sockets.tcp.onReceiveError.addListener(function(info){that._onError(info)});
  chrome.sockets.tcp.onReceive.addListener(function(info){that._onData(info)});

};

engine.devices.TcpSocket.prototype._onError = function (info) {
  if (info.socketId != this.internal.socketId) {
    return;
  }
};

engine.devices.TcpSocket.prototype._onData = function (info) {
  if (info.socketId != this.internal.socketId) {
    return;
  }
  for (var i = 0; i < this.internal.callbacks.onData.length; i++) {
    var c = this.internal.callbacks.onData[i];
    c(info.data);
  }
};

engine.devices.TcpSocket.prototype.initialize = function () {
  var that = this;
  return new Promise(function(resolve, reject) {
    try {
      chrome.sockets.tcp.create({}, function(createInfo){
        var socketId = createInfo.socketId;
        that.internal.socketId = createInfo.socketId;
        chrome.sockets.tcp.connect(socketId, that.internal.host, that.internal.port, function(result){
          if (result >= 0) {
            that._initCallback();
            resolve();
          } else {
            reject("TcpSocket: Failed to connect, " + result.toString());
          }
        });
      });
    } catch (error) {
      reject("TcpSocket: " + error);
    }
  });
};

engine.devices.TcpSocket.prototype.write = function (msg) {
  var that = this;
  return new Promise(function(resolve, reject) {
    console.log("WRITE!")
    chrome.sockets.tcp.send(that.internal.socketId, msg, function(sendInfo){
      if (sendInfo.resultCode >= 0) {
        resolve();
      } else {
        reject("TcpSocket: Failed to send, " + sendInfo.resultCode.toString());
      }
    });
  });
};

engine.devices.TcpSocket.prototype.registerCallback = function (type, callback) {
  this.internal.callbacks[type].push(callback);
};

engine.devices.TcpSocket.prototype.finalize = function () {
  var that = this;
  return new Promise(function(resolve, reject) {
    console.log("FINAL!");
    console.trace();
    chrome.sockets.tcp.onReceive.removeListener(that._onReceive);
    chrome.sockets.tcp.onReceiveError.removeListener(that._onReceiveError);
    chrome.sockets.tcp.disconnect(that.internal.socketId);
    chrome.sockets.tcp.close(that.internal.socketId);
    that.internal.socketId = null;
    resolve();
  });
};
