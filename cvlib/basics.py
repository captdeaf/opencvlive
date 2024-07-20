# basics.py
#
####################################
#
# Basic effects for cv2 and EF/Effects
#
####################################

import numpy as np
from .effects import EF, cv, T

thresholdTarget = T.select({
    "Binary": cv.THRESH_BINARY,
    "Binary Inverted":cv.THRESH_BINARY_INV,
    "Truncated": cv.THRESH_TRUNC,
    "ToZero": cv.THRESH_TOZERO,
    "ToZero Inverted": cv.THRESH_TOZERO_INV,
}, title="Threshold target")

colorChannel = T.select({
    "BLUE": 0,
    "GREEN": 1,
    "RED": 2,
}, title="Color channel")

@EF.register("Adaptive Threshold", EF.GRAYSCALE, EF.GRAYSCALE, desc="AT'd")
def adaptiveThreshold(frame,
            cmax : T.int(min=0, max=255) = 255,
            method : T.select({"Gaussian": cv.ADAPTIVE_THRESH_GAUSSIAN_C, "Mean": cv.ADAPTIVE_THRESH_GAUSSIAN_C}) = cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            target : thresholdTarget = cv.THRESH_BINARY,
            blockSize : T.int(min=1) = 11,
            weight : T.int = 2
        ):
    return cv.adaptiveThreshold(frame, cmax, method, target, blockSize, weight)

@EF.register("Threshold", EF.GRAYSCALE, EF.GRAYSCALE, desc="Thresholded")
def threshold(frame,
            low : T.byte(title="Below this is black") = 128,
            high : T.byte(title="Above this is white") = 255,
            target : thresholdTarget = cv.THRESH_BINARY,
            otsu : T.bool(title="Use Otsu thresholding") = False,
        ):
    if otsu:
        target |= cv.THRESH_OTSU
    _, ret = cv.threshold(frame, low, high, target)
    return ret

@EF.register("Convert to Grayscale", EF.ANY, EF.GRAYSCALE, desc="Grayed")
def grayscale(image):
    if not EF.isColor(image):
        return image
    return cv.cvtColor(image, cv.COLOR_BGR2GRAY)

@EF.register("Convert to Color", EF.ANY, EF.BGR, desc="Colored")
def colorize(image):
    if not EF.isColor(image):
        return cv.cvtColor(image, cv.COLOR_GRAY2BGR)
    return image

@EF.register("Remove Color", EF.BGR, EF.BGR, desc="Plucked")
def removeColor(image, channel : colorChannel  = 1):
    image[:,:,channel] = 0
    return image

@EF.register("Blur", EF.ANY, EF.SAME, desc="Blurry")
def blur(frame, amount : T.int(min=1, step=2, max=255, title="Pixel range to blur (odd number)") = 5):
    return cv.medianBlur(frame, amount)

@EF.register("Write text", EF.ANY, EF.BGR, desc="Inscribed")
def writeOn(frame,
            text : T.string = 'demo',
            xpct : T.percent = 0.2,
            ypct : T.percent = 0.8,
            # color : T.noop = [0, 255, 255],
            size : T.int(min=1, max=255) = 4,
            weight : T.int(min=1, max=255) = 10
        ):

    # TODO: When we have a good color color picker,
    #       make this an op arg.
    color = [255, 255, 255]

    font = cv.FONT_HERSHEY_SIMPLEX
    weight= 10
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

@EF.register("Grayscale from Color", EF.BGR, EF.GRAYSCALE, desc="Color-plucked")
def colorToGray(image, channel : colorChannel = 1):
    return image[:,:,channel]

@EF.register("Color from Grayscale", EF.GRAYSCALE, EF.BGR, desc="Color-channeled")
def grayToColor(image, channel : colorChannel = 1):
    shape = image.shape + (3,)
    colored = np.zeros(shape, dtype="uint8")
    colored[:,:,channel] = image
    return colored

@EF.register("Invert", EF.ANY, EF.SAME, desc="Inverted")
def invert(image):
    return 255 - image
