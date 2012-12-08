
require http

server = http.createServer (req, res) ->
  """Dummy HTML response"""
  res.writeHead(200)
  res.end("I'm an HTTP response!\n")

server.listen(8080)

