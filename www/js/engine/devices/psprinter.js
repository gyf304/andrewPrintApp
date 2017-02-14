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

engine.devices.PsPrinter = function PsPrinter (device, config) {
  this.internal = {
    pageWidth: config.pageDevice.width,
    pageHeight: config.pageDevice.height,
    device: device
  };
}

engine.devices.PsPrinter.a85 = function (arr) {
  var view = new Uint8Array(arr);
  var length = arr.byteLength | 0;
  var newArrLength = Math.ceil(length * 5 / 4);
  var newArr = new Uint8Array(newArrLength);
  var newArrIdx = 0;
  var buf = 0;
  var blocks = Math.ceil(length / 4) | 0;
  console.log(blocks);
  for (var i=0; i<blocks; i++) {
    buf = 0;
    for (var j=0; j<4; j++) {
      var offset1 = i*4+j;
      buf = (buf << 8) | ((offset1 > length) ? 84: (view[offset1]));
    }
    buf = buf >>> 0;
    var offset2 = 5 * i;
    for (var k = 4; k>=0; k--) {
      newArr[offset2 + k] = (buf % 85) + 33;
      buf = (buf / 85) | 0;
    }
  }
  return newArr.buffer;
}

engine.devices.PsPrinter.prototype.generatePsHead = function () {
  var headStr = "<< /PageSize [" +
  [this.internal.pageWidth, this.internal.pageHeight].join(" ") +
  "] /Orientation 0 >> setpagedevice\n";
  var outBuf = new Uint8Array(headStr.length);
  for (var i = 0 | 0; i < headStr.length; i++) {
    outBuf[i] = headStr.charCodeAt(i);
  }
  return outBuf;
};

engine.devices.PsPrinter.prototype.generateDeflateImgPage = function (width, height, data) {
  var headStr = "gsave\n" +
  "/DeviceRGB setcolorspace\n" +
  "0 0 translate\n" +
  [this.internal.pageWidth, this.internal.pageHeight].join(" ") +
  " scale\n" +
  "<<\n" +
  "/ImageType 1\n" +
  "/Width " + width.toString() + "\n" +
  "/Height " + height.toString() + "\n" +
  "/BitsPerComponent 8\n" +
  "/Decode [0 1 0 1 0 1]\n" +
  "/ImageMatrix [" +
  [width, 0, 0, -height, 0, height].join(" ") + "]\n" +
  "/DataSource currentfile " +
  "/ASCII85Decode filter /FlateDecode filter\n" +
  ">>\n" +
  "image\n";
  var endStr = "~>\n" +
  "grestore\n" +
  "showpage\n";
  var inBuf = new Uint8Array(engine.devices.PsPrinter.a85(data));
  var bufLen = headStr.length + endStr.length + inBuf.byteLength;
  var dataOffset = headStr.length;
  var endOffset = headStr.length + inBuf.byteLength;
  var outBuf = new Uint8Array(bufLen);
  for (var i = 0 | 0; i < headStr.length; i++) {
    outBuf[i] = headStr.charCodeAt(i);
  }
  outBuf.set(inBuf, dataOffset);
  for (var i = 0 | 0; i < endStr.length; i++) {
    outBuf[endOffset + i] = endStr.charCodeAt(i);
  }
  return outBuf;
};

engine.devices.PsPrinter.prototype.initialize = function () {
  console.log(this);
  var device = this.internal.device;
  var generatePsHead = this.generatePsHead;
  var that = this;
  var promise = new Promise(function (resolve, reject) {
    var psHead = generatePsHead.call(that);
    device.write(psHead).then(
      //write PS head
      function() {
        resolve();
      },
      function(msg) {
        reject(msg);
      }
    );
  }
);
return promise;
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
  var generateDeflateImgPage = this.generateDeflateImgPage;
  var that = this;
  var promise = new Promise(function (resolve, reject) {
    if (img.format === 'rgba') {
      var rgbaPix = img.data;
      var pixelCount = (rgbaPix.byteLength / 4) | 0;
      var width = img.width | 0;
      var height = img.height | 0;
      var pixelCount2 = width * height;
      if (pixelCount !== pixelCount2) {
        reject('PS printer: incorrent width and height');
        return;
      }
      var rgbPix = new Uint8Array(pixelCount * 3);
      for (var i = 0 | 0; i < pixelCount; i ++) {
        var rgbOffset = (i * 3) | 0;
        var rgbaOffset = (i * 4) | 0;
        rgbPix[rgbOffset+0] = rgbaPix[rgbaOffset+0];
        rgbPix[rgbOffset+1] = rgbaPix[rgbaOffset+1];
        rgbPix[rgbOffset+2] = rgbaPix[rgbaOffset+2];
      }
      var compressedPix = new Uint8Array(pako.deflate(rgbPix));
      delete rgbPix;
      var imgPage = generateDeflateImgPage.call(that, width, height, compressedPix);
      device.write(imgPage).then(
        function() {
          resolve();
        },
        function(msg) {
          reject(msg);
        }
      );
    } else {
      reject('PS printer: unsupported image format');
      return;
    }
  });
  return promise;
};

engine.devices.PsPrinter.prototype.finalize = function () {
  var device = this.internal.device;
  var promise = new Promise(function (resolve, reject){
    resolve();
  });
  return promise;
}
