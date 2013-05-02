
require assert
require ../ as sjs

describe "Comments", ->
  it "Should end up in result", ->
    r = sjs.compile "# Hey\nup = 8"
    assert.equal "var up;/* Hey*/        \nthis.up=up = 8", r

  it "Should indent properly", ->
    r = sjs.compile "\nlambda = ->\n  #What?\n  pass"
    assert.equal "var lambda;\nthis.lambda=lambda = function() {;\n  /*What?*/        \n  return pass}", r

  it "Should work with long comments", ->
    r = sjs.compile "\nlambda = ->\n  ###What?\n  I don't see the\n  fuss.\n  ###\n  pass"
    assert.equal "var lambda;\nthis.lambda=lambda = function() {;\n  /*What?\n  I don't see the\n  fuss.\n  */        \n  return pass}", r
