# basics.py
#
####################################
#
# Basic effects for cv2 and EF/Effects
#
####################################

import numpy as np
from .effects import EF, cv, T

@EF.register("Adaptive Threshold", T.grayscale)
def adaptiveThreshold(
            image : T.grayscale,
            cmax : T.int(min=0, max=255) = 255,
            method : T.select({"Gaussian": cv.ADAPTIVE_THRESH_GAUSSIAN_C, "Mean": cv.ADAPTIVE_THRESH_GAUSSIAN_C}) = cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            target : T.select({"BINARY": cv.THRESH_BINARY, "INVERTED": cv.THRESH_BINARY_INV}) = cv.THRESH_BINARY,
            blockSize : T.int(min=1, step=2, title="Must be odd") = 27,
            weight : T.int = 2
        ):
    return cv.adaptiveThreshold(image, cmax, method, target, blockSize, weight)

thresholdTarget = T.select({
    "Binary": cv.THRESH_BINARY,
    "Binary Inverted":cv.THRESH_BINARY_INV,
    "Truncated": cv.THRESH_TRUNC,
    "ToZero": cv.THRESH_TOZERO,
    "ToZero Inverted": cv.THRESH_TOZERO_INV,
}, title="Threshold target", ctype='int')

@EF.register("Threshold", T.grayscale)
def threshold(
            image : T.grayscale,
            cmax : T.int(min=0, max=255) = 255,
            low : T.byte(title="Below this is black") = 128,
            high : T.byte(title="Above this is white") = 255,
            target : thresholdTarget = cv.THRESH_BINARY,
            otsu : T.bool(title="Use Otsu thresholding") = False,
        ):
    if otsu:
        target |= cv.THRESH_OTSU
    _, ret = cv.threshold(image, low, high, target)
    return ret

@EF.register("Convert to Grayscale", T.grayscale)
def grayscale(image : T.grayscale):
    if not EF.isColor(image):
        return image
    return cv.cvtColor(image, cv.COLOR_BGR2GRAY)

@EF.register("Grayscale to Color", T.color)
def colorize(image : T.grayscale):
    if not EF.isColor(image):
        return cv.cvtColor(image, cv.COLOR_GRAY2BGR)
    return image

@EF.register("Remove Color", T.color)
def removeColor(
            image : T.color,
            channel : T.colorChannel = 1
        ):
    image[:,:,channel] = 0
    return image

@EF.register("Blur", T.image)
def blur(
        image : T.image,
        amount : T.int(min=1, step=2, max=255, title="Pixel range to blur (odd number)") = 5):
    return cv.medianBlur(image, amount)

@EF.register("Write text", T.color)
def writeOn(
            image : T.image,
            text : T.string = 'demo',
            xpct : T.percent = 0.2,
            ypct : T.percent = 0.8,
            # color : T.color = [0, 255, 255],
            size : T.int(min=1, max=255) = 4,
            weight : T.int(min=1, max=255) = 10
        ):

    # TODO: When we have a good color color picker,
    #       make this an op arg.
    color = [255, 255, 255]

    font = cv.FONT_HERSHEY_SIMPLEX
    weight= 10
    if text is None or len(text) == 0:
        return image

    if not EF.isColor(image):
        image = colorize(image)
    height, width, _ = image.shape

    calcx = int(width * xpct)
    calcy = int(height * ypct)
    font = cv.FONT_HERSHEY_SIMPLEX

    image = cv.putText(image, text, (calcx, calcy), font, size, color, weight)
    return image

@EF.register("Grayscale from Color", T.grayscale)
def colorToGray(
            image : T.color,
            channel : T.colorChannel = 1
        ):
    return image[:,:,channel]

@EF.register("Color from Grayscale", T.color)
def grayToColor(
            image : T.grayscale,
            channel : T.colorChannel = 1
        ):
    shape = image.shape + tuple([3])
    colored = np.zeros(shape, dtype="uint8")
    colored[:,:,channel] = image
    return colored

@EF.register("Invert", T.image)
def invert(image : T.image):
    return 255 - image

@EF.register("Blend", T.image)
def blend(
            imageA : T.image,
            imageB : T.image,
            weightA : T.percent = 0.5,
            weightB : T.percent = 0.5,
            gamma : T.byte = 0,
        ):
    return cv.addWeighted(imageA, weightA, imageB, weightB, gamma)

@EF.register("Draw Polygon", T.image)
def drawPoly(
            image : T.image,
            poly  : T.complex(title="2D Polygon array"),
        ):
    pass

# Register a way for complex to save itself. In theory, it
# should return it as is just to be written.
@EF.register("saveComplex", T.complex, sort="hidden")
def saveComplex(inp: T.complex):
    return inp
