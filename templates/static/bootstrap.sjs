#! /usr/bin/env seriousjs
"""Updates the .requirejs resource directory with the latest embeddable version
of SeriousJs.  Also attempts to use npm's http-server to host the webpage,
unless --update is specified, in which case only SeriousJS provided files are
updated.
"""

require child_process as cp
require seriousjs

if module? and not module.parent?
  async
    await seriousjs.requireJs().setupWebapp(null, null, __dirname)

    if not '--update' in process.argv
      # Run a basic server if we can

      ps = cp.spawn('http-server', [ '-p', 8080, '-c-1' ], stdio: 'inherit')
      startTime = Date.now()
      # Prevent ctrl+c from trickling to us
      process.on 'SIGINT', -> true
      await extern noerror ps.on 'exit'
      process.on 'SIGINT', -> process.exit(1)
      endTime = Date.now()

      if endTime - startTime < 1000
        console.log "Looks like maybe http-server is not installed?  Install "
            + "it with: "
        console.log "    $ npm install -g http-server"
    else
      console.log "All done.  If you want to run a basic webserver to avoid "
          + "issues with filesystem security, try ./bootstrap.sjs --server"
