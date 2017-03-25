if (!engine.devices) {
  engine.devices = {};
}


/*
{
pageDevice: {
duplex: false, // duplex control to be added.
width: 612,
height: 792 // letter
// orientation control to be added
}
}
*/

engine.devices.PsPrinter = function PsPrinter (config) {
  this.internal = {
    pageDevice: config.pageDevice,
    device: null,
    worker: null,
    callbacks: {}
  };
}

engine.devices.PsPrinter.prototype.callWorker = function callWorker (method, msg, transferList) {
  var that = this;
  var id = Date.now().toString();
  var p = new Promise(
    function(resolve, reject) {
      that.internal.callbacks[id] = {
        id: id,
        resolve: resolve,
        reject: reject
      }
    }
  );
  this.internal.worker.postMessage({id: id, method: method, msg: msg}, transferList);
  return p;
}

engine.devices.PsPrinter.prototype.connect = function (device) {
  this.internal.device = device;
}

engine.devices.PsPrinter.prototype.initialize = function () {
  var that = this;
  return new Promise(function(resolve, reject) {
    try{
      var worker = new Worker("js/engine/devices/psprinterworker.js");
      worker.onmessage = function(event) {
        var id = event.data.id;
        var success = event.data.success;
        var msg = event.data.msg;
        var callback = that.internal.callbacks[id];
        if (success) {
          callback.resolve(msg);
        } else {
          callback.reject(msg);
        }
      };
      that.internal.worker = worker;
      resolve();
    } catch (error) {
      reject(error);
    }
  })
  .then(function(){return that.callWorker("generatePsHead", {pageDevice: that.internal.pageDevice})})
  .then(function(msg){that.internal.device.write(msg)});
};

/*
{
width: 612,
height: 792,
format: 'rgba',
data: // array buffer
}
*/
engine.devices.PsPrinter.prototype.write = function (img) {
  var device = this.internal.device;
  return this.callWorker("generatePsImagePage", 
                         {pageDevice: this.internal.pageDevice, pageImage: img}, [img.data])
             .then(function(msg){device.write(msg)});
};

engine.devices.PsPrinter.prototype.finalize = function () {
  var device = this.internal.device;
  var that = this;
  var promise = that.callWorker("generatePsEnd").then(function(msg){that.internal.device.write(msg)});
  return promise;
}
