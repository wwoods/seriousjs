/*
 * Classic example grammar, which recognizes simple arithmetic statements like
 * "2*(3+4)". The parser generated from this grammar then computes their value.
 */

{ /* Globals for parsing */

  var debug = false;

  //Modified console.log; returns true always and can be turned off
  var log = function() { return true; };
  if (debug) {
    log = function(m) {
      m = Array(depth * tabspace).join(" ") + m;
      if (pos > 0) {
        m += " at " + _upos();
      }
      console.log(m);
      return true;
    }
    var tIndent = "NEWLINE CHECK_NEWLINE ASSERT_ON_NEWLINE INDENT_BLOCK_START ";
    tIndent += "BLOCK_END";
    options.trace = tIndent + " list_literal";
    options.trace = true;
  }

  var indentWidth = 2;
  var indentChar = ' ';
  //Detect indent width
  var steps = { 2: 0, 4: 0 };
  var charCounts = { ' ': 0, '\t': 0 };
  var lineStartPos = 0; //First line is a newline
  var lastIndent = 0;
  var lastLineStr = '';
  var openers = /[\[\(=+\/*,]|-[^>]|'''|"""/g;
  var closers = /([\]\)]|->)/g;
  var interests = /[^a-zA-Z0-9]/;
  var lastLineWasContinuation = false;
  while (lineStartPos < input.length && lineStartPos >= 0) {
    var nextPos = input.indexOf('\n', lineStartPos);
    var lineStr = input.substring(lineStartPos, nextPos);

    //Is this an empty line?
    if (lineStr.match(/^[ \t\n\r]*$/)) {
      lineStartPos = nextPos + 1;
      continue;
    }

    var lineIndentChars = '';
    var i = 0;
    while (i < lineStr.length) {
      var lineChar = lineStr[i];
      if (lineChar === ' ' || lineChar === '\t') {
        lineIndentChars += lineChar;
      }
      else {
        break;
      }
      i += 1;
    }

    //Regardless of if it's an indent or not, reset whether or not we are
    //currently on a continuation line.
    var lastLastWasContinuation = lastLineWasContinuation;
    lastLineWasContinuation = false;

    charCounts[lineIndentChars[0]] += 1;
    var indentChars = lineIndentChars.length;
    var diff = indentChars - lastIndent;
    if (diff > 0) {
      //Only track indents, and see if it's a continuation or a block
      //indent.

      //Find indicators of a continuation at the beginning of the line we're
      //looking at.
      var beforeCharsEnd = lineStr.indexOf('#');
      if (beforeCharsEnd < 0) {
        beforeCharsEnd = lineStr.length;
      }
      var beforeChars = 0;
      while (beforeChars < beforeCharsEnd) {
        if (!interests.test(lineStr[beforeChars])) {
          break;
        }
        beforeChars += 1;
      }

      //Find indicators of a continuation at the end of the line before the
      //one we're looking at
      var afterCharsEnd = lastLineStr.indexOf('#');
      if (afterCharsEnd < 0) {
        afterCharsEnd = lastLineStr.length;
      }
      var afterChars = afterCharsEnd - 1;
      while (afterChars >= 0) {
        if (!interests.test(lastLineStr[afterChars])) {
          afterChars += 1;
          break;
        }
        afterChars -= 1;
      }

      var interestChars = lastLineStr.substring(afterChars, afterCharsEnd)
          + lineStr.substring(0, beforeChars);

      var openCharList = "";
      var closeCharList = "";
      var openChars = 0, closeChars = 0, m;
      while ((m = openers.exec(interestChars)) !== null) {
        openChars += 1;
        openCharList += m[0];
      }
      while ((m = closers.exec(interestChars)) !== null) {
        closeChars += 1;
        closeCharList += m[0];
      }

      if (openChars > closeChars) {
        //Continuation, double indent
        lastLineWasContinuation = true;
        if (!lastLastWasContinuation) {
          diff /= 2;
        }
      }
      if (diff == 2 || diff == 4) {
        steps[diff] += 1;
      }
    }
    lastIndent = indentChars;
    lastLineStr = lineStr;
    lineStartPos = nextPos + 1;
  }

  log("Saw steps: " + steps[2] + ", " + steps[4]);
  if (charCounts['\t'] > charCounts[' ']) {
    indentChar = '\t';
    indentWidth = 1;
    log("Using tabs as indents");
  }
  else if (steps[4] > steps[2]) {
    indentWidth = 4;
    log("Using 4 spaces as indents");
  }

  ##include utilMethods.js

  ##include compilerState.js
}

script
  = BLOCK_START docString:(string NEWLINE_SAME)? headers:header_list? script:statement_list? BLOCK_END
    {
      var r = [];
      if (headers) {
        for (var i = 0, m = headers.length; i < m; i++) {
          r.push(headers[i]);
        }
      }
      for (var i = 0, m = script.length; i < m; i++) {
        r.push(script[i]);
      }
      return { tree: r, help: docString && docString[0], comments: allComments };
    }

##include async.pegjs
##include indentsAndSpacing.pegjs
##include numbers.pegjs
##include unicode.pegjs
##include reservedWords.pegjs
##include identifier.pegjs

header_list
  //Already and necessarily in the global block.
  = head:header_statement
        tail:(NEWLINE_SAME header_statement)* {
      return getArray(head, tail, 1);
    }

header_statement
  = CONTINUATION_START stmt:header_statement_inner? CONTINUATION_END
      & { return stmt; } { return R(stmt); }

header_statement_inner
  = "require" _ reqs:require_chain {
      return { "op": "require", "defs": reqs };
    }
  / "exports" _ head:Identifier tail:(ARG_SEP Identifier)* {
      return { "op": "exports", "exports": getArray(head, tail, 1) };
    }

require_chain
  = head:require_import tail:(ARG_SEP require_import)* {
      return getArray(head, tail, 1);
    }

require_import
  = from:require_import_from as:(_ "as" _ Identifier)?
      fr:(_ "for" _ Identifier (ARG_SEP Identifier)*)? {
    var a = null;
    if (as) {
      a = as[3].id;
    }
    else {
      a = from.defaultAs;
    }
    var forParts = null;
    if (fr) {
      forParts = getArray(fr[3], fr[4], 1);
    }
    return { "op": "require_import", "from": from.from, "as": a,
        "forParts": forParts };
  }

require_import_from
  = chs:string_for_require+ {
      var s = chs.join("");
      var defaultName = /([a-zA-Z0-9_]+)\/?$/.exec(s);
      return {
        from: s,
        defaultAs: defaultName && defaultName[1] || null
      };
    }

##include statement.pegjs
##include assign.pegjs
##include class.pegjs
##include expression.pegjs
##include lambda.pegjs
##include string.pegjs

ARG_SEP
  = NEWLINE_SAME "," _ & { return log("Parsed arg_sep1"); }
  / NEWLINE_SAME & { return log("Parsed arg_sep2"); }
  / _ "," NEWLINE_SAME & { return log("Parsed arg_sep3"); }
  / _ "," _ & { return log("Parsed arg_sep4"); }

arguments_delimited
  //A list of arguments delimited by something like [] or ().
  //May go into an indented body.
  = args:arguments_delimited_inner?
        & { return args; } {
      return args;
    }

arguments_delimited_inner
  //Note - we might have leading and trailing whitespace.
  = _? ARG_SEP? args:arguments_list?
        ARG_SEP? _? {
      if (!args) {
        return [];
      }
      return args;
    }

arguments_list
  //A list of arguments that has no delimiter
  = head:argument tail:(ARG_SEP argument)* {
      return getArray(head, tail, 1);
    }

argument
  = head:dict_argument tail:(ARG_SEP dict_argument)* {
    return { op: "dict", elements: getArray(head, tail, 1) };
  }
  / CONTINUATION_OPEN expr:expression? CONTINUATION_END? & { return expr; } {
      return expr;
    }

