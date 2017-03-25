self.importScripts('../../../3rdparty/js/pako.min.js'); 

var internal = {
  pageWidth: null,
  pageHeight: null,
}

var a85 = function (arr) {
  var view = new Uint8Array(arr);
  var length = arr.byteLength | 0;
  var newArrLength = Math.ceil(length * 5 / 4);
  var newArr = new Uint8Array(newArrLength);
  var newArrIdx = 0;
  var buf = 0;
  var blocks = Math.ceil(length / 4) | 0;
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

var generatePsHead = function (info) {
  var pageDevice = info.pageDevice;
  var headStr = "%!PS-Adobe-3.0 EPSF-3.0\n" +
                "%%Creator: PsPrinterWorker\n" +
                "%%DocumentData: Clean7Bit\n" +
                "<< /PageSize [" +
                [pageDevice.width, pageDevice.height].join(" ") +
                "] /Orientation 0 >> setpagedevice\n";
  var outBuf = new Uint8Array(headStr.length);
  for (var i = 0 | 0; i < headStr.length; i++) {
    outBuf[i] = headStr.charCodeAt(i);
  }
  return({success:true, msg:outBuf.buffer, transferList:[outBuf.buffer]});
};

var generateImgPage = function (info) {
  var pageDevice = info.pageDevice;
  var img = info.pageImage;
  if (img.format === 'rgba') {
    var rgbaPix = new Uint8ClampedArray(img.data);
    var pixelCount = (rgbaPix.byteLength / 4) | 0;
    var width = img.width | 0;
    var height = img.height | 0;
    var pixelCount2 = width * height;
    if (pixelCount !== pixelCount2) {
      return ({success: false, msg: "PS printer: incorrect width and height"});
    }
    var rgbPix = new Uint8Array(pixelCount * 3);
    for (var i = 0 | 0; i < pixelCount; i ++) {
      var rgbOffset = (i * 3) | 0;
      var rgbaOffset = (i * 4) | 0;
      rgbPix[rgbOffset+0] = rgbaPix[rgbaOffset+0];
      rgbPix[rgbOffset+1] = rgbaPix[rgbaOffset+1];
      rgbPix[rgbOffset+2] = rgbaPix[rgbaOffset+2];
    }
    //console.log(rgbPix);
    var compressedPix = new Uint8Array(pako.deflate(rgbPix.buffer));
    var headStr = "gsave\n" +
                  "/DeviceRGB setcolorspace\n" +
                  "0 0 translate\n" +
                  [pageDevice.width, pageDevice.height].join(" ") +
                  " scale\n" +
                  "<<\n" +
                  "/ImageType 1\n" +
                  "/Width " + width.toString() + "\n" +
                  "/Height " + height.toString() + "\n" +
                  "/BitsPerComponent 8\n" +
                  "/Decode [0 1 0 1 0 1]\n" +
                  "/ImageMatrix [" +
                  [img.width, 0, 0, -img.height, 0, img.height].join(" ") + "]\n" +
                  "/DataSource currentfile " +
                  "/ASCII85Decode filter /FlateDecode filter\n" +
                  ">>\n" +
                  "image\n";
    var endStr =  "~>\n" +
                  "grestore\n" +
                  "showpage\n";
    var inBuf = new Uint8Array(a85(compressedPix));
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
    return ({success: true, msg: outBuf.buffer, transferList: [outBuf.buffer]});
  } else {
    return ({success: false, msg: "PS printer: unsupported image format"});
  }
};

var generatePsEnd = function (info) {
  var endStr = "%%EOF\n\0";
  var outBuf = new Uint8Array(endStr.length);
  for (var i = 0 | 0; i < endStr.length; i++) {
    outBuf[i] = endStr.charCodeAt(i);
  }
  return({success:true, msg:outBuf.buffer, transferList:[outBuf.buffer]});
};

var setup = function (config) {
  internal = {
    pageWidth: config.pageDevice.width,
    pageHeight: config.pageDevice.height,
  };
};

onmessage = function(e) {
  var data = e.data;
  if (data.method == "generatePsImagePage") {
    var id = data.id;
    var ret = generateImgPage(data.msg);
    postMessage({id: id, success: ret.success, msg: ret.msg}, ret.transferList);
  } else if (data.method == "generatePsHead") {
    var id = data.id;
    var ret = generatePsHead(data.msg);
    postMessage({id: id, success: ret.success, msg: ret.msg}, ret.transferList);
  } else if (data.method == "generatePsEnd") {
    var id = data.id;
    var ret = generatePsEnd(data.msg);
    postMessage({id: id, success: ret.success, msg: ret.msg}, ret.transferList);
  }
  //postMessage(workerResult);
}
