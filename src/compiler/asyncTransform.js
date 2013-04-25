
var isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

var deepCopy = function(obj) {
  if (typeof obj !== 'object' || obj == null) {
    return obj;
  }
  else if (isArray(obj)) {
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

function iterTree(path, node) {
  path.push(node);
  for (var n in node) {
    var o = node[n];
    if (typeof o !== 'object' || o === null) {
      continue;
    }
    iterTree(path, o);
  }
  path.pop();

  if (isArray(node)) {
    //Work backwards to collapse awaits in the right order
    for (var i = node.length - 1; i >= 0; i--) {
      if (node[i].op === "await") {
        //Is it valid?
        var parent = path[path.length - 1];
        if (parent.op === "->" || parent.op === "await") {
          //ok
        }
        else {
          //not implemented.
          throw new Error("Cannot use await nested in a " + parent.op);
        }

        //If we get here, the tree should be transformed, but we will go ahead
        //and assert that
        for (var j = path.length - 1; j >= 0; j--) {
          if (isArray(path[j])) {
            for (var k = 0, n = path[j].length; k < n; k++) {
              if (path[j][k].op === "await") {
                if (k !== n - 1) {
                  throw new Error("await transform failed: " + path[j - 1].op);
                }
              }
            }
          }
        }

        node[i].after = node.splice(i + 1);
      }
    }
  }
}

this.transformTree = function(tree) {
  //Take the given tree and move everything after any "await" into the await's
  //"after" member.
  var mTree = deepCopy(tree);
  iterTree([], mTree);
  //console.log(require("util").inspect(mTree, null, 30));
  return mTree;
};
