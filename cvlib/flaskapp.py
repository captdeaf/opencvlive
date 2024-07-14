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

app = Flask('cvliveserver',
    static_url_path = '',
    static_folder   = STATIC_DIR,
)

# This is ganked from another project of mine. All it really does is
# make class objects default to __dict__. They may optionally have a
# __json_ignore__ to remove keys from it, usually to remove nesting.
class EasyEncoder(json.JSONEncoder):
    def default(self, o):
        if type(o) == object:
            ret = dict()
            ret.update(o.__dict__)
            for ign in getattr(o, '__json_ignore__', []):
                del ret[ign]
            return ret
        else:
            return super().default(o)

# A wrapper around EasyEncoder + json
class ejson(object):
    def dump(*args, **kwargs):
        return json.dump(*args, cls=EasyEncoder, **kwargs)

    def dumps(*args, **kwargs):
        return json.dumps(*args, cls=EasyEncoder, **kwargs)

    def load(*args, **kwargs):
        return json.load(*args, **kwargs)

    def loads(*args, **kwargs):
        return json.loads(*args, **kwargs)

# Get around flask's hijacking of print(), and make it clear.
def debug(msg):
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    print("!!")
    print("!! " + msg, file=sys.stderr)
    print("!!")
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    sys.stderr.flush()

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
