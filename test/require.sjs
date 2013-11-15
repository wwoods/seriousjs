
require assert
require url
require ../ as sjs

describe "require statement", ->
  it "should work", ->
    assert.equal "/hey/you",
        sjs.eval("require url\nm = url.resolve('/hey/there', 'you')").m

  it "should support as", ->
    assert.equal "/hey/you",
        sjs.eval("require url as lru\nm = lru.resolve('/hey/there', 'you')").m

  it "should support for", ->
    # Note that we also keep the name imported!  Test that too.
    assert.equal "/hey/you/world",
        sjs.eval("""
            require url for resolve, parse
            m = resolve('/hey/there', 'you') + url.resolve('/nobody', 'world')
            """).m

  it "should support as with for", ->
    assert.equal "/hey/you/world",
        sjs.eval("""
            require url as lru for resolve, parse
            m = resolve('/hey/there', 'you') + lru.resolve('/nobody', 'world')
            """).m

  it "Should work after a module docstring", ->
    m = sjs.eval("""
            '''Hello, world'''
            require url for resolve, parse
            """)
    assert.equal "Hello, world", m.help
    assert.equal "Hello, world", m.__doc__
    # Be extra sure it was a require statement, not a func call
    assert.equal url, m.url
    assert.equal url.resolve, m.resolve
    assert.equal url.parse, m.parse
