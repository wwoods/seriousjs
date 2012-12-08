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
    //Note - spaces are NOT part of this regex, since those should only be
    //caught by the expression before this one (which swallows them rather
    //than just accepting them as this code path does)
    if (/[,.\(\)\[\]+\*\/&|^%@!=:{}<>-]/.test(chars)) {
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
  = lines:([ \t]* COMMENT? "\r"? "\n" INDENT_LEVEL*)+ {
    //Add comments to last state, since newlines are after the comments
    for (var i = 0, m = lines.length; i < m; i++) {
      if (lines[i][1]) {
        state.comments.push(lines[i][1]);
      }
    }
    var indent = lines[lines.length - 1][4].length;
    if (state.indent === null) {
      state.indent = indent;
      for (var i = 0, m = blockIndents.length; i < m; i++) {
        blockIndents[i].indent += indent;
      }
      log("Using indents of " + indentWidth + " base " + indent);
    }
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
  = & { stateRestore(); return true; } n:NEWLINE? {
      //These happen a lot before indent checks, so we restore our state
      //before executing the newline.
      //Also, if n failed and the state doesn't have an indent at this time,
      //the script starts at no indent.
      if (!n && state.indent === null) {
        state.indent = 0;
        for (var s in states) {
          states[s].indent = state.indent;
        }
      }
    }


NEWLINE_SAME "indentation"
  = CHECK_NEWLINE ASSERT_ON_NEWLINE & {
      log("(Checking for same line on " + _upos() 
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
    
    
ASSERT_ON_ENDLINE "end of line"
  = CHECK_NEWLINE ASSERT_ON_NEWLINE 
    

BLOCK_START
  //Whenever this is used, anything between it and a corresponding BLOCK_END
  //must be in a conditional ()? group.
  = CHECK_NEWLINE & {
      return indentBlockStart(0);
    }
    
    
INDENT_BLOCK_START
  = & {
        return indentBlockStart(1);
      } line:NEWLINE_SAME? &{
        if (!line) {
          indentBlockStop(false);
          return false;
        }
        return true;
      }


BLOCK_END
  = CHECK_NEWLINE & {
      return indentBlockStop(true);
    }


INDENT
  = CHECK_NEWLINE & { 
      log("Looking for indent to " + (getBlockIndent() + 1) + " at " + _upos());
      return state.indent === getBlockIndent() + 1; 
    }

    
CONTINUATION_START
  = CHECK_NEWLINE ASSERT_ON_NEWLINE 
      & { return indentBlockStart(2, { isContinuation: true }); }

  
CONTINUATION_END
  = & { return indentBlockStop(false); } ASSERT_ON_ENDLINE

