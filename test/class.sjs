
require assert
require ../src/seriousjs as sjs

describe "Classes", ->
  it "Should work with instanceof", ->
    m = sjs.eval """
        class a

        b = new a()
        r = b instanceof a
        """
    assert.equal true, m.r

  it "Should work without the new operator", ->
    m = sjs.eval """
        class a

        b2 = a()
        r2 = b2 instanceof a
        """
    assert.equal true, m.r2

  it "Should work with constructors", ->
    m = sjs.eval """
        class a
          constructor: (v) ->
            @v = v
        q = a(5)"""
    assert.equal 5, m.q.v

  it "Should work with constructors with @ properties", ->
    m = sjs.eval """
        class a
          constructor: (@v) ->
            pass
        q = a(6)"""
    assert.equal 6, m.q.v

  it "Should support default values in constructors", ->
    m = sjs.eval """
        class a
          constructor: (@v = 8) ->
            pass
        q = a()"""
        showScript: true
    assert.equal 8, m.q.v

  it "Should support default values dict mapped constructors", ->
    m = sjs.eval """
        class a
          constructor: {@v = 8} ->
            pass
        q = a()
        j = a(v: 9)"""
        showScript: true
    assert.equal 8, m.q.v
    assert.equal 9, m.j.v

  it "Should assign functions correctly", ->
    m = sjs.eval """
        class a
          f: () -> 32
        q = a()"""
    assert.equal 32, m.q.f()

  it "Should bind @ to closest class member", ->
    m = sjs.eval """
        class a
          constructor: () ->
            @q = 18

          f: () ->
            g = () -> @q
            return g()
        inst = a()
        """
        showScript: true
    assert.equal 18, m.inst.f()

  it "Should work with class variables", ->
    m = sjs.eval """
        class a
          @v = 6

          inc = () -> @class.v += 1
        q = a()
        q.inc()
        q.inc()
        """
    assert.equal 8, m.a.v

  it "Should throw error for bad member expressions", ->
    try
      m = sjs.eval """
          @value = 5"""
      assert.fail "Didn't raise"
    catch e
      assert.equal "Unexpected member identifier: line 2",
          e.message

