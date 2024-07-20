import os, sys
import base64

from subprocess import Popen, PIPE

from flask import request

from cvlib import INFO, Effects, cvread, cvwrite, jsApply
from .flaskapp import app, ejson
from .util import debug

# Fetch a JSON object of all known INFO
@app.route('/cv/effects.json', methods=['GET'])
def getCVEffects():
    return ejson.loads(ejson.dumps(INFO))

# Generate an opencv image, using passed parameters.
@app.route('/cv/imagegen')
def generateCVImage():
    b64input = request.args.get('p')

    # Feed to 
    subp = Popen('./runeffect.py', text=True, stdin=PIPE)
    subp.communicate(b64input)
    return {}
