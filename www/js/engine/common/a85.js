engine.common.a85 = function (arr) {
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
