# Module dependencies

require ./server/main as server

require express
require http
require path
require seriousjs

app = express()

# all environments
app.set('port', process.env.PORT or 3000)
app.set('views', __dirname + '/server/views')

# Basic logging
lastDate = [ "" ]
app.use async extern (req, res) ->
  n = new Date()
  pad = (t) ->
    return ("00" + t).slice(-2)
  d = "#{ n.getFullYear() }-#{ pad(n.getMonth()+1) }-#{ pad(n.getDate()) }T"
  if d == lastDate[0]
    d = ""
  else
    lastDate[0] = d
  h = "#{ pad(n.getHours()) }:#{ pad(n.getMinutes()) }:#{ pad(n.getSeconds()) }"
  console.log("#{ d }#{ h } #{ req.method } #{ req.url }")

# Core server bootstrapping
async
  # Link our webapp into /src, optionally building an optimized version
  await r = seriousjs.requireJs().setupWebapp(app, express,
      __dirname + '/webapp')
  if not r
    # This was a build only situation, don't actually start the server.
    return

  # Initialize application
  await sjsAppOptions = server.init(app)

  # Expose a basic HTML page to serve the app from /webapp under /src
  seriousjs.requireJs().serveWebapp(
      app, '/',
      shim: sjsAppOptions.scripts
      title: sjsAppOptions.title

  await extern http.createServer(app).listen(app.get('port'))
  console.log("Express server listening on port #{ app.get('port') }")
