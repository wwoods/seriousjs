
require assert
require ../ as sjs

describe "Comments", ->
  it "Should end up in result", ->
    r = (sjs.compile "# Hey\nup = 8").js
    assert.equal true, r.indexOf("/* Hey*/") >= 0

  it "Should indent properly", ->
    r = (sjs.compile "\nlambda = ->\n  #What?\n  pass").js
    assert.equal true, r.indexOf("/*What?*/") >= 0

  it "Should work with long comments", ->
    r = (sjs.compile "\nlambda = ->\n  ###What?\n  I don't see the\n  fuss.\n  ###\n  pass").js
    assert.equal true, r.indexOf("/*What?\n  I don't see the\n  fuss.\n  */") >= 0
