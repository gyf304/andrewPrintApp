document.getElementById('file-input')
  .addEventListener('change', openFile, false);

  PDFJS.workerSrc = '3rdparty/js/pdf.worker.js';

  var blobDataRangeTransport = function (file) {
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

  function openFile (e)
  {
    var file = e.target.files[0];
    var cons = new engine.devices.Console();
    var printerConfig = {
      pageDevice: {
        duplex: false,
        width: 612,
        height: 792
      },
      pageLayout: {
        mode: 'stretch'
      }
    }
    var psPrinter = new engine.devices.PsPrinter(cons, printerConfig);
    var pdfConfig = {
      blob: file,
      output: {
        width: Math.floor( 612 / 72 * 150 ),
        height: Math.floor( 792 / 72 * 150 )
      }
    };
    var pdfDrv = new engine.devices.Pdf2img(psPrinter, pdfConfig);
    cons.initialize()
    .then(function(){return psPrinter.initialize();})
    .then(function(){return pdfDrv.initialize();})
    .then(function(){return pdfDrv.getInfo();})
    .then(function(info){
      var pages = [];
      for (var i = 1; i <= info.numPages; i++) {
        pages.push(i);
      }
      return pdfDrv.write({'pages': pages});
    })
    .then(function(){return pdfDrv.finalize()})
    .then(function(){return psPrinter.finalize()})
    .then(function(){return cons.finalize()})
    .then(function(){
      console.log('we good');
      saveAs(cons.dump(), 'out.ps');
    });

  }
