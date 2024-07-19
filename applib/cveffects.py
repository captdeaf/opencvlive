import os
import base64

from flask import request

from cvlib import INFO, Effects, cvread, cvwrite, jsApply
from .flaskapp import app, ejson
from .util import debug

# Fetch a JSON object of all known INFO
@app.route('/cv/effects.json', methods=['GET'])
def getCVEffects():
    return ejson.loads(ejson.dumps(INFO))

BASE_PATH = 'html'
CACHE_DIR = 'cached'
UPLOAD_DIR = 'uploads'


def loadImage(dep):
    filepath = f"{BASE_PATH}/{CACHE_DIR}/{dep}.png"

    if dep.startswith(f'{UPLOAD_DIR}/'):
        filepath = f"{BASE_PATH}/{dep}"

    debug(f"cvreading {filepath}")
    return cvread(filepath)

# Generate an opencv image, using passed parameters.
@app.route('/cv/imagegen')
def generateCVImage():
    b64input = request.args.get('p')
    jsobj = ejson.loads(base64.b64decode(b64input))

    newpath = f"{BASE_PATH}/{CACHE_DIR}/{jsobj['outhash']}.png"
    if os.path.isfile(newpath):
        return {}

    deps = [loadImage(dep) for dep in jsobj['dependencies']]

    newimg = jsApply(jsobj['effect'], deps, jsobj['args'])

    cvwrite(newimg, newpath)

    return {}
