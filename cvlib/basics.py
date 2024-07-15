# basics.py
#
####################################
#
# Basic effects for cv2 and EF/Effects
#
####################################

from .effects import EF, cv

@EF.register(EF.GRAYSCALE, EF.GRAYSCALE)
def adaptiveThreshold(frame, cmax=255, invert=False, gaussian=False, blockSize=11, weight=2):
    method = cv.ADAPTIVE_THRESH_MEAN_C
    if gaussian:
        method = cv.ADAPTIVE_THRESH_GAUSSIAN_C
    target = cv.THRESH_BINARY
    if invert:
        target = cv.THRESH_BINARY_INV
    return cv.adaptiveThreshold(frame, cmax, method, target, blockSize, weight)

@EF.register(EF.GRAYSCALE, EF.GRAYSCALE)
def threshold(frame, low=128, high=255, otsu=False, invert=False):
    method = cv.THRESH_BINARY
    if invert:
        method = cv.THRESH_BINARY_INV
    if otsu:
        method |= cv.THRESH_OTSU
    _, ret = cv.threshold(frame, low, high, method)
    return ret

@EF.register(EF.ANY, EF.GRAYSCALE)
def grayscale(image):
    if not EF.isColor(image):
        return image
    return cv.cvtColor(image, cv.COLOR_BGR2GRAY)

@EF.register(EF.ANY, EF.BGR)
def colorize(image, channel=None):
    if not EF.isColor(image):
        return cv.cvtColor(image, cv.COLOR_GRAY2BGR)
    return image

@EF.register(EF.BGR, EF.BGR)
def pluckColor(image, channel=2):
    if channel != 0:
        image[:,:,0] = 0
    if channel != 1:
        image[:,:,1] = 0
    if channel != 2:
        image[:,:,2] = 0
    return image

@EF.register(EF.ANY, EF.SAME)
def blur(frame, amount=5):
    return cv.medianBlur(frame, amount)

@EF.register(EF.ANY, EF.BGR)
def writeOn(frame, text='demo', xpct=0.2, ypct=0.8, color=[0, 255, 255], size=4,
            font=cv.FONT_HERSHEY_SIMPLEX, weight=10):

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

@EF.register(EF.ANY, EF.SAME)
def removeBG(frame, bgr, learningRate = 0):
    return bgr.apply(frame, learningRate = learningRate)

@EF.register(EF.BGR, EF.GRAYSCALE)
def colorToGray(image, channel=1):
    return image[:,:,channel]

@EF.register(EF.GRAYSCALE, EF.BGR)
def grayToColor(image, channel=3):
    shape = image.shape + (3,)
    colored = np.zeros(shape, dtype="uint8")
    colored[:,:,channel] = image
    return colored

@EF.register(EF.ANY, EF.SAME)
def subtract(image, sub):
    return cv.subtract(image, sub)

@EF.register(EF.ANY, EF.SAME)
def blend(image, second, alpha, gamma=0.0):
    return cv.addWeighted(image, 1.0-alpha, second, alpha, gamma)

@EF.register(EF.BGR, EF.SAME)
def brighten(image, pct=0.25):
    hsv = cv.cvtColor(image, cv.COLOR_BGR2HSV)
    h, s, v = cv.split(hsv)

    v[:] *= pct
    v[v > 255] = 255

    newhsv = cv.merge((h, s, v))
    return cv.cvtColor(newhsv, cv.COLOR_HSV2BGR)

@EF.register(EF.ANY, EF.SAME)
def cutPoly(image, pts):
    mask = np.zeros(image.shape[:2], dtype="uint8")
    cv.fillPoly(mask, pts, 1)

    if EF.isColor(image):
        image[mask == 0] = [0, 0, 0]
    else:
        image[mask == 0] = 0
    
    return image

@EF.register(EF.ANY, EF.SAME)
def invert(image):
    return 255 - image
