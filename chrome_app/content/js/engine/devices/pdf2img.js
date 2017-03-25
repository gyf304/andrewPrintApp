/*
config = {
  blob: //blob
  output: {
    dpi: 300
    format: 'rgba'
  }
}
*/

PDFJS.workerSrc = '3rdparty/js/pdf.worker.js';

engine.devices.Pdf2img = function (config) {
  this.internal = {
    pdf: null,
    device: null,
    blob: config.blob,
    output: config.output
  }
}

engine.devices.Pdf2img.BlobDataRangeTransport = function (file) {
  this.__proto__ = new PDFJS.PDFDataRangeTransport()

  var rangeTransport = this;
  this.count = 0;
  if (!file) throw "File is required"
  this.file = file;

  this.requestDataRange = function PdfDataRangeTransport_requestDataRange(begin, end) {
    var blob = this.file.slice(begin, end);
    var fileReader = new FileReader();
    fileReader.onload = function () {
      rangeTransport.count += end - begin;
      rangeTransport.onDataRange(begin, new Uint8Array(this.result));
    }
    fileReader.readAsArrayBuffer(blob);

  }
}

engine.devices.Pdf2img.prototype.initialize = function () {
  var that = this;
  console.log('initializer called');
  var promise = new Promise(function(resolve, reject){
    try {
      var transport = new engine.devices.Pdf2img.BlobDataRangeTransport(that.internal.blob);
      var source = {};
      source.length = transport.file.size;
      transport.length = transport.file.size;
      PDFJS.getDocument(source, transport, function () {
        reject('PasswordError');
      }).then(function (pdf) {
        that.internal.pdf = pdf;
        console.log('pdf loaded');
        resolve();
      });
    } catch (error) {
      reject(error);
    }
    
  });
  return promise;
};

engine.devices.Pdf2img.prototype.connect = function (device) {
  this.internal.device = device;
}

engine.devices.Pdf2img.prototype.getInfo = function () {
  var that = this;
  var promise = new Promise(function(resolve, reject) {
    var info = {
      numPages: that.internal.pdf.numPages
    }
    console.log(info.numPages);
    resolve(info);
  });
  return promise;
}

/*
info = {
  pages = [0, 1, 2, 3],
}
*/
engine.devices.Pdf2img.prototype.write = function (info) {
  var that = this;
  var device = this.internal.device;
  console.log(that);
  var curIdx = 0;
  var pages = info.pages;
  var pageWriter = function (pageRefIdx, resolve, reject) {
    if (pageRefIdx >= pages.length) {
      resolve();
      return;
    } else {
      var p = that.internal.pdf.getPage(pages[pageRefIdx]);
      p.then(function (page) {
        var width = that.internal.output.width;
        var height = that.internal.output.height;
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var unscaledViewport = page.getViewport(1.0);
        var scale = Math.min((canvas.height / unscaledViewport.height), (canvas.width / unscaledViewport.width));
        var viewport = page.getViewport(scale);
        var context = canvas.getContext('2d');
        // Render PDF page into canvas context.
        var renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        page.render(renderContext).then(function() {
          var imgd = context.getImageData(0, 0, canvas.width, canvas.height);
          var rgbaPix = imgd.data.buffer;
          var img = {
            data: rgbaPix,
            format: 'rgba',
            width: canvas.width,
            height: canvas.height
          };
          device.write(img).then(function(){pageWriter(pageRefIdx+1,resolve,reject);});
        });
      }, function(err){
        reject(err);
      });
    }
  };

  var promise = new Promise(function(resolve, reject){
    pageWriter(0, resolve, reject);
  });
  return promise;
  //TODO: pages validation
}

engine.devices.Pdf2img.prototype.finalize = function () {
  return new Promise(function(resolve, reject) {
    resolve();
  });
};
