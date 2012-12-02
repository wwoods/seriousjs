SeriousJS
=========

A simple syntax for a complicated world.

Basics
======

SeriousJS is based on Coffee-Script, but aimed at making the parsing more 
logical and providing extensions for a uniform code base across NodeJS and 
browser implementations.

Comparison with Coffee-Script
=============================

SeriousJS is designed to mimic coffee-script, but implement it in a more 
maintainable and predictable manner.  For instance, coffee-script will not
parse the following:

    if aLongVariableNameOrExpressionSoIWantToWrap
        + someOtherVariableName == 2
      someFunction()
      
