var app = new Vue({
  el: '#vue-app',
  data: {
    activeView: 0,
    views: [
      {
        id: 'filesView',
        title: 'Files',
        icon: 'img/icons/ic_folder_white_24px.svg',
        action: {method: 'setView', args: ['example']}
      },
      {
        id: 'printersView',
        title: 'Printers',
        icon: 'img/icons/ic_print_white_24px.svg'
      },
      {
        id: 'settingsView',
        title: 'Settings',
        icon: 'img/icons/ic_settings_white_24px.svg',
        action: {method: 'setView', args: ['example']}
      }
    ]
  },
  methods: {
    menuAction: function (action) {
      if (action['method'] && action['args']) {
        this[action['method']].apply(this, action['args'])
      }
      this.toggleMenu()
    },
    setActiveView: function (view) {
      console.log('switch to ' + view)
      this.activeView = view;
    },
    refreshFiles: function () {
      if (device.platform == 'iOS') {
        utils.listDir(cordova.file.documentsDirectory + "Inbox/")
        .then(function(list){
          var fileList = [];
          for (var i = 0; i < list.length; i++) {
            var f = list[i];
            if (f.isFile) {
              fileList.push(f.name);
            }
          }
          navigator.notification.alert(fileList.toString(), function() {
            // nothing
          }, 'Files');
        });
      }
    }
  }
})
