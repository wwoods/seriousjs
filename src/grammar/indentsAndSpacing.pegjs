_ "white space"
  /* For something to match _, there must be some sort of breaking character
     (that is, a character not used in an identifier) between the character
     before the current position and the current position.

     Conveniently, this also swallows whitespace.
     
     Additionally, it handles INDENTED_BODY.
     */
  = & { return getBlock().isContinuation; } NEWLINE NEWLINE_SAME
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
    //Note - spaces are NOT part of this regex, since those should only be
    //caught by the expression before this one (which swallows them rather
    //than just accepting them as this code path does)
    if (/[,.\(\)\[\]+\*&|^%@!=:-]/.test(chars)) {
      return true;
    }
    return false;
  }

INDENT_LEVEL "indent"
  = &{
      var p = _pos();
      for (var i = 0; i < indentWidth; i++) {
        if (input.charAt(p + i) !== indentChar) {
          return false;
        }
      }
      _advance(indentWidth);
      return true; 
    }

NEWLINE "newline"
  /* One or several newlines, ending in some indentation */
  = lines:([ \t]* COMMENT? "\n" (INDENT_LEVEL)*)+ {
    //Add comments to last state, since newlines are after the comments
    for (var i = 0, m = lines.length; i < m; i++) {
      if (lines[i][1]) {
        state.comments.push(lines[i][1]);
      }
    }
    var indent = lines[lines.length - 1][3].length;
    log("Found indent " + indent + " in block " + getBlockIndent());
    stateUpdate(indent);
  }
  
COMMENT "comment"
  = "###" & {
        var p = _pos();
        var end = input.indexOf('###', p);
        if (end < 0) {
          return false;
        }
        _advance(end - p);
        return true; 
        } "###"
   / "#" [^\n]+

CHECK_NEWLINE
  /* Since newlines might happen at the end of one or more blocks, but only one 
   * block will actually get a newline character, make it conditional.
   */
  = & { stateRestore(); return true; } NEWLINE? {
      //These happen a lot before indent checks, so restore our state
    }

NEWLINE_SAME "equal indentation"
  = CHECK_NEWLINE ASSERT_ON_NEWLINE & {
      log("  (Checking for same line on " + _upos() 
          + " for " + state.indent + " against " + getBlockIndent() 
          + ")"); 
      return state.indent === getBlockIndent(); 
    }

ASSERT_ON_NEWLINE "newline"
  = & {
      /* Since NEWLINE_SAME uses CHECK_NEWLINE, which may or may not consume
         a newline, we want to be sure we are the first content on the line.
         */
      var p = _pos() - 1;
      while (p >= 0) {
        var c = input.charAt(p);
        if (c === '\n') {
          return true;
        }
        else if (c !== indentChar) {
          return false;
        }
        p -= 1;
      }
      //End of stream, OK.
      return true;
    }

BLOCK_START
  //Whenever this is used, anything between it and a corresponding BLOCK_END
  //must be in a conditional ()? group.
  = CHECK_NEWLINE & {
      return indentBlockStart(0);
    }
    
INDENT_BLOCK_START
  = CHECK_NEWLINE ASSERT_ON_NEWLINE & {
      return indentBlockStart(1);
    }
    
MAYBE_INDENT_BLOCK_START
  = CHECK_NEWLINE & {
      return indentBlockStart(1);
    }

BLOCK_END
  = CHECK_NEWLINE & {
      return indentBlockStop(true);
    }
    
MAYBE_BLOCK_END
  //We don't need the block to match, we just want to pop state.
  = & {
      return indentBlockStop(false);
    }

INDENT
  = CHECK_NEWLINE & { 
      log("Looking for indent to " + (getBlockIndent() + 1) + " at " + _upos());
      return state.indent === getBlockIndent() + 1; 
    }
    
CONTINUATION_START
  = & { return indentBlockStart(2, { isContinuation: true }); }
  
CONTINUATION_END
  = & { return indentBlockStop(false); }

