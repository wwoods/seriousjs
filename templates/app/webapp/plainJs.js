define([], function() {
  $('body').append("<p>Loaded plainJs.js!</p>")
  return { test: function() {
    $('body').append("<p>Hello from plain JS!</p>");
  }};
});
