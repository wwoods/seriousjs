SeriousJS
=========

A simple syntax for a complicated world.


Basics
------

SeriousJS is inspired by Coffee-Script, but aimed at making the parsing more 
dependable and providing extensions for a uniform code base across NodeJS and 
browser implementations.


Why not just use Coffee-Script?
-------------------------------

SeriousJS is inspired by coffee-script, but implemented in a more 
maintainable and predictable manner.  It also gives you additional tools
for building real-world applications.

At the time of this writing, here are some benefits of SeriousJS:

Coffee-Script won't compile this, but SeriousJS will:

    if aLongVariableNameOrExpressionSoIWantToWrap
        + someOtherVariableName == 2
      someFunction()

* SeriousJS preserves your line numbers and comments in the output javascript, 
  meaning easier debugging.
