
var isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

var isNumber = function(obj) {
  return !isNaN(obj);
};

var isObject = function(obj) {
  return typeof obj === "object" && !isArray(obj);
};

var isString = function(obj) {
  return typeof obj === "string";
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
  //Iterate through the tree depth-first right-to-left.  If we see an async,
  //we mark all parents through the closest lambda or async as needing async
  //support.  When we get to a node that needs async support, we process it
  //or throw an error if it doesn't support it.
  path.push(node);

  if (isArray(node)) {
    for (var i = node.length - 1; i >= 0; i--) {
      path.push(i);
      iterTree(path, node[i]);
      //Transform awaits here so that, if in the processing of the node via
      //iterTree() the node has become an await but was not previously, we
      //will still handle it correctly.
      if (isObject(node[i]) && node[i].op === "await") {
        _transformAwait(path, node[i]);
      }
      path.pop();
    }
  }
  else if (isObject(node)) {
    for (var n in node) {
      var o = node[n];
      if (typeof o !== 'object' || o === null) {
        continue;
      }
      path.push(n);
      iterTree(path, o);
      path.pop();
    }
  }

  path.pop();

  if (!isObject(node)) {
    return;
  }

  if (node.hasAwait) {
    if (node.op === "if") {
      _transformIf(path, node);
    }
    else if (node.op === "forList") {
      _transformForList(path, node);
    }
    else {
      throw new Error("Could not handle await for node: " + node.op);
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


function _pathGetNode(path, otherNode) {
  /** Return an object with the node, prop name, and index in the array at prop
      for the given path. */
  var isOk = true;
  if (otherNode) {
    isOk = false;
  }
  for (var j = path.length - 1; j >= 0; j--) {
    if (!isOk) {
      if (path[j] === otherNode.node) {
        isOk = true;
      }
      continue;
    }
    if (typeof path[j] === "object" && !isArray(path[j])) {
      return { node: path[j], prop: path[j + 1], index: path[j + 3] };
    }
  }
  throw new Error("Failed to get path node? " + path);
}


function _pathReplace(path, newNode) {
  //Replace the node at the end of path with newNode
  if (isNumber(path[path.length - 1]) && isArray(path[path.length - 2])) {
    path[path.length - 2][path[path.length - 1]] = newNode;
  }
  else if (isString(path[path.length - 1]) && isObject(path[path.length - 2])) {
    path[path.length - 2][path[path.length - 1]] = newNode;
  }
  else {
    throw new Error("Unrecognized path for replacement: " + path);
  }
}


function _transformAwait(path, node) {
    //Flag everything down path until we hit a lambda or another await block.
    for (var i = path.length - 1; i >= 0; i--) {
      if (!isObject(path[i])) {
        if (isArray(path[i])) {
          //It's convenient that we can attach other variables to arrays...
          path[i].hasAwait = true;
        }
        continue;
      }
      if (path[i].op === "->" || path[i].op === "await") {
        break;
      }
      path[i].hasAwait = true;
    }

    //Absorb our siblings.
    if (!isNumber(path[path.length - 1]) || !isArray(path[path.length - 2])) {
      throw new Error("Await was not in array? " + path);
    }

    node.after = path[path.length - 2].splice(path[path.length - 1] + 1);
}


function _transformIf(path, node) {
  var newAwait = { op: "await", body: [] };
  _pathReplace(path, newAwait);

  //Either then or else could have await; luckily for us, it should just work..?
  newAwait.body.push(node);
}


function _transformForList(path, node) {
  //Most of the work here is done in the translator module; we would do it
  //ourselves, except the need to name the await enclosure used to enact the
  //loop initially deterred that thought.  Another benefit of it being with
  //the forList code is that it's more readily apparent that we have to
  //support the features of forList in both code paths.
  var newAwait = { op: "await", body: [ node ] };
  _pathReplace(path, newAwait);
}
