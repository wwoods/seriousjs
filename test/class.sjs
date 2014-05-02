
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

  it "Should support class docstrings", ->
    m = sjs.eval """
        class a
          '''This is a test class'''
        class b
          '''Also has a docstring'''
          value: 32
        """
    assert.equal "This is a test class", m.a.help
    assert.equal "This is a test class", m.a.__doc__
    assert.equal "Also has a docstring", m.b.__doc__
    assert.equal 32, m.b.prototype.value

  it "Should allow super as an expression", ->
    m = sjs.eval """
        class a
          f: (a) -> a + 8
        class b extends a
          f: (a) ->
            @original = a
            r = super
            return r
        i = new b()
        """
    assert.equal 16, m.i.f(8)
    assert.equal 8, m.i.original

  it "Should allow overriding super's args", ->
    m = sjs.eval """
        class a
          f: (a) -> a + 8
        class b extends a
          f: (a) ->
            return super(a + 2)
        i = new b()
        """
    assert.equal 18, m.i.f(8)

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

  it "Should share vars in class definitions", ->
    m = sjs.eval """
        class a
          b: {}
        i = new a()
        # Should affect class, and vice-versa
        a.b['a'] = 'a'
        i.b['b'] = 'b'
        """
    assert.equal 'a', m.a.b['a']
    assert.equal 'b', m.a.b['b']

  it "Should use @ in class definitions for class functions", ->
    m = sjs.eval """
        class a
          value: 88
          @method: () ->
            '''always called in context of a'''
            return @value
        i = new a()
        i.value = 76
        """
    assert.equal 88, m.a.method()
    # Should bind to class, meaning we'll get 88, not 76
    assert.equal 88, m.i.method()

  it "Should disallow @id assignments that aren't functions", ->
    """Note that these do nothing, since scope is shared."""
    assert.throws -> sjs.eval """
        class A
          @value: 8
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

  it "Should use @@method to bind scope to @", ->
    m = sjs.eval """
        class Test
          constructor: (@value) ->
            return

          f: (g) ->
            g(@@inner)

          inner: () ->
            return @value + 1
        t = new Test(55)
        """
    outer = [ 0 ]
    m.t.f (z) -> outer[0] = z()
    assert.equal 56, outer[0]

  it "Should work with class variables", ->
    m = sjs.eval """
        class a
          v: 6

          inc: () -> @class.v += 1
        q = new a()
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
      assert.equal "On line 2: Unexpected member identifier '@value'",
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
        console.log innerA
        console.log a.innerA
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

  it "Should work with uses with objects with no prototype", ->
    m = sjs.eval """
        funcs =
            test: -> 55
        class a uses funcs
        inst = new a()
        """
    assert.equal 55, m.inst.test()

  it "Should work with uses with objects with a prototype", ->
    m = sjs.eval """
        class mixer
          test: -> 55
        class a uses mixer
        inst = new a()
        """
    assert.equal 55, m.inst.test()

  it "Should work with uses and properties", ->
    m = sjs.eval """
        calls = [ 0 ]
        class mixerBase
          fixed: 88
          property value
            get: ->
              calls[0] += 1
              return 42
        class mixerDerive1 extends mixerBase
        class mixer extends mixerDerive1

        class A uses mixer
          constructor: ->
            @value
            @value

        a = new A()
        """
    assert.equal 2, m.calls[0]
    assert.equal 88, m.a.fixed
    assert.equal 42, m.a.value
    assert.equal 3, m.calls[0]

  it "Should count property methods as class methods", ->
    m = sjs.eval """
        class A
          b: 8
          property c
            get: ->
              inner = (j) ->
                return @b + j
              return inner(3)
        a = new A()
        a.b = 99
        """
    assert.equal 102, m.a.c
    assert.equal 11, m.A.c

  it "Should work with properties with just a lambda", ->
    m = sjs.eval """
        class A
          property b -> 82
        a = new A()
        """
    assert.equal 82, m.a.b

  it "Should work with uses with multiple mixins", ->
    m = sjs.eval """
        class mix1
          test: -> 1
          test3: -> 0
        class mix2
          test2: -> 2
          test3: -> 3
        class a uses mix1, mix2
        inst = new a()
        """
    assert.equal 1, m.inst.test()
    assert.equal 2, m.inst.test2()
    # mix1 should override since it was specified first (priority is class
    # specified, mix ins, parent class)
    assert.equal 0, m.inst.test3()

  it "Should work with properties", ->
    m = sjs.eval """
        class A
          property v
            get: -> 88
        """
    # Weird side-effect of flat classes, but this is perfectly valid.
    assert.equal 88, m.A.v
    assert.equal 88, (new m.A()).v

  it "Should probably do inheritance right...", ->
    m = sjs.eval """
        class A
          value: 88
        class B extends A
        oldValue = B.value
        b = new B()
        B.value = 16
        c = new B()
        """
    assert.equal 88, m.A.value
    assert.equal 88, m.oldValue
    assert.equal 16, m.B.value
    assert.equal 16, m.b.value
    assert.equal 16, m.c.value

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


  it "Should work with 'this' inside class callback", ->
    m = sjs.eval """
        class Test
          init: () ->
            @innerClass = {}
            @innerClass.callback = ->
              this.value = 8
        test = new Test()
        """
    obj = {}
    m.test.init()
    m.test.innerClass.callback.call(obj)
    assert.equal 8, obj.value


  it "Should compile with this corner case", ->
    """When this doesn't work, the number gets "called" with the method...
    """
    m = sjs.eval """
        class Object
          dict: 
              inner: 8  #j
          method: ->
            return 6
        """
