#! /usr/bin/python

import sys

def countSpaces(line):
    c = 0
    for char in line:
        if char == ' ' or char == '\t':
            c += 1
        else:
            break
    return c

class Matches(object):
    def __init__(self, indent):
        self.matched = []
        self.possible = []
        self.indent = indent
        self.isMatch = False

lineBatches = [ Matches(0) ]
for i, line in enumerate(sys.stdin):
    line = line.rstrip()
    spaces = countSpaces(line)
    if spaces > lineBatches[-1].indent:
        batch = Matches(spaces)
        lineBatches.append(batch)
    else:
        while spaces < lineBatches[-1].indent:
            obatch = lineBatches.pop()
            if obatch.isMatch:
                lineBatches[-1].matched.extend(obatch.possible + obatch.matched)
        batch = lineBatches[-1]
    batch.possible.append((i, line))
    if line.strip().startswith('Matched'):
        batch.isMatch = True
    elif line.strip().startswith('Failed'):
        # Pop twice - once for enter, once for failed
        batch.possible.pop()
        batch.possible.pop()

print(lineBatches)
lines = lineBatches[0].matched + lineBatches[0].possible
print '\n'.join([ l[1] for l in sorted(lines, key = lambda m: m[0]) ])

