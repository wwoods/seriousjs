/*
 * Classic example grammar, which recognizes simple arithmetic statements like
 * "2*(3+4)". The parser generated from this grammar then computes their value.
 */

{ /* Globals for parsing */

  var debug = false;

  var log = function() {};
  if (debug) {
    log = console.log;
  }

  var indentWidth = 2;
  var indentChar = ' ';
  //Detect indent width
  var allLineStarts = /^[ \t]+/g;
  var lineStart;
  while ((lineStart = allLineStarts.exec(input)) !== null) {
  }
  
  ##utilMethods.js
  
  ##compilerState.js
}

script
  = script:statement_list
    { return { tree: script, features: featuresUsed }; }

_
  /* For something to match _, there must be some sort of breaking character
     (that is, a character not used in an identifier) between the character
     before the current position and the current position.

     Conveniently, this also swallows whitespace.
     
     Additionally, it handles INDENTED_BODY.
     */
  = NEWLINE & { return state.isIndentedBody; } NEWLINE_SAME
  / [ \t]+
  / &{
    var p = _pos();
    if (p === 0 || p === input.length) {
      //End of stream, obviously a breaker
      return true;
    }
    //We're on the new character, so look at it and the one before it to
    //decide if there has been a spacer.
    var chars = input.substring(p - 1, p + 1);
    log(chars.charCodeAt(0) + ", " + chars.charCodeAt(1));
    if (/[,.\(\)\[\]+/*&|^%@!=-]/.test(chars)) {
      return true;
    }
    return false;
  }

INDENT_LEVEL 
  = &{
      var p = _pos();
      for (var i = 0; i < indentWidth; i++) {
        if (input.charAt(p + i) !== indentChar) {
          return false;
        }
      }
      _movePos(p + indentWidth);
      return true; 
    }

NEWLINE
  /* One or several newlines, ending in some indentation */
  = lines:([ \t]* "\n" (INDENT_LEVEL)*)+ {
    state.globalIndent = lines[lines.length - 1][2].length;
    log("Found indent " + state.globalIndent + " in block " + getBlockIndent()
        + " at " + _upos());
    stateUpdated(true);
  }

CHECK_NEWLINE
  /* Since newlines might happen at the end of one or more blocks, but only one 
   * block will actually get a newline character, make it conditional.
   */
  = & { stateRestore(); return true; } NEWLINE? {
      //These happen a lot before indent checks, so restore our state
    }

NEWLINE_SAME
  = CHECK_NEWLINE & {
      return state.globalIndent === getBlockIndent(); 
    }

ASSERT_ON_NEWLINE
  = & {
      /* Since NEWLINE_SAME uses CHECK_NEWLINE, which may or may not consume
         a newline, we want to be sure we are the first content on the line.
         */
      var p = _pos() - 1;
      while (p > 0) {
        var c = input.charAt(p);
        if (c === '\n') {
          return true;
        }
        else if (c !== ' ' && c !== '\t') {
          break;
        }
        p -= 1;
      }
      return false;
    }

BLOCK_START
  = CHECK_NEWLINE & {
      state.blockIndents.push(state.globalIndent);
      stateUpdated(true);
      log("BLOCK START " + state.blockIndents.join(','));
      return true;
    }

BLOCK_END
  = CHECK_NEWLINE & {
      var result = false;
      log("CHECKING BLOCK AT " + state.globalIndent + ", " + getBlockIndent() + ", " + _upos());
      if (state.globalIndent <= getBlockIndent()) {
        result = true;
        state.blockIndents.pop();
        //NOTE - This is a definite event because it is zero-width, and any 
        //alternative parsing without a block end here would have to go
        //back before this token.  Without isDefinite, we can be iterating
        //over the next pos, and unset this state update.
        stateUpdated(true);
        log("BLOCK END " + state.blockIndents.join(','));
      }
      return result;
    }

INDENT
  = CHECK_NEWLINE & { return state.globalIndent === getBlockIndent() + 1; }

INDENTED_BODY
  // Used to wedge two indents into things like multi-line if statements,
  // while still indenting the body only once.
  = & { 
      state.isIndentedBody = true; 
      state.blockIndents.push(state.globalIndent + 2);
      stateUpdated(true);
      return true; 
    }

END_INDENTED_BODY
  = & {
      state.isIndentedBody = false;
      state.blockIndents.pop();
      stateUpdated(true);
      log("Got end body at " + _upos());
      return true;
    }

DOUBLE_INDENT
  = CHECK_NEWLINE & { return state.globalIndent === getBlockIndent() + 2; }

DEINDENT
  = CHECK_NEWLINE & { return state.globalIndent <= getBlockIndent(); }

statement_list
  = BLOCK_START head:statement tail:(NEWLINE_SAME ASSERT_ON_NEWLINE statement)* BLOCK_END {
      var r = [ head ];
      for (var i = 0, m = tail.length; i < m; i++) {
        r.push(tail[i][2]);
      }
      return r;
    }

statement
  /* Elements at this level are either statements or require parenthesis around them */
  = "if" _ INDENTED_BODY cond:expression END_INDENTED_BODY INDENT expr:statement_list {
      return { "op": "if", "condition": cond, "then": expr };
    }
  / expression

expression
  = list_expr
  / head:"a" tail:(_ "a")+ { 
      var r = [ head ];
      for (var i = 0, m = tail.length; i < m; i++) {
        r.push(tail[i][1]);
      }
      return { "op": "alist", "list": r };
    }
  / "a"
  / "(" _ expr:statement _ ")" { return expr; }

ARG_SEP
  = INDENT "," _
  / INDENT
  / _ "," INDENT
  / _ "," _

arguments
  = ARG_SEP? elements:(expression (ARG_SEP expression)*)? ARG_SEP? 
      NEWLINE_SAME? {
    var r = [];
    if (elements) {
      r.push(elements[0]);
      var elist = elements[1];
      for (var i = 0, m = elist.length; i < m; i++) {
        r.push(elist[i][1]);
      }
    }
    return r;
  }

list_expr
  = "[" _ args:arguments _ "]"? {
    return { "op": "list", "elements": args };
  }

