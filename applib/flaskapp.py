# flaskapp.py
#
#####################################
#
# flaskapp.py creates a mini webserver allowing uploads and index.html.
# Intended as a base for a more complex server.
#
#####################################

# Where the html and js files are.
STATIC_DIR  = 'html'

# Directories where uploads are kept. Ideally a subdirectory of STATIC_DIR
UPLOAD_DIR     = "html/uploads"

# For converting an uploaded, globbed path ("html/uploads/*") into a path
# suitable for web client. Usually just means chopping off static folder.

UPLOAD_TO_PATH = lambda p: p[len(STATIC_DIR):]


####################################
#
# Begin Flask app, but don't initialize it. That's for main() or
# importer.
#
####################################

from flask import Flask, request, redirect, url_for, send_from_directory
import os, sys, json
from glob import glob
from .util import ejson

app = Flask('cvliveserver',
    static_url_path = '',
    static_folder   = STATIC_DIR,
)

####################################
#
# Routes for stuff not directly related to CV.
#
####################################

# Index.html
@app.route('/')
def static_index():
    return send_from_directory('html', 'index.html')

# Static files, including from uploads.
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('html', path)

# Upload files to the server's UPLOAD_DIR
#
@app.route('/upload', methods=['POST'])
def uploadFile():
    if request.method != 'POST':
        return "Not Found"

    try: os.mkdir(UPLOAD_DIR)
    except: pass

    for data in request.files.getlist("file"):
        debug(data)
        if data.filename:
            data.save(os.path.join(UPLOAD_DIR, data.filename))

    return ejson.dumps("UPLOADED")

# Fetch a JSON array listing all the files in UPLOAD_DIR
@app.route('/uploads', methods=['GET'])
def getUploads():
    images = [UPLOAD_TO_PATH(x) for x in glob(f"{UPLOAD_DIR}/*")]
    return ejson.dumps(images)


if __name__ == "__main__":
    app.run(host='', port='8838', debug=True)
