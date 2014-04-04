
var self = this;
var translator = require('./translator.js');
var writer = require('./writer.js');
var asyncTransform = require('./asyncTransform.js');
var base64 = require('./base64.js');

var _DEBUG_SOURCEMAP = false;

this.cachedSourceMaps = {};

this.cleanupTree = function(tree) {
  for (var n in tree) {
    var o = tree[n];
    if (typeof o !== 'object' || o === null) {
      continue;
    }
    self.cleanupTree(o);
    if (o.op === 'atom' && o.chain.length === 0) {
      tree[n] = o.atom;
    }
  }
};


this.compile = function(parser, text, options) {
  var tree;
  if (!options) {
    options = {};
  }

  //All text must end in a newline; however, this is a grammar limitation, and
  //we won't inflict it on users.
  if (text.charAt(text.length - 1) !== '\n') {
    text += '\n';
  }

  try {
    tree = parser.parse(text, { });
  }
  catch (e) {
    var header = 'Line ' + e.line + ', column ' + e.column;
    if (options.filename) {
      header += ' of ' + options.filename;
    }
    e.message = header + ': ' + e.message;
    throw e;
  }

  self.cleanupTree(tree);
  if (options.debugTreeCallback) {
    options.debugTreeCallback(tree);
  }

  var requires = [];
  if (options.amdModule) {
    //Pull statements out of tree.tree
    for (var i = 0, m = tree.tree.length; i < m; i++) {
      var n = tree.tree[i];
      if (n.op === "require") {
        requires.push(n);
        tree.tree.splice(i, 1);
        i -= 1;
        m -= 1;
      }
    }
  }

  var writerObj = new writer.Writer();
  var translatorObj = new translator.Translator(writerObj, options);
  var translatorTree = asyncTransform.transformTree(tree);
  translatorObj.translate(translatorTree);

  var header = '', footer = '';
  var smVar = "{{{__sjs_sourceMap__}}}";
  var smName = options.filename || "eval";
  if (options.sourceMap) {
    //Source map support...
    header += "//# sourceMappingURL=data:application/json;base64," + smVar + "\n";
    header += '"use strict";\n';
    if (options.amdModule) {
      //Browser
    }
    else {
      //NodeJS
      //Error.prepareStackTrace gets reset in child modules sometimes, so it's
      //best to re-set it to the one we need.
      header += "var __sjs_sms = require('source-map-support');";
      header += 'Error.prepareStackTrace = __sjs_sms.prepareStackTrace;\n';
    }
  }
  else {
    header += '"use strict";\n';
  }

  if (options.amdModule) {
    var amdParts = self._makeScriptAmd(requires);
    header += amdParts[0];
    //Bring in our language module for e.g. async throws.
    header += "var __sjs_seriousjs = seriousjs;\n";
    footer += amdParts[1];
  }
  else {
    header += "var __sjs_seriousjs = require('seriousjs');\n";
  }

  var result = writerObj.getOutput(header, footer, options);
  if (options.sourceMap) {
    var realMap = new options.sourceMap.SourceMapGenerator({ file: smName });
    for (var i = 0, m = result.map.length; i < m; i++) {
      var r = result.map[i];
      realMap.addMapping({
          generated: { line: r[0], column: r[1] },
          original: { line: r[2], column: r[3] },
          source: smName
      });
    }
    realMap.setSourceContent(smName, text);
    var stringMap = realMap.toString();
    result.map = stringMap;

    if (!options.amdModule) {
      //NodeJS source-map-support module requires us to have access to our
      //source maps via our own methods for eval.
      self.cachedSourceMaps[smName] = JSON.parse(stringMap);
      _DEBUG_SOURCEMAP && console.log("Stored " + smName);
    }
    var b64 = base64.encode(stringMap);
    result.js = result.js.replace(smVar, b64);
  }

  if (options.debugCallback) {
    options.debugCallback(result.js, tree);
  }
  return result
};


this._makeScriptAmd = function(requires) {
  /** Bootstrap a script with the given requires to AMD format.  Note that we
    really shouldn't insert any newlines before script, since that would screw
    up our mapping.

    Returns a [ header, footer ] to wrap the code in.
    */
  var header = [ "define([" ], footer = [];
  var varNames = [];
  var forPartAssigns = [];
  for (var i = 0, m = requires.length; i < m; i++) {
    var reqChain = requires[i].defs;
    for (var j = 0, k = reqChain.length; j < k; j++) {
      if (varNames.length > 0) {
        header.push(",");
      }
      var fromPart = reqChain[j].from;
      if (fromPart.indexOf('!') < 0) {
        //Assume sjs loader for convenience.
        fromPart = "sjs!" + fromPart;
      }
      else if (fromPart.indexOf("js!") === 0) {
        fromPart = fromPart.slice(3);
      }
      header.push("'" + fromPart + "'");
      varNames.push(reqChain[j].as);

      var forParts = reqChain[j].forParts;
      if (forParts !== null) {
        for (var l = 0, n = forParts.length; l < n; l++) {
          var fpId = forParts[l].id;
          forPartAssigns.push(fpId + "=" + "this." + fpId
              + "=" + reqChain[j].as + "." + fpId);
        }
      }
    }
  }
  header.push("],function(");
  header.push(varNames.join(","));
  header.push(') {"use strict";var exports = {};(function(exports){');
  if (forPartAssigns.length > 0) {
    header.push("var ");
    header.push(forPartAssigns.join(","));
    header.push(";");
  }
  footer.push("\n}).call(exports, exports);return exports});");

  return [ header.join(""), footer.join("") ];
};
