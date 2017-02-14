document.addEventListener("deviceready", onDeviceReady, false);
console.log('init.js')

function onDeviceReady() {
    // Fast-click to elliminate the delay of 300ms
    var attachFastClick = Origami.fastclick;
    attachFastClick(document.body);
    console.log('fastclick attached')
}

window.handleOpenURL = function (url) {
    window.resolveLocalFileSystemURI (
        url,
        function (fileEntry) {
            fileEntry.file (
                function (file) {
                    console.log(url);
                    navigator.notification.alert(file.name, function(){
                      // nothing
                    }, 'New File Received. ');
                    console.log ('Successfully received file: ' + file.name);
                },
                function (error) {
                    console.log (error);
                }
            )
        },
        function (error) {
            console.log(error);
        }
    )
};
