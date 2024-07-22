# applib/cveffects.py
#
####################################
#
# The little bit of glue between the flask server and the opencv effects libraries.
#
# 90% of the work is done in JS, 10% in cvlib/, this is the way they communicate :D.
#
# Unfortunately: I first had the effect runner here. Now in runeffects.py,
# because (I'm guessing here) flask+python did not appreciate very fast, very
# frequent calls to opencv.imread, running an effect or two, and imwrite. I
# constantly got the message, "Terminate called with no active exception."
#
# And forking a threaded server is always a great idea. (Yeah, I tried it too, it
# didn't work :-(. ).
#
# Hence the server-server solution! :-D.
#
####################################
import os, sys, socket
import base64
from glob import glob

from flask import request

from cvlib import INFO, Effects, jsApply
from .flaskapp import app, ejson
from .util import debug

EF_BIND = 'localhost'
EF_PORT = 8839
EF_RESTART = True

# Launch the runeffect.py fork server. Fire and forget because
# it'll exit if it's already running, which is no problem.
def EFLaunchServer(bind, port):
    global EF_BIND, EF_PORT

    EF_BIND = bind
    EF_PORT = port

    os.spawnl(os.P_NOWAIT, './runeffect.py', './runeffect.py', 'detach', bind, f"{port}")
    os.wait()

# Fetch a JSON object of all known INFO
@app.route('/cv/effects.json', methods=['GET'])
def getCVEffects():
    return ejson.loads(ejson.dumps(INFO))

# Clear our cache.
@app.route('/cv/clearCache', methods=['POST'])
def clearCache():
    for file in glob('html/cached/*'):
        os.remove(file)
    return dict(
        cachesize = len(glob('html/cached/*')),
    )

# Generate an opencv image, using passed parameters.
@app.route('/cv/imagegen')
def generateCVImage():
    b64input = request.args.get('p')
    sock = socket.socket()
    sock.connect((EF_BIND, EF_PORT))
    bout = bytes(b64input, 'utf-8')
    sock.send(bout)
    sock.shutdown(socket.SHUT_WR)
    sock.recv(1)

    return dict(
        cachesize = len(glob('html/cached/*')),
    )
