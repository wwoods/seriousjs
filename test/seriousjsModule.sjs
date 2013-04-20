
require assert
require ../ as sjs

describe "the seriousjs module", () ->
  it "should work from eval() without another dependency", () ->
    """To clarify, if seriousjs is installed globally, and we have an app
    that wants to require seriousjs, and the app itself is run through
    "seriousjs app.sjs", then we do not want seriousjs to be a required
    dependency for app.sjs, since that would mean that node will need to
    install its own copy.
    """
    # Just running the code is enough, but why not make an eval loop
    assert.equal 8888,
        (sjs.eval "require seriousjs as sjs\nq = sjs.eval('b = 8888').b").q
