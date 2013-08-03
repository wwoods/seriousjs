
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
    checkStack "/instaThrow.sjs:3", -> sjs.evalFile getFile("instaThrow.sjs")

  it "Should work within imports", ->
    checkStack(
        [ "/requireInstaThrow.sjs:2", "/instaThrow.sjs:3" ]
        -> sjs.evalFile getFile("requireInstaThrow.sjs")

  it "Should have right line number", ->
    checkStack(
        [ "at /eval:2" ]
        -> sjs.eval """hey = 'there'\nfail2"""
