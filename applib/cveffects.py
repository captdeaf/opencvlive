from cvlib import INFO
from .flaskapp import app, ejson
from .util import debug

# Fetch a JSON object of all known INFO
@app.route('/cv/effects.json', methods=['GET'])
def getCVEffects():
    return ejson.loads(ejson.dumps(INFO))


# Generate an opencv image, using passed parameters.
@app.route('/cv/imagegen/<name>-<hsh>.<ext>')
def generateCVImage(name, hsh, ext):
    debug(f"Name: {name} ext: {ext} hash: {hsh}")
