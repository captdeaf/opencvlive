# __init__.py for cvlib's effects.
#
####################################
#
# This directory has effects.py definitions and all our opencv effect wrappers.
#
####################################

# effect class definitions first, it's used by the rest
from .effects import EF, Effects, register, INFO, cvread, cvwrite, jsApply

# Just handy for effect file imports
import cv2 as cv

# Now the actual effects.
from . import basics

from .typedefs import T, JSDict, TYPE_DECODERS

# __all__ = ['effects', 'EF', 'register', 'INFO', 'T', 'JSDict', 'TYPE_DECODERS']
