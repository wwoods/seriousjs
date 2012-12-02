
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

function getArray(head, tail, tailPos) {
  var r = [];
  if (head) {
    r.push(head);
  }
  for (var i = 0, m = tail.length; i < m; i++) {
    r.push(tail[i][tailPos]);
  }
  return r;
}

function getBinary(head, tail, tailOp, tailValue) {
  var r = head;
  for (var i = 0, m = tail.length; i < m; i++) {
    r = { "op": tail[i][tailOp], "left": r, "right": tail[i][tailValue] };
  }
  return r;
}

function _advance(count) {
  pos += count;
}

function _pos() {
  //Return offset into buffer
  return offset();
}

function _upos() {
  //Return user friendly offset into buffer
  return line() + ':' + column();
}
