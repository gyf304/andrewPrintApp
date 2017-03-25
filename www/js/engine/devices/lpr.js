/*
  config: {
    queuename:
    hostname: 
    username:
    jobname:
  }
*/

engine.devices.Lpr = function Lpr (config) {
  var jobNumberStr = ("000"+(Date.now() % 1000).toString()).substr(-3);
  this.internal = {
    lprArguments: {
      queuename: config.queuename,
      hostname:  config.hostname,
      username:  config.username,
      jobname:   config.jobname,
      controlFilename: "cfA" + jobNumberStr + config.hostname,
      dataFilename: "dfA" + jobNumberStr + config.hostname,
    },
    buffer: [],
    timeout: config.timeout,
    device: null,
    ack: null,
    content: []
  };

  this.directDump = function () {
    return content;
  };
}

engine.devices.Lpr.generateCommand = function (code, args) {
  var cmdStr = String.fromCharCode(code) + args.join(" ") + "\n"; 
  return engine.common.str2buffer(cmdStr);
}

engine.devices.Lpr.generateControlFile = function (config) {
  var ctrl =  "H" + config.hostname + "\n" +
              "P" + config.username + "\n" +
              "J" + config.jobname  + "\n" +
              "l" + config.dataFilename + "\n" +
              "U" + config.dataFilename + "\n" +
              "N" + config.jobname + "\n\0";
  return engine.common.str2buffer(ctrl);
}

engine.devices.Lpr.prototype.connect = function (device) {
  this.internal.device = device;
}

engine.devices.Lpr.prototype.dataCallback = function (data) {
  var cb = this.internal.ack;
  console.log("dataCallback");
  console.log(data);
  try{
    console.log(new Uint8Array(data));
  } catch(err) {
    // meh
  }
  cb.resolve();
}

engine.devices.Lpr.prototype.wait = function () {
  var that = this;
  console.log("wait issued.")
  return new Promise(function(resolve, reject){
    var info = {resolved: false};
    that.internal.ack = {resolve: function(){
      if (!info.resolved){
        info.resolved = true;
        resolve();
      }
    }, reject: function(msg){
      if (!info.resolved){
        info.resolved = true;
        reject(msg);
      };
    }};
    setTimeout(function(){
      if (!info.resolved) {
        reject("LPR: Timeout while waiting for server to confirm receiption of datagram.");
      }
    }, that.internal.timeout);
  });
}

engine.devices.Lpr.prototype.initialize = function () {
  var that = this;
  var device = this.internal.device;
  var lprArgs = that.internal.lprArguments;
  var recvJobCmd = engine.devices.Lpr.generateCommand(02, [lprArgs.queuename]);
  var ctrlFile = engine.devices.Lpr.generateControlFile(that.internal.lprArguments);
  var recvCtrlCmd = engine.devices.Lpr.generateCommand(02, [(ctrlFile.byteLength-1).toString(), lprArgs.controlFilename]);
  // first initialize callback
  device.registerCallback("onData", function(data){that.dataCallback(data)});
  return new Promise(function(resolve, reject) {
    var p0 = that.wait();
    device.write(recvJobCmd);
    p0.then(function(){
      var p1 = that.wait();
      device.write(recvCtrlCmd);
      return p1;
    }).then(function(){
      // then send control file
      var p2 = that.wait();
      device.write(ctrlFile);
      return p2;
    }).then(function(){
      resolve();
    }).catch(function(msg){
      reject(msg);
    })
  });
};

engine.devices.Lpr.prototype.write = function (msg) {
  var that = this;
  var device = this.internal.device;
  var content = this.internal.content;
  return new Promise(function(resolve, reject){
    that.internal.buffer.push(msg);
    resolve();
  });
};

engine.devices.Lpr.prototype.finalize = function () {
  var that = this;
  var lprArgs = that.internal.lprArguments;
  var device = this.internal.device;
  var doWrite = function() {
    var recWrite = function(resolve, reject) {
      e = that.internal.buffer.shift();
      if (e != null) {
        that.internal.device.write(e).then(function(){
          recWrite(resolve, reject);
        }, function(){
          reject();
        });
      } else {
        resolve();
      }
    };
    return new Promise(function(resolve, reject){
      recWrite(resolve, reject);
    });
  }
  return new Promise(function(resolve, reject) {
    var b = new Blob(that.internal.buffer);
    var recvDataCmd = engine.devices.Lpr.generateCommand(03, [(b.size).toString(), lprArgs.dataFilename]);
    var p0 = that.wait();
    device.write(recvDataCmd);
    p0.then(function(){
      return doWrite();
    }).then(function(){
      resolve();
    }).catch(function(msg){
      reject();
    })
  });
};
