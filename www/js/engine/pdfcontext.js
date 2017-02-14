engine.pdf = engine.pdf || {};

engine.pdf.BlobDataRangeTransport = function (file) {
  this.__proto__ = new PDFJS.PDFDataRangeTransport()

  var rangeTransport = this
  this.count = 0
  if (!file) throw "File is required"
  this.file = file

  this.requestDataRange = function PdfDataRangeTransport_requestDataRange(begin, end) {
    var blob = this.file.slice(begin, end)

    var fileReader = new FileReader()
    fileReader.onload = function () {
      rangeTransport.count += end - begin
      rangeTransport.onDataRange(begin, new Uint8Array(this.result))
    }
    fileReader.readAsArrayBuffer(blob)

  }
}

engine.pdf.PdfContext = function (pdfBlob) {
  this.loadPdf = function (pdfBlob) {
    var promise = Promise(function (resolve, reject) {
      var source = {};
      var transport = new engine.pdf.BlobDataRangeTransport (pdfBlob);
      source.length = transport.file.size;
      rangeTransport.length = transport.file.size;
      return PDFJS.getDocument(source, transport).then(
        function(doc) {
          this.pdfDoc = doc;
          resolve();
        },
        function(errMsg) {
          reject(errMsg);
        }
      );
    });
  };

  this.getPageCount = function () {
    return this.__pdf.numPages;
  };

  this.printPsAll = function (device) {
    var promise = Promise(function (resolve, reject) {
      var pages = this.getPageCount();
      var printHelper = function (pageNum) {
        if ((pageNum) > pages) {
          device.finalize();
          resolve();
          return;
        }
        this.pdfDoc.getPage(pageNum)
      }
    });
  }

  this.printPs = function (device, pageRange) {
    // validate


  };
}
