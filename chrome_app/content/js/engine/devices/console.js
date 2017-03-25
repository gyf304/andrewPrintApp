engine.devices.Console = function Console () {
  this.internal = {
    content: []
  };

  this.directDump = function () {
    return content;
  };
}

engine.devices.Console.prototype.initialize = function () {
  return new Promise(function(resolve, reject) {
    resolve();
  });
};

engine.devices.Console.prototype.write = function (msg) {
  var content = this.internal.content;
  return new Promise(function(resolve, reject) {
    content.push(msg);
    resolve();
  });
};

engine.devices.Console.prototype.dump = function () {
  var b = new Blob(this.internal.content);
  return b;
};

engine.devices.Console.prototype.finalize = function () {
  return new Promise(function(resolve, reject) {
    resolve();
  });
};
