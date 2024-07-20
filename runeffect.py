#!/usr/bin/env python3
#
# runeffect.py
#
# The python image generator for opencvlive.

BASE_PATH = 'html'
CACHE_DIR = 'cached'
UPLOAD_DIR = 'uploads'

import os, sys
import base64

cwd = os.getcwd()
if cwd not in sys.path:
    sys.path.append(cwd)

from applib.util import ejson, debug
from cvlib import INFO, Effects, cvread, cvwrite, jsApply

def getPath(dep):
    dep = dep.strip('/')
    if dep.startswith(f'{UPLOAD_DIR}/'):
        return f"{BASE_PATH}/{dep}"

    return f"{BASE_PATH}/{CACHE_DIR}/{dep}.png"

# Generate an opencv image, using passed parameters.
def main():
    # Parse input for args.
    try:
        b64input = sys.stdin.read()
        jsobj = ejson.loads(base64.b64decode(b64input))
        # debug(ejson.dumps(jsobj, indent=2))

        # What is our hashed outfile going to be?
        newpath = f"{BASE_PATH}/{CACHE_DIR}/{jsobj['outhash']}.png"
        if os.path.isfile(newpath):
            return {}

        # Load images we're basing off of.

        deps = [cvread(getPath(dep)) for dep in jsobj['dependencies']]

        newimg = jsApply(jsobj['effect'], deps, jsobj['args'])

        cvwrite(newimg, newpath)
        debug("Done")
    except err:
        debug(err)


if __name__ == '__main__':
    main()
