
require assert
require ../ as sjs

describe "Strings", ->
  it "Should properly group embedded args", ->
    assert.equal "Hey: -1", (sjs.eval """f = "Hey: #""" + """{ 4 - 5 }" """).f


  it "Should support escaping hashes with a backslash", ->
    assert.equal "Hey: -1", (sjs.eval """f = "Hey: \#{ 4 - 5 }" """).f
