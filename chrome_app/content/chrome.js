document.getElementById('file-input')
  .addEventListener('change', openFile, false);


function openFile (e)
  {
    var file = e.target.files[0];
    // creating devices
    var socket = 
      new engine.devices.TcpSocket({
        host: 'printing.andrew.cmu.edu',
        port: 515
      });
    var lpr = 
      new engine.devices.Lpr({
        queuename: 'andrew',
        hostname: 'me',
        username: 'yifangu',
        jobname: 'sample',
        timeout: 10000 //10 seconds
      });
    var psPrinter = 
      new engine.devices.PsPrinter({
        pageDevice: {
          duplex: false,
          width: 612,
          height: 792
        },
        pageLayout: {
          mode: 'stretch'
        }
      });
    var pdfDrv = 
      new engine.devices.Pdf2img({
        blob: file,
        output: {
          width: Math.floor( 612 / 72 * 300 ),
          height: Math.floor( 792 / 72 * 300 )
        }
      });
    // connecting devices
    pdfDrv.connect(psPrinter);
    psPrinter.connect(lpr);
    lpr.connect(socket);
    // initialize devices
    pdfDrv.initialize()
    .then(function(){return socket.initialize();})
    .then(function(){return lpr.initialize();})
    .then(function(){return psPrinter.initialize();})
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
    .then(function(){return lpr.finalize()})
    .then(function(){return socket.finalize()})
    .then(function(){
      console.log('we good');
    }).catch(function(msg){
      console.log('Something wrong: ' + msg);
    });

  }
