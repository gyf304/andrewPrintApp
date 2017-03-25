engine.common = {
  str2buffer: function (str) {
    var out = new Uint8Array(str.length);
    for (var i = 0 | 0; i < str.length; i++) {
      out[i] = str.charCodeAt(i);
    }
    return out.buffer;
  }
}