
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

function stringProcess(s) {
  var r = strPart = { op: "string", chars: '' };
  for (var i = 0, m = s.length; i < m; i++) {
    var c = s[i];
    if (typeof c === 'object') {
      strPart = { op: "string", chars: '' };
      r = { 
          op: "+", 
          left: r, 
          right: {
              op: "+",
              left: c,
              right: strPart
          } 
      };
    }
    else {
      strPart.chars += c;
    }
  }
  return r;
}

function _advance(count) {
  pos += count;
}

function _pos() {
  //Return offset into buffer
  return pos;
}

function _upos(p) {
  //Return user friendly offset into buffer
  var oReport = reportedPos;
  if (p == null) {
    p = _pos();
  }
  reportedPos = p;
  var r = line() + ':' + column();
  reportedPos = oReport;
  return r;
}

function R(ast) {
  //Attaches the state pointed to by reportedPos (the start of the match)
  //to the given tree object.
  var w = reportedPos;
  var s = state;
  while (w >= 0) {
    if (states[w] !== undefined) {
      s = states[w];
      break;
    }
    --w;
  }
  ast['state'] = s;
  //And since the line from state isn't always up to date, use the reported
  //pos
  ast['line'] = line();
  ast['startPos'] = _pos();

  //Comment handling
  if (ast.op === "comment") {
    allComments.push(ast);
  }

  return ast;
}
