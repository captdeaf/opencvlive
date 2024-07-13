# cwlib/effects.py # # This is a collection of OpenCV2's effects to help with normalizing
# a camera frame to find arucos.
#
# Primary way to use this:
#
# applyEffects(frame, 'grayscale')
# applyEffects(frame, ['grayscale', 'brighten:30'])
#
# Some effects are dependent on image type.
#   e.g: 'grayscale' expects an image with depth 3, returning an image with depth 1

import cv2 as cv
import numpy as np
import inspect

class EF(object):
    pass

class LazyCaller(object):
    def __init__(self, func, args, kwargs, cfrom, cto):
        self.func = func
        self.args = args
        self.kwargs = kwargs
        self.channelfrom = cfrom
        self.channelto = cto

BGR = "bgr"
GRAYSCALE = "grayscale"
ANY = "any"
SAME = "same"

def register(channelfrom, channelto):
    def registerfunc(func):
        def lazyApply(*args, **kwargs):
            return LazyCaller(func, args, kwargs, channelfrom, channelto)

        setattr(EF, func.__name__, lazyApply)

        return func

    return registerfunc

def applyEffects(frame, *all_effects):
    channel = BGR
    if len(frame.shape) == 2:
        channel = GRAYSCALE

    image = frame.copy()

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

EF.apply = applyEffects

@register(GRAYSCALE, GRAYSCALE)
def adaptiveThreshold(frame, cmax=255, invert=False, gaussian=True, blockSize=11, weight=2):
    method = cv.ADAPTIVE_THRESH_MEAN_C
    if gaussian:
        method = cv.ADAPTIVE_THRESH_GAUSSIAN_C
    target = cv.THRESH_BINARY
    if invert:
        target = cv.THRESH_BINARY_INV
    return cv.adaptiveThreshold(frame, cmax, method, target, blockSize, weight)

@register(GRAYSCALE, GRAYSCALE)
def threshold(frame, low=128, high=255, otsu=False, invert=False):
    method = cv.THRESH_BINARY
    if invert:
        method = cv.THRESH_BINARY_INV
    if otsu:
        method |= cv.THRESH_OTSU
    _, ret = cv.threshold(frame, low, high, method)
    return ret

@register(ANY, GRAYSCALE)
def grayscale(image):
    if len(image.shape) == 2:
        return image
    return cv.cvtColor(image, cv.COLOR_BGR2GRAY)

@register(ANY, BGR)
def colorize(image, channel=None):
    if len(image.shape) == 2:
        return cv.cvtColor(image, cv.COLOR_GRAY2BGR)
    return image

@register(BGR, BGR)
def pluckColor(image, channel):
    if channel != 0:
        image[:,:,0] = 0
    if channel != 1:
        image[:,:,1] = 0
    if channel != 2:
        image[:,:,2] = 0
    return image

@register(ANY, SAME)
def blur(frame, amount):
    return cv.medianBlur(frame, amount)

@register(ANY, BGR)
def writeOn(frame, text, xpct=0.2, ypct=0.8, color=[0, 255, 255], size=4,
            font=cv.FONT_HERSHEY_SIMPLEX, weight=10):

    if text is None or len(text) == 0:
        return frame

    colored = colorize(frame)
    height, width, _ = colored.shape

    calcx = int(width * xpct)
    calcy = int(height * ypct)
    font = cv.FONT_HERSHEY_SIMPLEX

    colored = cv.putText(colored, text, (calcx, calcy), font, size, color, weight)
    return colored

@register(ANY, SAME)
def removeBG(frame, bgr, learningRate = 0):
    return bgr.apply(frame, learningRate = learningRate)

@register(BGR, GRAYSCALE)
def color2gray(image, channel):
    return image[:,:,channel]

@register(GRAYSCALE, BGR)
def gray2color(image, channel):
    shape = image.shape + (3,)
    colored = np.zeros(shape, dtype="uint8")
    colored[:,:,channel] = image
    return colored

@register(ANY, SAME)
def subtract(image, sub):
    return cv.subtract(image, sub)

@register(ANY, SAME)
def blend(image, second, alpha, gamma=0.0):
    return cv.addWeighted(image, 1.0-alpha, second, alpha, gamma)

@register(BGR, SAME)
def brighten(image, pct):
    hsv = cv.cvtColor(image, cv.COLOR_BGR2HSV)
    h, s, v = cv.split(hsv)

    v[:] *= pct
    v[v > 255] = 255

    newhsv = cv.merge((h, s, v))
    return cv.cvtColor(newhsv, cv.COLOR_HSV2BGR)

@register(ANY, SAME)
def cutPoly(image, pts):
    mask = np.zeros(image.shape[:2], dtype="uint8")
    cv.fillPoly(mask, pts, 1)

    if len(image.shape) > 2:
        image[mask == 0] = [0, 0, 0]
    else:
        image[mask == 0] = 0
    
    return image

@register(ANY, SAME)
def invert(image):
    return 255 - image
