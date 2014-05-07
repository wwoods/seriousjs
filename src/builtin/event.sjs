"""Contains builtins accessible through seriousjs module."""

# This module is a little funny for dual compatibility with both browser and
# node.  Anything exported gets assigned to the seriousjs module.

class Event
  constructor: (@_context) ->
    @_bound = {}
    @_one = {}
    @_suppressed = {}


  on: (e, cb) ->
    if not cb?
      return

    if e of @_bound
      @_bound[e].push(cb)
    else
      @_bound[e] = [ cb ]


  one: (e, cb) ->
    if not cb?
      return

    if e of @_one
      @_one[e].push(cb)
    else
      @_one[e] = [ cb ]


  suppress: (e) ->
    if e of @_suppressed
      @_suppressed[e] += 1
    else
      @_suppressed[e] = 1


  trigger: (e) ->
    if e of @_suppressed
      return

    cbs = @_bound[e]
    if cbs?
      for cb in cbs
        cb.apply(@_context, [].slice.call(arguments, 1))

    cbs = @_one[e]
    if cbs?
      for cb in cbs
        cb.apply(@_context, [].slice.call(arguments, 1))
      delete @_one[e]


  unsuppress: (e) ->
    counter = @_suppressed[e]
    if not counter?
      throw new Error("#{ e } not suppressed!")
    if counter <= 1
      delete @_suppressed[e]
    else
      @_suppressed[e] -= 1


class EventMixin
  """Gives the object mixing in this class an "event" object, which can bind
  and trigger events on itself.
  """
  property event
    get: ->
      ev = @__sjs_event
      if not ev?
        ev = @__sjs_event = new Event(@)
      return ev
