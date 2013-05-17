
require assert
require ../ as sjs

describe "Classes", ->
  it "Should work with instanceof", ->
    m = sjs.eval """
        class a

        b = new a()
        r = b instanceof a
        """
    assert.equal true, m.r

  it "Should throw error without the new operator", ->
    m = sjs.eval """
        class a
        """
    assert.throws -> m.a()

  it "Should work with constructors", ->
    m = sjs.eval """
        class a
          constructor: (v) ->
            @v = v
        q = new a(5)"""
    assert.equal 5, m.q.v

  it "Should not auto-return from constructors", ->
    m = sjs.eval """
        class a
          constructor: () ->
            @test = []
        q = new a()
        """
    # If the constructor returns, then q will be an array since that is what
    # the method returned.
    assert.equal true, m.q instanceof m.a

  it "Should work with constructors with @ properties", ->
    m = sjs.eval """
        class a
          constructor: (@v) ->
            return
        q = new a(6)"""
    assert.equal 6, m.q.v

  it "Should support default values in constructors", ->
    m = sjs.eval """
        class a
          constructor: (@v = 8) ->
            return
        q = new a()"""
    assert.equal 8, m.q.v

  it "Should support default values dict mapped constructors", ->
    m = sjs.eval """
        class a
          constructor: {@v = 8} ->
            return
        q = new a()
        j = new a(v: 9)"""
    assert.equal 8, m.q.v
    assert.equal 9, m.j.v

  it "Should assign functions correctly", ->
    m = sjs.eval """
        class a
          f: () -> 32
        q = new a()"""
    assert.equal 32, m.q.f()

  it "Should support inheritance of instance vars", ->
    m = sjs.eval """
        class a
          b: 'val'
          dict: {}
        class b extends a
        c = new b()
        d = new b()
        d.b += "lav"
        d.dict.value = "test"
        """
    assert.equal "val", m.c.b
    assert.equal "vallav", m.d.b
    assert.equal "test", m.d.dict.value
    assert.equal "test", m.c.dict.value

  it "Should bind @ to closest class member", ->
    m = sjs.eval """
        class a
          constructor: () ->
            @q = 18

          f: () ->
            g = () -> @q
            return g()
        inst = new a()
        """
    assert.equal 18, m.inst.f()

  it "Should work with @ for this", ->
    m = sjs.eval """
        class a
          b: () ->
            return @
        q = new a()
        """
    assert.equal m.q, m.q.b()

  it "Should allow @ to be used in unbound methods", ->
    m = sjs.eval """
        unbound = () -> @value
        """
    assert.equal 42, m.unbound.call(value: 42)

  it "Should disallow @ in class definitions", ->
    assert.throws -> sjs.eval """
        class a
          @b: 8
        """

  it "Should disallow @class in class definitions", ->
    assert.throws -> sjs.eval """
        class a
          @class.b: 8
        """

  it "Should disallow @class outside of class definitions", ->
    assert.throws -> sjs.eval """
        a = () ->
          @class.b: 8
        """

  it "Should work with class variables", ->
    """Note that class variables actually operate on the prototype, since
    prototypes are inherited but the classes themselves are not.
    """
    m = sjs.eval """
        class a
          v: 6

          inc: () -> @class.v += 1
        q = new a()
        q.inc()
        q.inc()
        """
    assert.equal 8, m.a.prototype.v

  it "Should throw error for bad member expressions", ->
    try
      m = sjs.eval """
          @value = 5"""
      assert.fail "Didn't raise"
    catch e
      assert.equal "Unexpected member identifier: line 2",
          e.message

  it "Should work with extends", ->
    m = sjs.eval """
        class a
          hey: 88
          method: () -> @hey + 6
        class b extends a
        m = new b()
        """
    assert.equal 88, m.m.hey
    assert.equal 94, m.m.method()
    assert.equal true, m.m instanceof m.b
    assert.equal true, m.m instanceof m.a

  it "Should work with extends of any valid ID path", ->
    m = sjs.eval """
        a = {}
        class innerA
          hey: 89
        a.innerA = innerA
        class b extends a.innerA
        m = new b()
        """
    assert.equal 89, m.m.hey

  it "Should throw an error without new for extended classes", ->
    m = sjs.eval """
        class a
        class b extends a
        """
    assert.throws -> m.a()
    assert.throws -> m.b()

  it "Should disallow = in body", ->
    assert.throws -> sjs.eval """
        class a
          b = 8
        """

  it "Should not break like it did once", ->
    m = sjs.eval """
        class a
          innerDict:
              b: 6
              c: 7
        inst = new a()
        """
    assert.equal 6, m.inst.innerDict.b

