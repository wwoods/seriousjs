SeriousJS
=========

A simple syntax for a complicated world.

Note -- I wrote this readme as a roadmap.  The seriousjs command line utilities
are not ready yet.  This message will be removed when they are.


Basics
------

SeriousJS is inspired by Coffee-Script, but aimed at making the parsing more 
dependable and providing extensions for a uniform code base across NodeJS and 
browser implementations.  Emphasis is on making projects easy to manage and
learn.


Usage
-----

To run any SeriousJS source file in NodeJS, just use:

    seriousjs app.sjs

To start a new SeriousJS HTTP client/server project with RequireJS set up, run:

    seriousjs create-app [appname]
    
This makes a folder named [appname] and sets up a skeleton hierarchy, with an
example web server and configuration.  It also comes with a stock .gitignore
file, which suffices for simple projects.

To compile your new application, run:

    seriousjs build app.sjs
    
from your application directory.  A "build" directory will be created, which
has compiled sources for your client.

To run the compiled version, run:

    seriousjs --built app.sjs


Why not just use Coffee-Script?
-------------------------------

SeriousJS is inspired by coffee-script, but implemented in a more 
maintainable and predictable manner.  It also gives you additional tools
for building real-world applications.

At the time of this writing, here are some benefits of SeriousJS:

* SeriousJS uses a plain old parser and doesn't need any token manipulations,
  meaning fewer surprises.
  
For instance, Coffee-Script won't compile this, but SeriousJS will:

    if aLongVariableNameOrExpressionSoIWantToWrap
        + someOtherVariableName == 2
      someFunction()
      
* SeriousJS knows about modules; when you add a line "require http" at the top
  of your source file, it knows that what you want to do is load the http 
  module from NodeJS and store it in a variable named http.

* SeriousJS preserves your line numbers and comments in the output javascript, 
  meaning easier debugging.
  
* SeriousJS supports doc strings, which show up in Node's interactive 
  interpreter when inspecting the function variable.
  
* SeriousJS comes packaged with RequireJS and a few plugins to provide 
  a comprehensive solution to start building your application, right away.
  
* SeriousJS drops confusing operators like "unless", keeping 
  the emphasis on clean, readable code. 
