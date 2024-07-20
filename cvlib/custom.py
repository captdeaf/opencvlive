# custom.py
#
####################################
#
# Basic effects for cv2 and EF/Effects
#
####################################

import numpy as np
from .effects import EF, cv, T

def register(*args, **kwargs):
    return EF.register(*args, **kwargs, sort='custom');

# @register("Swap colors", EF.BGR, EF.BGR, desc="Swap two colors")
def swap(image, a: T.colorChannel(desc='Color 1') = 0,
                b: T.colorChannel(desc='Color 2') = 1):
    dest = image.copy()
    dest[:,:,a] = image[:,:,b]
    dest[:,:,b] = image[:,:,a]

    return dest
