
var Closure;
this.Closure = Closure = (function() {
  function Closure() {
    this.vars = {};
    this.funcArgs = {};
  }
  
  Closure.prototype.toString = function() {
    var r = '';
    var emitted = {};
    for (var v in this.vars) {
      if (v in this.funcArgs) {
        continue;
      }
      if (r === '') {
        r += 'var ';
      }
      else {
        r += ',';
      }
      r += v;
    }
    r += ';';
    return r;
  };
  
  return Closure;
})();

this.Writer = (function() {
  function Writer() {
    this._indent = -1; //incremented to 0 at startClosure
    this._output = [];
    this._closures = [];
    this._line = 1;
    this._isInArgs = false;
    
    this.startClosure();
  }
  
  Writer.prototype.getOutput = function() {
    var output = [];
    for (var i = 0, m = this._output.length; i < m; i++) {
      output.push(this._output[i].toString());
    }
    return output.join("");
  };
  
  Writer.prototype.startContinuation = function() {
    this._indent += 2;
  };
  
  Writer.prototype.endContinuation = function() {
    this._indent -= 2;
  };
  
  Writer.prototype.startClosure = function() {
    //Returns the created Closure object; hasn't pushed it to output yet
    var c = new Closure();
    this._closures.push(c);
    this._indent += 1;
    return c;
  };
  
  Writer.prototype.endClosure = function() {
    this._closures.pop();
    this._indent -= 1;
  };
  
  Writer.prototype.startArgs = function() {
    this._isInArgs = true;
    this._indent += 1;
  };
  
  Writer.prototype.endArgs = function() {
    this._indent -= 1;
    this._isInArgs = false;
  };
  
  Writer.prototype.goToLine = function(l) {
    while (this._line < l) {
      this.newline();
    }
  };
  
  Writer.prototype.variable = function(id) {
    var c = this._closures[this._closures.length - 1];
    if (!this._isInArgs) {
      c.vars[id] = true;
    }
    else {
      c.funcArgs[id] = true;
    }
    this._output.push(id);
  };
  
  Writer.prototype._getIndent = function() {
    var r = '';
    for (var i = 0; i < this._indent; i++) {
      r += '  ';
    }
    return r;
  };
  
  Writer.prototype.newline = function() {
    this._output.push('\n' + this._getIndent());
    this._line += 1;
  };
  
  Writer.prototype.write = function(w) {
    this._output.push(w);
  }
  
  return Writer;
})();