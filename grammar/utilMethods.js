
function deepCopy(obj) {
  var cpy = {};
  for (var o in obj) {
    var v = obj[o];
    if (v == null || typeof v !== 'object') {
      cpy[o] = v;
    }
    else if (v instanceof Array) {
      cpy[o] = [];
      for (var i = 0, m = v.length; i < m; i++) {
        cpy[o].push(v[i]);
      }
    }
    else {
      cpy[o] = deepCopy(v);
    }
  }
  return cpy;
}

function _movePos(newPos) {
  if (typeof pos !== 'object') {
    pos = newPos;
  }
  else {
    pos.offset = newPos;
  }
}

function _pos() {
  //Return offset into buffer
  if (typeof pos !== 'object') {
    return pos;
  }
  return pos.offset;
}

function _upos() {
  //Return user friendly offset into buffer
  if (typeof pos !== 'object') {
    return pos;
  }
  return pos.line + ':' + pos.column;
}
