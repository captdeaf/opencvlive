# effects.py
#
####################################
#
# This is a collection of OpenCV2's effects, as well as descriptions, and extra
# information to allow "pathing" through effects to work.
#
#   "pathing" examples:
#      - Expects GRAYSCALE, auto-convert COLOR to grayscale, and vice versa.
#      - Expects either and outputs the same kind: ANY -> SAME
#      - Expects multiple and outputs a single one? ... I'm not there yet.
#
# (I also find some of cv2's function names, setups, calls, etc. confusing, so
# this is a wrapper around those.)
#
# These effect wrappers can be used in two ways:
#
####
#
# Directly, just as wrappers for cv2
#
#  from effects import EF, Effects
#
#  grayscale = Effects.grayscale(frame)
#  redscale = Effects.grayToColor(frame, EF.RED)
#
####
#
# Lazily, using a messy list, and exact same internal code.
#
# Lazy apply always starts with a copy unless you pass
# copy=False. It should never modify the image you pass to it. Though any
# images passed as arguments (e.g: EF.merge(otherImage)) don't have that copy.
#
# from effects import EF
#
# cleanup = [
#   EF.blur(3),
#   EF.threshold(low=128, method=cv.THRESH_BINARY),
# ]
# 
# EF.apply(frame, [
#   EF.grayscale(),
#   cleanup,
#   EF.grayTocolor(EF.RED),
#   EF.invert(),
#   EF.merge(otherFrame),
#   EF.writeOn("Completed!");
# ])
#
# Chains 'frame' through all the above calls and returns the image.
#
# Some effects are dependent on image type.
#   e.g: 'grayscale' expects an image with depth 3, returning an image with depth 1
#
####################################

import cv2 as cv
import numpy as np
import inspect

####################################
#
# Handy mini-library of util stuff
#
####################################

# Flatten weird-dimensional arrays. e.g: ['hi', ['foo', 'bar'], 'baz'] flattens
# to ['hi', 'foo', 'bar', 'baz'].
# This is primarily for letting us combo different effects.
#
# cleanup = [EF.this(), EF.that(), EF.other]
# red = EF.apply(frame, EF.colorToGray(EF.RED), cleanup, EF.grayToColor(EF.RED))
# green = EF.apply(frame, EF.colorToGray(EF.GREEN), cleanup, EF.grayToColor(EF.GREEN))

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

###################################
#
# EF is a container for CONSTANT values, which is used for both direct and lazy
# calls.
#
####################################
class EF(object):
    BLUE   = 0
    GREEN  = 1
    RED    = 2

    BGR = "bgr"
    GRAYSCALE = "grayscale"
    ANY = "any"
    SAME = "same"

class Effects(object):
    pass

####################################
#
# Lazy Caller lets us chain a bunch of effects and apply them as groups, or
# just call them later, or make it an easy call chain.
#
####################################
class LazyCaller(object):
    def __init__(self, func, args, kwargs, cfrom, cto):
        self.func = func
        self.args = args
        self.kwargs = kwargs
        self.channelfrom = cfrom
        self.channelto = cto

def register(channelfrom, channelto):
    def registerfunc(func):
        def lazyApply(*args, **kwargs):
            return LazyCaller(func, args, kwargs, channelfrom, channelto)

        setattr(EF, func.__name__, func)
        setattr(EF, func.__name__, lazyApply)

        return func

    return registerfunc

def applyEffects(image, *all_effects, copy=True):
    channel = BGR
    if len(image.shape) == 2:
        channel = GRAYSCALE
   
    if copy:
        image = image.copy()

    for effect in all_effects:
        if effect.channelfrom != channel and effect.channelfrom != ANY:
            print(f"Error with {effect.func.__name__}, converting {channel} to {effect.channelfrom}. Do this explicitly?")
            if effect.channelfrom == BGR:
                image = cv.cvtColor(image, cv.COLOR_GRAY2BGR)
                channel = BGR
            else:
                image = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
                channel = GRAYSCALE

        if effect.channelto != SAME:
            channel = effect.channelto

        image = effect.func(image, *effect.args, **effect.kwargs)

    return image

def isColor(image):
    return image.shape == 3

EF.isColor = isColor
EF.register = register
EF.apply = applyEffects
