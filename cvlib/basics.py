# basics.py
#
####################################
#
# Basic effects for cv2 and EF/Effects
#
####################################

import numpy as np
from .effects import EF, cv, T

threshold_target = T.select({
    "Binary": cv.THRESH_BINARY,
    "Binary Inverted":cv.THRESH_BINARY_INV,
    "Truncated": cv.THRESH_TRUNC,
    "ToZero": cv.THRESH_TOZERO,
    "ToZero Inverted": cv.THRESH_TOZERO_INV,
})

@EF.register(EF.GRAYSCALE, EF.GRAYSCALE)
def adaptiveThreshold(frame,
            cmax : T.int = 255,
            method : T.select({"Gaussian": cv.ADAPTIVE_THRESH_GAUSSIAN_C, "Mean": cv.ADAPTIVE_THRESH_GAUSSIAN_C}) = cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            target : threshold_target = cv.THRESH_BINARY,
            blockSize : T.int(min=1) = 11,
            weight : T.int = 2
        ):
    return cv.adaptiveThreshold(frame, cmax, method, target, blockSize, weight)

@EF.register(EF.GRAYSCALE, EF.GRAYSCALE)
def threshold(frame,
            low : T.byte = 128,
            high : T.byte = 255,
            target : threshold_target = cv.THRESH_BINARY,
            otsu : T.bool = False,
        ):
    if otsu:
        target |= cv.THRESH_OTSU
    _, ret = cv.threshold(frame, low, high, target)
    return ret

@EF.register(EF.ANY, EF.GRAYSCALE)
def grayscale(image):
    if not EF.isColor(image):
        return image
    return cv.cvtColor(image, cv.COLOR_BGR2GRAY)

@EF.register(EF.ANY, EF.BGR)
def colorize(image):
    if not EF.isColor(image):
        return cv.cvtColor(image, cv.COLOR_GRAY2BGR)
    return image

@EF.register(EF.BGR, EF.BGR)
def pluckColor(image, channel : T.int(min=0, max=2)  = 1):
    if channel != 0:
        image[:,:,0] = 0
    if channel != 1:
        image[:,:,1] = 0
    if channel != 2:
        image[:,:,2] = 0
    return image

@EF.register(EF.ANY, EF.SAME)
def blur(frame, amount : T.int(min=1, flag='odd') = 5):
    return cv.medianBlur(frame, amount)

@EF.register(EF.ANY, EF.BGR)
def writeOn(frame,
            text : T.string = 'demo',
            xpct : T.percent = 0.2,
            ypct : T.percent = 0.8,
            color : T.color(EF.ANY) = [0, 255, 255],
            size : T.int(min=1, max=255) = 4,
            weight : T.int(min=1, max=255) = 10
        ):

    font = cv.FONT_HERSHEY_SIMPLEX, weight= 10
    if text is None or len(text) == 0:
        return frame

    if not EF.isColor(frame):
        frame = colorize(frame)
    height, width, _ = frame.shape

    calcx = int(width * xpct)
    calcy = int(height * ypct)
    font = cv.FONT_HERSHEY_SIMPLEX

    frame = cv.putText(frame, text, (calcx, calcy), font, size, color, weight)
    return frame

@EF.register(EF.BGR, EF.GRAYSCALE)
def colorToGray(image, channel : T.int(min=0, max=2)  = 1):
    return image[:,:,channel]

@EF.register(EF.GRAYSCALE, EF.BGR)
def grayToColor(image, channel : T.int(min=0, max=2)  = 1):
    shape = image.shape + (3,)
    colored = np.zeros(shape, dtype="uint8")
    colored[:,:,channel] = image
    return colored

@EF.register(EF.BGR, EF.SAME)
def brighten(image, pct : T.percent = 0.25):
    hsv = cv.cvtColor(image, cv.COLOR_BGR2HSV)
    h, s, v = cv.split(hsv)

    v[:] = (100 * v[:]) / int(100 * pct)
    v[v > 255] = 255

    newhsv = cv.merge((h, s, v))
    return cv.cvtColor(newhsv, cv.COLOR_HSV2BGR)

@EF.register(EF.ANY, EF.SAME)
def invert(image):
    return 255 - image
