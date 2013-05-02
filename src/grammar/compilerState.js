//We need to track our state at various different parser states.  Specifically,
//indentation and things that are absolute to a given character position.
//Just in case we go down a bad parse route, we also want to erase data after
//our current position when we restore.
var states = {};

//Track all comments so that they're attached to relevant nodes
var allComments = [];

//Some parse states happen inside a "block" - that is, a set of lines with
//the same or similar indentation.  We keep track of these in this array,
//which will always be maintained regardless of good / bad parse states
//by using a ()? grouping for anything between the push and the pop.
var blockIndents = [ { indent: 0 } ];

var state = { indent: null, line: 1, comments: [] };
states[-1] = deepCopy(state);

function getBlock() {
  if (blockIndents.length === 0) {
    throw new Error("Failed to find block!  At " + _upos());
  }
  return blockIndents[blockIndents.length - 1];
}

function getBlockIndent() {
  return getBlock().indent;
}

function getBlockList() {
  var bi = [];
  for (var i = 0, m = blockIndents.length; i < m; i++) {
    bi.push(blockIndents[i].indent);
  }
  return "Blocks: " + bi.join(',');
}

function stateUpdate(newIndent) {
  //State was updated, set it.
  var p = _pos();
  state = {
    indent: newIndent,
    line: line(),
    comments: []
  };
  states[p] = state;
  log("State saved at " + p);
}

function stateRestore() {
  //Restore state closest to but not after pos, and delete anything after
  //it, since that is from a path that was rejected.
  var p = _pos();
  var toDelete = [];
  var closePos = -1;
  for (var cPos in states) {
    cPos = parseInt(cPos);
    if (cPos > p) {
      toDelete.push(cPos);
    }
    else if (cPos >= closePos) {
      closePos = cPos;
      state = states[cPos];
    }
  }
  for (var i = 0, m = toDelete.length; i < m; i++) {
    delete states[toDelete[i]];
  }

  //Also clean up blocks that "haven't been started" yet.  We must
  //do this because the failure path for BLOCK_END pushes the block
  //back.
  var m = blockIndents.length - 1;
  for (var i = m; i >= 0; --i) {
    if (blockIndents[i].pos > p) {
      blockIndents.pop();
    }
    else {
      if (i < m) {
        log("Trimmed " + (m - i) + " bad block(s)");
      }
      break;
    }
  }

  //Clean up comments
  for (var i = 0, m = allComments.length; i < m; i++) {
    if (allComments[i].startPos > p) {
      allComments.splice(i, 1);
      i -= 1;
      m -= 1;
    }
  }

  state = deepCopy(state);
  if (closePos >= 0) {
    log("Restored state from " + closePos);
  }
}

function indentBlockStart(levels, options) {
  //Returns true; when called, indentBodyStop() MUST be called even if the
  //match fails (do this with a ()? expression).

  if (!options) {
    options = {};
  }

  //Ensure we aren't out of sync due to failed rules
  stateRestore();

  var bpos = _pos();
  var baseBlockIndex = blockIndents.length - 1;
  if (!options.isContinuation) {
    //Starting a non-continuation; we need to indent from either the last-used
    //continuation, or the last non-continuation indent.
    while (state.indent < blockIndents[baseBlockIndex].indent
        && blockIndents[baseBlockIndex].isContinuation) {
      baseBlockIndex -= 1;
    }
  }
  else if (blockIndents[baseBlockIndex].isContinuation) {
    //Continued continuations should only be one indent in
    levels = 1;
    //And if the current indent is before the last continuation, then we
    //shouldn't indent again, as the two continuations are strongly
    //coupled.
    //Without this logic, the following code:
    //(3
    //    + 8
    //Requires an extra indent in the + 8 line, or it becomes (3) + 8.
    if (state.indent < blockIndents[baseBlockIndex].indent) {
      levels = 0;
    }
  }
  var baseBlock = blockIndents[baseBlockIndex];

  var block = {
    indent: baseBlock.indent + levels,
    pos: bpos
  };
  if (getBlock().pos === block.pos) {
    log("POSSIBLE DUPLICATE");
  }
  if (options.isContinuation) {
    block.isContinuation = true;
  }
  blockIndents.push(block);
  if (debug) {
    var bi = [];
    for (var i = 0, m = blockIndents.length; i < m; i++) {
      bi.push(blockIndents[i].indent);
    }
    var m = "BLOCK START ";
    if (block.isContinuation) {
      m += "CONTINUATION ";
    }
    log(m);
    log(getBlockList());
  }
  return true;
}

function indentBlockContinue() {
  //For try & rollback with multiple scopes only
  stateRestore();
  var baseBlock = getBlock();
  var block = deepCopy(baseBlock);
  blockIndents.push(block);
  return true;
}

function indentBlockStop(mustMatch) {
  var result = false;
  var oldBlock = blockIndents.pop();
  //If a block ends, that means that we must be de-indenting.  If we don't
  //use min, then a block can be followed by a continuation (since continuations
  //are 2 indents), which is an incorrect parsing.
  var expectedIndent = Math.min(oldBlock.indent, getBlockIndent());
  log(getBlockList());
  log("CHECKING BLOCK AT " + state.indent + ", " + expectedIndent);
  if (!mustMatch) {
    result = true;
  }
  else if (state.indent <= expectedIndent) {
    result = true;
  }
  else {
    //Not a match!  We want to push our block back on the stack, since
    //a negative result might trigger PegJS to go back and try another
    //parsing path, which could result in us being back here.
    //So.... this was causing issues, see test in parensAndLines.sjs,
    //"Should work with complicated lambda continuations".

    //Commenting it out doesn't fail any tests, so it's very possible this
    //situation was fixed by something else.
    //blockIndents.push(oldBlock);
  }
  return result;
}


function continuationPop() {
  //If the top block is a continuation, pop it and return. Otherwise return
  //null.  For use by CONTINUATION_POP followed by continuationPush.
  if (getBlock().isContinuation) {
    return blockIndents.pop();
  }
  return null;
}


function continuationPush(saved) {
  if (saved === null) {
    return;
  }
  blockIndents.push(saved);
}
