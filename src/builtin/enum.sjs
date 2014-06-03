
class Enum
  """A class that can be constructed with a list of states, and potentially
  a mapping of several states to a single internal state with a single preferred
  label.

  Example:
    e = new Enum("APPLES", "PEARS", ORANGES: -1, DEFAULT: "PEARS")
    e.APPLES # 0
    e.PEARS # 1
    e.ORANGES # -1
    e.DEFAULT # 1
    e.label(-1) # ORANGES
    e.label(1) # PEARS
    e(1) # 1
    e("DEFAULT") # 1
    e("OTHER") # throw new Error
  """
  constructor: ->
    enum_ = (v) ->
      if enum_._indices.hasOwnProperty(v)
        return parseInt(v)
      elif enum_.hasOwnProperty(v)
        return enum_[v]
      throw new Error("Unrecognized value: #{ v }")
    enum_._indices = {}
    for m, v of @
      if typeof v == "function"
        enum_[m] = v

    nextIndex = 0
    for a in arguments
      if typeof a == "string"
        # A member
        enum_._indices[nextIndex] = a
        enum_[a] = nextIndex
        nextIndex += 1
      elif typeof a == "object"
        for k, v of a
          if typeof v == "string"
            # Alias
            if not v of enum_
              throw new Error("Unrecognized alias: #{ v }")
            enum_[k] = enum_[v]
          elif typeof v == "number"
            # Assignment
            if v of enum_._indices
              throw new Error("Already used #{ v } (from #{ k })")
            enum_._indices[v] = k
            enum_[k] = v
            nextIndex = Math.ceil(v) + 1
          else
            throw new Error("Value must be string or number: #{ k }, #{ v }")
      else
        throw new Error("Unknown arg type: #{ typeof a }")

    Object.freeze(enum_)
    return enum_


  all: ->
    result = []
    for k of @_indices
      result.push parseInt(k)
    result.sort()
    return result


  label: (v) ->
    result = @_indices[v]
    if not result?
      throw new Error("Unrecognized value: #{ v }")
    return result
