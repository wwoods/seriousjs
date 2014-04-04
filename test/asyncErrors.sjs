
require assert
require ../ as sjs

describe "await errors", ->
  @timeout 500

  beforeEach ->
    sjs.onAsyncUnhandledError = (e) ->
      console.log "UNHANDLED: #{ e }"
      throw e
    sjs.onAsyncSecondaryError = (e) ->
      console.log "SECONDARY: #{ e }"
  afterEach ->
    sjs.onAsyncUnhandledError = (e) ->
      throw e
    sjs.onAsyncSecondaryError = (e) ->
      console.error(e)


  it "Should not call callback if noerror is specified and an error occurs", async extern ->
    """Should also handle onAsyncUnhandledError"""
    m = sjs.eval """
        require seriousjs as sjs
        errors = []
        sjs.onAsyncUnhandledError = (e) -> errors.push(e)
        f = async extern noerror ->
          throw "message"
        """

    wasCalled = [ false ]
    m.f -> wasCalled[0] = true
    assert.equal false, wasCalled[0]
    assert.deepEqual [ "message" ], m.errors


  it "Should respect onAsyncUnhandledError for no callback", async extern ->
    m = sjs.eval """
        require seriousjs as sjs
        errors = []
        sjs.onAsyncUnhandledError = (e) -> errors.push(e)

        f = async extern ->
          throw "message"
        """

    # No callback!
    m.f()
    assert.deepEqual [ "message" ], m.errors


  it "Should use onAsyncUnhandledError within a separate async context", ->
    # SO, FINALLY GETS CALLED, THEN THE CONTAINING WITH THE ERROR... NOTE THAT t0_19 (f) feeds into t1_9 (d)???
    m = sjs.eval """
        require seriousjs as sjs
        timesThrown = [ 0 ]
        sjs.onAsyncUnhandledError = (e) ->
          timesThrown[0] += 1
          console.log "UNHANDLED: \#{ e }"
          throw e
        d = async ->
          throw "Noodles"
        f = ->
          async
            "abcImOk"
            await d
        """
    # Shouldn't throw; we overrode onAsyncUnhandledError and
    shouldFail = false
    try
      m.f()
      shouldFail = true
    catch e
      assert.equal "Noodles", e
    if shouldFail
      assert.fail "Never threw"
    assert.equal 1, m.timesThrown[0]


  it "Should respect onAsyncSecondaryError", async extern ->
    m = sjs.eval """
        require seriousjs as sjs
        errors = []
        sjs.onAsyncSecondaryError = (e) -> errors.push(e)

        f = async ->
          async
            throw "apples"
          async
            throw "oranges"
          async
            throw "pears"
        """

    await m.f
    catch e
      true
    assert.deepEqual [ "oranges", "pears" ], m.errors
