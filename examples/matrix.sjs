

class Matrix2D
  constructor: () ->
    @values = [ 1, 0, 0, 1 ]
    
  overload .+ as (other) ->
    @values[0] += other.values[0]
    @values[1] += other.values[1]
    @values[2] += other.values[2]
    @values[3] += other.values[3]
    
  overload .* as (other) ->
    mv = @values[:]
    ov = other.values
    @values[0] = mv[0] * ov[0] + mv[1] * ov[2]
