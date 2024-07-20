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

# Silly custom register for rotation. As it uses @register above,
# it will get sorted to the top of the list in the toolbox.
@register("Rotate colors", EF.BGR, EF.BGR, desc="Inverted")
def rotate(image, right : T.bool(title="Rotate right or left?") = True):
    b = image[:,:,0]
    g = image[:,:,1]
    r = image[:,:,2]

    if right:
        b, g, r = r, b, g
    else:
        b, g, r = g, r, b

    ret = np.zeros(image.shape, dtype="uint8")
    ret[:,:,0] = b
    ret[:,:,1] = g
    ret[:,:,2] = r

    return ret
