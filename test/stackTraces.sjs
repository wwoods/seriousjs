
require assert
require path
require util
require ../ as sjs

describe "Stack Traces", ->
  checkStack = (part, func) ->
    try
      func()
      assert.fail "Didn't throw?"
    catch e
      if not util.isArray(part)
        part = [ part ]
      for p in part
        if e.stack.indexOf(p) < 0
          assert.fail "Stack did not include '#{ p }': #{ e.stack }"

  getFile = (p) -> path.join(__dirname, "stackTraceScripts", p)

  it "Should work within evalFile", ->
    checkStack "/instaThrow.sjs", -> sjs.evalFile getFile("instaThrow.sjs")

  it "Should work within imports", ->
    checkStack(
        [ "/requireInstaThrow.sjs", "/instaThrow.sjs" ]
        -> sjs.evalFile getFile("requireInstaThrow.sjs")

