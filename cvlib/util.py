# util.py
#
####################################
#
# Utility functions for effects
#
####################################

# Flatten weird-dimensional arrays. e.g: ['hi', ['foo', 'bar'], 'baz'] iterates
# just like ['hi', 'foo', 'bar', 'baz'].
# This is primarily for letting us combo different effects.
#
# cleanup = [EF.this(), EF.that(), EF.other]
# red = EF.apply(frame, cleanup, EF.gray2color(EF.RED))
# green = EF.apply(frame, cleanup, EF.gray2color(EF.GREEN))

def flatten(mess):
    stack = []

    def recurse(ary):
        if type(ary) != list:
            stack.append(ary)
            return
        for i in ary:
            recurse(i)

    recurse(mess)
    return stack
