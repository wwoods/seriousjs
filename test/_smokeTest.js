/* Read in files from examples and parse them with SeriousJs before we
   get to any other tests.
   */

assert = require("assert")
fs = require("fs");
sjs = require("../src/seriousjs")

function addTest(fname, shouldPass) {
  it("Should " + (shouldPass ? "" : "not") + " compile " + fname, function() {
    var contents = fs.readFileSync(fname, 'utf8');
    if (shouldPass) {
      sjs.compile(contents);
    }
    else {
      var passing = false;
      try {
        sjs.compile(contents);
      }
      catch (e) {
        passing = true;
      }
      if (!passing) {
        throw "Compilation did not fail";
      }
    }
  });
}

function addTestDir(dir, shouldPass) {
  var listing = fs.readdirSync(dir);
  for (var i = 0, m = listing.length; i < m; i++) {
    var fname = dir + '/' + listing[i];
    var stat = fs.statSync(fname);
    if (stat.isFile()) {
      addTest(fname, shouldPass);
    }
  }
}

describe("Smoke test -", function() {
  addTestDir(__dirname + '/good', true);
  addTestDir(__dirname + '/bad', false);
});
