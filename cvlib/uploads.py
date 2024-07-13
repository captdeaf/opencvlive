# cvlib/webhandlers.py
#
# Intended to map cvlive-specific web calls, without getting involved in web
# server code or vice versa

# A sorta-singleton that holds all the cvlive calls.

from cvlib.flaskapp import app, jsondump, debug, request
import os

UPLOADS = "uploads"

@app.route('/uploadImage', methods=['POST'])
def uploadImage():
    debug("uI hit")
    if request.method != 'POST':
        return "Not Found"

    try: os.mkdir(UPLOADS)
    except: pass

    for field, data in request.files.items():
        if data.filename:
            data.save(os.path.join(UPLOADS, data.filename))
    return "OK"
