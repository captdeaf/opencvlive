#!/usr/bin/env python3
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

cwd = os.getcwd()
if cwd not in sys.path:
    sys.path.append(cwd)

from cvlib import EF, cv, INFO, Effects

EFFECT_IMAGE_DIR="html/effimages/"

# Read demo.png as colored, add a grayscale version, then go
# through every Effect, passing it either image as needed.
def rebuildEffectImages():
    colored = cv.imread(f"{EFFECT_IMAGE_DIR}/demo.png")
    grayed = EF.apply(colored,
        EF.grayscale()
    )

    print("Loaded...")
    for eff in INFO['effects'].values():
        name = eff['name']
        filename = f"{EFFECT_IMAGE_DIR}/{name}.png"

        use = colored
        if (eff['channelfrom'] == EF.GRAYSCALE):
            use = grayed

        try:
            if True or (not os.path.exists(filename)):
                # Eh, at present this is small enough not to need
                # checking, and I'm frequently evolving everything
                # anyway.
                img = EF.apply(use,
                    getattr(EF, name, lambda x: None)(),
                    EF.writeOn(name, ypct=0.3, color=[0, 40, 0]),
                )
                cv.imwrite(filename, img)
                print(f"{name}: {filename} written")
            else:
                print(f"{name}: {filename} exists")
        except Exception as err:
            print(f"{name}: {filename} failed:")
            print(err)

if (__name__ == "__main__"):
    rebuildEffectImages()
