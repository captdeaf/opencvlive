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
# Using lazy apply, we can verify call chain. e.g: BGR->BGR calls.
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

from .typedefs import T, JSDict

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

####################################
#
# INFO is a group of dictionaries that is intended for interaction with
# external sources such as a web app.
#
# INFO = dict(
#
#   constants = dict('ANY', 'Any image') # Name->desc mapping.
#
#   effects = dict('name', dict(...)) # As much information as we can collect
#                                     #  about an effect.
#
#   types = dict('name', dict(...)) # Not used in python, these are used by annotating
#                                   # effects to allow the web version to make UI
#                                   # inputs and type safety. (e.g: 'byte' is 0-255)
# )
#
####################################

INFO = dict(
    constants = dict(
            flags = dict(),
            channels = dict(),
        ),
    types     = dict(),
    effects   = dict(),
)

# Turn a dict of constants into ... constants and INFO.constants.
def C(group, **constants):
    if group not in INFO['constants']:
        INFO['constants']['group'] = dict()
    for name, desc in constants.items():
        setattr(EF, name, desc)
        INFO['constants'][group][name] = desc

# Type('byte', input='slider', min='0', max='255')
# Type('str', input='text')
# etc
def addType(name, **kwargs):
    INFO['types'][name] = kwargs

def dictify(func):
    params = inspect.signature(func).parameters
    args = {}
    imagecount = 0
    for arg, v in params.items():
        if v.default != inspect._empty:
            if isinstance(v.annotation, JSDict):
                args[arg] = v.annotation.toDict()
            else:
                args[arg] = v.annotation
            args[arg]['value'] = v.default
        else:
            imagecount += 1

    return imagecount, args

def addEffectInfo(func, displayname, channelfrom, channelto, **kwargs):
    icount, args = dictify(func)
    newEffect = dict(
        name = func.__name__,
        displayname = displayname,
        doc = func.__doc__,
        icount = icount,
        args = args,
        channelfrom = channelfrom,
        channelto = channelto,
        **kwargs
    )
    INFO['effects'][func.__name__] = newEffect

###################################
#
# EF is a container for CONSTANT values, which is used for both direct and lazy
# calls. It is also a container for effectName methods, which are only the lazy
# versions.
#
####################################
class EF(object):
    pass

C('flags',
    BLUE   = 0,
    GREEN  = 1,
    RED    = 2,
);

    # Channel identifiers.
C('channels',
    # Constants for @register
    # Default colors are BGR.
    BGR       = "BGR Color image",
    GRAYSCALE = "Grayscale",
    HSV       = "Hue-Sat-Value",

    # ANY: color, hsv or grayscale.
    # DIM3: 3-dimensional ((h, w, color): value), etc.
    # DIM2: 2-dimension ((h, w): value)
    DIM3      = "3-DIMENSIONAL",
    DIM2      = "2-DIMENSIONAL",

    # ANY: DIM3 or DIM2.
    # SAME: What format it's given, it returns.
    ANY       = "Any image",
    SAME      = "Same image as given",
)

# Effects is similar to EF, but has no constants, and
# has the direct-call version of EF's lazy calls.
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

def register(displayname, channelfrom, channelto, **effargs):
    def registerfunc(func):
        def lazyApply(*args, **kwargs):
            return LazyCaller(func, args, kwargs, channelfrom, channelto)

        addEffectInfo(func, displayname, channelfrom, channelto, **effargs)

        setattr(Effects, func.__name__, func)
        setattr(EF, func.__name__, lazyApply)

        return func

    return registerfunc

def applyEffects(image, *all_effects, copy=True):
    channel = EF.BGR
    if len(image.shape) == 2:
        channel = EF.GRAYSCALE
   
    if copy:
        image = image.copy()

    for effect in all_effects:
        if effect.channelfrom != channel and effect.channelfrom != EF.ANY:
            if effect.channelfrom == EF.BGR:
                image = cv.cvtColor(image, cv.COLOR_GRAY2BGR)
                channel = EF.BGR
            else:
                image = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
                channel = EF.GRAYSCALE

        if effect.channelto != EF.SAME:
            channel = effect.channelto

        image = effect.func(image, *effect.args, **effect.kwargs)

    return image

def isColor(image):
    return len(image.shape) == 3

def jsApply(effect, images, args):
    if hasattr(Effects, effect):
        lazy = getattr(EF, effect)(**args)
    return EF.apply(images[0], lazy)

def cvread(filename):
    return cv.imread(filename)

def cvwrite(img, filename):
    return cv.imwrite(filename, img)


EF.isColor = isColor
EF.register = register
EF.apply = applyEffects
