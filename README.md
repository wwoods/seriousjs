SeriousJS
=========

A simple syntax for a complicated world.

There is an interactive interpreter available at: http://wwoods.github.io/seriousjs/

## Motivation

Feel free to skip to the bottom if you like - but a lot of people will ask
why I bothered implementing a language that follows Coffee-Script 99% of the
time.

Ok, why re-write Coffee-Script?  My initial motivation was that
the coffee-script parser has really weird limitations.  For instance:

    if someLongVariable
            + someOtherLongVariable == 8
        doSomething()

Won't compile with Coffee-Script, despite making complete visual sense.  I've
also come across the scenario where, after several layers of lambda and
object literal nesting, coffee-script broke.  Granted I should have distilled
the situation and fixed Coffee-Script's parser, but it was just a frustrating
experience.

Since I was just learning PegJS for another project, I thought it would be fun
to try to make a Coffee-Script parser that didn't have so many bizarre
limitations in the syntax.

As I was looking at Coffee-Script's design choices and my past coffee-script
projects, there were some other things that bugged me constantly:

* -> vs => - Why?  I mean, I understand how coffee-script uses them, but if
  a language introduces a beautiful syntax like @ to mean "the object that
  this method is operating on", why would you confuse the issue with
  function bindings?  "@" should mean "the closest class object", and "this"
  should mean the context with which the current method was called.

* Why are there so many aliases for true/false?  It's because it's a
  scripting language.  I get that.  But for large, maintainable code bases, I
  don't feel that it's appropriate to have so many ways of saying "false" and
  "true".  Feel free to correct me on that one.

* Guess what this code does:

        $('<div>')
            .bind 'click', -> alert("Click!")
            .appendTo('body')

  If you guessed "It sure doesn't append that div to the body!" you were
  correct.  Coffee-Script associates the .appendTo with the return value from
  calling alert(), quite contrary to what the indentation implies.

While those aren't huge, they got me thinking.  What are some other ways that
Coffee-Script could be improved?  Well, how about:

* Support for asynchronous fibers / continuations?  Programming callbacks in
  an imperative manner rather than a bunch of nested functions

* Tight integration with RequireJS, to provide a uniform, consistent language
  between NodeJS and the browser, that runs in all environments and
  "just works"

* Doc strings!  One of the best things about Python that really helped it
  be a great language was doc strings.  An interactive language needs
  interactive help.  So why not start encouraging them?

Anyway, that's the jist of it.  I'm not expecting people to jump ship on this
one - it started as an educational project but the focus is on production
quality language constructs.  I mostly just think it's a useful conversation
starter.


## Basics

SeriousJS is inspired by Coffee-Script, but aimed at making the parsing more
dependable and providing extensions for a uniform code base across NodeJS and
browser implementations.  Emphasis is on making projects easy to manage and
learn.

Remember, there is an interactive interpreter to play with at: http://wwoods.github.io/seriousjs/


Usage
-----

For a shorthand to run any SeriousJS script in NodeJS, just use:

    seriousjs app.sjs

To start a new SeriousJS HTTP client/server project with RequireJS set up, run:

    seriousjs create-app [appname]

This makes a folder named [appname] and sets up a skeleton hierarchy, with an
example web server and configuration.  It also comes with a stock .gitignore
file, which suffices for simple projects.

To compile your new application, run:

    seriousjs app.sjs --build

from your application directory.  A "webapp.build" directory will be created,
which has compiled sources for your client.

To run the compiled version, run:

    seriousjs app.sjs --built

Note that if you run --built without --build first, a build will be triggered
anyway.


Usage in a browser
------------------

If you run seriousjs --compile-only (ran during install anyway), then the file
lib/seriousjs-embed.js will be generated.  This is a self-contained file that
may be used in a browser (or NodeJS, of course).

Or just run "seriousjs --create-app myapp" and have a working demonstration.


Syntax
------

Functions are lambdas:

    (a, b) -> a + b

Long functions can have doc strings:

    (a, b) ->
        """Returns the summation of a and b.
        """
        return a + b

Dict unmapping:

    { a, b } = { a: 8, b: 9 }
    { a = 8, b } = { b: 9 }

    # < means that the matched dict must contain a subset of the specified
    # keys.  That is, the first will be OK (b is undefined), but the second
    # will throw an error (c not allowed)!
    {< a, b } = { a: 1 }
    {< a, b } = { a: 1, c: 3 }

    # > means at least the specified keys must be in the matched dict
    {> a } = { a: 1, b: 2 }

    # = means keys must match exactly
    {= a, b } = { a: 3, b: 4 }

Dict unmapping as lambda arguments:

    { a, b } -> a + b
    (a, b, {< add = true}) -> add ? a + b : a

Classes and @-binding:

    class Test
      constructor: (@value = 5) ->
        return

      inner: () ->
        console.log @value

      f: (g) ->
        g(@@inner)


    t = Test(42)
    # This will log 42, which is t.value.  Note that the binding of the
    # function was preserved when it was referenced with @.
    # Useful for e.g. callbacks bound to events
    t.f (method) -> method()


Changelog
---------

* 2015-3-12 - Classes back to being aligned with javascript, :: operator for
  accessing prototype, more comprehensive testing, lambdas always start their
  own continuation (if they are in params, a one-line lambda has two indents
  rather than one), return statements are implied ONLY for one-line lambdas.

* 2014-6-3 - Fix bug where (3+5) 4 is valid syntax for calling a nonsense
  function.  Is an issue with e.g. (3 + 5) / 4 / 8.

* 2014-5-8 - catch e instanceof Error shortcut for catching by type.

* 2014-5-2 - Much improved class inheritance (changes __proto__ hack so that the
  child function actually chains from the parent function).  Added property
  support to classes.  Added Event and EventMixin builtins on seriousjs module.

### 0.1.9
* 2014-4-24 - Made create-static template, for sites with no server component.
  Check if callback is function for async, if it's not, unset it.  Fixed parse
  error with arguments separated by newlines.

### 0.1.8
* 2014-4-21 - Updated create-app template.  Added test as a TODO.  Updated
  version / npm registry with latest changes.
* 2014-4-3 - Fixed list of lists parsing, async throwing, async catch blocks in
  a for loop, onAsyncUnhandledError, onAsyncSecondaryError


TODO
----

* i[??] Random choose operator?  Would be handy to have that built in...  Probably should think that one through though.

* for..else.  Else is triggered when loop is completed without break.


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/wwoods/seriousjs/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
