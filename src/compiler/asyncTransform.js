
var deepCopy = function(obj) {
  if (typeof obj !== 'object' || obj == null) {
    return obj;
  }
  else if (Object.prototype.toString.call(obj) === '[object Array]') {
    var r = [];
    for (var i = 0, m = obj.length; i < m; i++) {
      r.push(deepCopy(obj[i]));
    }
    return r;
  }
  var r = {};
  for (var k in obj) {
    r[k] = deepCopy(obj[k]);
  }
  return r;
};

function iterTree(node) {
  for (var n in node) {
    var o = node[n];
    if (typeof o !== 'object' || o === null) {
      continue;
    }
    iterTree(o);
  }

  if (Object.prototype.toString.call(node) === '[object Array]') {
    for (var i = node.length - 1; i >= 0; i--) {
      if (node[i].op === "await") {
        node[i].after = node.splice(i + 1);
      }
    }
  }
}

this.transformTree = function(tree) {
  //Take the given tree and move everything after any "await" into the await's
  //"after" member.
  var mTree = deepCopy(tree);
  iterTree(mTree);
  //console.log(require("util").inspect(mTree, null, 30));
  return mTree;
};
