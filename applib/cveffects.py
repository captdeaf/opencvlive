from cvlib import INFO
from .flaskapp import app, ejson

# Fetch a JSON object of all known INFO
@app.route('/cv/effects.json', methods=['GET'])
def getCVEffects():
    return ejson.loads(ejson.dumps(INFO))
