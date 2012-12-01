//We need to track our state at various different _possible_ parser states.
//We push after any changes, so that if our change catches, it will be
//there for future generations.
var states = {};

var state = { globalIndent: 0, blockIndents: [ 0 ] };
states[-1] = deepCopy(state);
var featuresUsed = {};

function getBlockIndent() {
  return state.blockIndents[state.blockIndents.length - 1];
}

function stateUpdated(isDefinite) {
  //If state was updated at pos, we want to set the _definite_ state at pos + 1.
  //isDefinite overrides this behavior - does not add one to pos, since it's the
  //  result of an absolute set via newline.  Should also
  //  be set for anything that changes state and might be
  //  zero width.  We don't want possible permutations of
  //  the next input character undoing the zero-width
  //  modifications.
  var realPos = _pos();
  if (!isDefinite) {
    realPos += 1;
  }
  states[realPos] = state;
  state = deepCopy(state);
  log("State saved at " + realPos);
}

function stateRestore() {
  //Restore state closest to but not after pos, and delete anything after 
  //it, since that is from a path that was rejected.
  var toDelete = [];
  var closePos = -1;
  for (var cPos in states) {
    cPos = parseInt(cPos);
    if (cPos > _pos()) {
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
  state = deepCopy(state);
  if (closePos > 0) {
    log("Restored state from " + closePos + " at " + _upos());
  }
}
