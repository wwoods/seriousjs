{a} = { a: 8 }

{a, b} = { a: 1, b: 2, c: 3 }

{a, b} = {c} = {a: 1, b: 2, c: 3}

{= a, b} = { a: 1, b: 2 }

{< a, b} = { a: 1, b: 2, c: 3 }

a = { test } ->
  return test

{a = 8} = {}
{a = 8, b = 9} = {}
