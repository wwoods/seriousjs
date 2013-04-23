
class a
  a: 5
  b: 6
  
  
class b extends a
  c: 7


class c extends a
  @test: 5
  
  test: () ->
    @class.test += 1
    
  # inline assignment
  inc: () -> @class.test += 1
