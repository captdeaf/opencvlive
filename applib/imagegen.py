# imagegen.py
#
####################################
#
# This generates sample images for each effect's default options. ... if it can.
#
# Samples are generated from html/effimages/demo.png. You are welcome to create
# your own samples, just plop it there and run this script.
#
####################################

import os, sys
import numpy as np

cwd = os.getcwd()
if cwd not in sys.path:
    sys.path.append(cwd)

from cvlib import EF, cv, INFO, Effects

EFFECT_IMAGE_DIR="html/samples/"

DEMO_FILES = [
    cv.imread('html/uploads/demo_landscape.png'),
    cv.imread('html/uploads/demo_sunset.png'),
]

POLY_PTS = np.array([[250, 700], [250, 900], 
                [800, 200], [200, 1300], 
                [200, 700], [1000, 200]])

def defaultCall(name, img):
    return EF.apply(img, getattr(EF, name)())

SPECIAL = {
    'subtract': lambda _: EF.apply(DEMO_FILES[0], EF.subtract(DEMO_FILES[1])),
    'blend': lambda _: EF.apply(DEMO_FILES[0], EF.blend(DEMO_FILES[1], 0.3)),
    'cutPoly': lambda use: EF.apply(use, EF.cutPoly([POLY_PTS], [255, 255, 255])),
}

# Read first demo image as colored, add a grayscale version, then go through
# every Effect, passing it either image as needed.
#
# We have a second demo image for when we need two (merge/blend/etc).
def rebuildEffectImages():
    colored = DEMO_FILES[0]
    grayed = EF.apply(colored,
        EF.grayscale()
    )

    print("Loaded...")
    for eff in INFO['effects'].values():
        name = eff['name']
        filename = f"{EFFECT_IMAGE_DIR}/{name}.png"

        use = colored

        try:
            if name in SPECIAL:
                img = SPECIAL[name](use)
            else:
                img = defaultCall(name, use)

            img = EF.apply(img, EF.writeOn(name, ypct=0.3))

            cv.imwrite(filename, img)
            print(f"{name}: {filename} written")
        except Exception as err:
            print(f"{name}: {filename} failed:")
            print(err)

if (__name__ == "__main__"):
    rebuildEffectImages()
