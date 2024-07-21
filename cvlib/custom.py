# custom.py
#
####################################
#
# Basic effects for cv2 and EF/Effects
#
####################################

import numpy as np
from .effects import EF, cv, T

# register here is a wrapper around EF.register that adds the sort=custom
# value, which ensures the custom effect gets sorted to the start of the list
# in the toolbox library.
def register(*args, **kwargs):
    return EF.register(*args, **kwargs, sort='custom');

# Here is a silly example.
# @register("Swap colors", EF.BGR, EF.BGR, desc="Swap two colors")
def swap(image, a: T.colorChannel(desc='Color 1') = 0,
                b: T.colorChannel(desc='Color 2') = 1):
    dest = image.copy()
    dest[:,:,a] = image[:,:,b]
    dest[:,:,b] = image[:,:,a]

    return dest
