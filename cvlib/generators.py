# generators.py
#
####################################
#
# Basic idea here is for blocks that create things without needing image or
# complex inputs.
#
# e.g: a chart equivalent of "np.zeros" or the like.
#
####################################

import numpy as np
from .effects import EF, cv, T

@EF.register("np.zeros", T.grayscale)
def npZeros(shape : T.complex):
    return np.zeros(shape, np.uint8)
