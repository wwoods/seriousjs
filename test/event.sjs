
require assert
require ../ as sjs

describe "Events", ->
  it "Should work when assigned from new or as mixin", ->
    m = sjs.eval """
        require seriousjs as sjs
        happiness = [ 0 ]

        class A
          constructor: ->
            @event = new sjs.Event()
            @event.on 'happy', (amt) -> happiness[0] += amt
        a = new A()

        class B uses sjs.EventMixin
          constructor: ->
            @event.on 'happy', (amt) -> happiness[0] += amt
        b = new B()
        """
    assert.equal 0, m.happiness[0]
    m.a.event.trigger 'happy', 1
    assert.equal 1, m.happiness[0]
    m.a.event.trigger 'happy', 10
    assert.equal 11, m.happiness[0]
    m.b.event.trigger 'happy', 4
    assert.equal 15, m.happiness[0]


  it "Should support one", ->
    m = sjs.eval """
        require seriousjs as sjs
        happiness = [ 0 ]
        class A uses sjs.EventMixin
          constructor: ->
            @event.one 'happy', (amt) ->
              happiness[0] += amt
        a = new A()
        """
    assert.equal 0, m.happiness[0]
    m.a.event.trigger 'happy', 2
    m.a.event.trigger 'happy', 1
    assert.equal 2, m.happiness[0]


  it "Should support suppress", ->
    m = sjs.eval """
        require seriousjs as sjs
        happiness = [ 0 ]
        class A uses sjs.EventMixin
          constructor: ->
            @event.on 'happy', (amt) -> happiness[0] += amt
        a = new A()
        """
    m.a.event.trigger 'happy', 1
    m.a.event.suppress 'happy'
    m.a.event.trigger 'happy', 2
    m.a.event.suppress 'happy'
    m.a.event.unsuppress 'happy'
    m.a.event.trigger 'happy', 4
    m.a.event.unsuppress 'happy'
    m.a.event.trigger 'happy', 8
    assert.equal 9, m.happiness[0]
    assert.throws ->
      m.a.event.unsuppress 'happy'

