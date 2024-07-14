# cvlib/webhandlers.py
#
# Intended to map cvlive-specific web calls, without getting involved in web
# server code or vice versa

# A sorta-singleton that holds all the cvlive calls.

from cvlib.flaskapp import app, jsondumps, debug, request
import os
from glob import glob

UPLOADS = "html/uploads"
fixUploadPath = lambda p: p[5:]

@app.route('/uploadImage', methods=['POST'])
def uploadImage():
    if request.method != 'POST':
        return "Not Found"

    try: os.mkdir(UPLOADS)
    except: pass

    for data in request.files.getlist("file"):
        debug(data)
        if data.filename:
            data.save(os.path.join(UPLOADS, data.filename))

    return jsondumps("UPLOADED")

@app.route('/uploads', methods=['GET'])
def getUploadedPictures():
    images = [fixUploadPath(x) for x in glob(f"{UPLOADS}/*")]
    return jsondumps(images)
