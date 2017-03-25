utils = {}
utils.listDir = function (path){
  var promise = new Promise(function(resolve, reject){
    window.resolveLocalFileSystemURL(path,
      function (fileSystem) {
        var reader = fileSystem.createReader();
        reader.readEntries(
          function (entries) {
            console.log(entries);
            resolve(entries);
          },
          function (err) {
            console.log(err);
            reject(err);
          }
        );
      }, function (err) {
        console.log(err);
        reject(err);
      }
    );
  });
  return promise;
}
