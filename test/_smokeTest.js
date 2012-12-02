/* Read in files from examples and parse them with SeriousJs before we
   get to any other tests.
   */

assert = require("assert")
fs = require("fs");
sjs = require("../src/seriousjs")

describe("Smoke test -", function() {
  var listing = fs.readdirSync(__dirname + '/examples');
  for (var i = 0, m = listing.length; i < m; i++) {
    var fname = __dirname + '/examples/' + listing[i];
    (function(fname) {
      it("Should compile " + listing[i], function() {
        var contents = fs.readFileSync(fname, 'utf8');
        sjs.compile(contents);
      });
    })(fname);
  }
});

