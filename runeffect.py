#!/usr/bin/env python3
#
# runeffect.py
#
# The python image generator for opencvlive.

BASE_PATH = 'html'
CACHE_DIR = 'cached'
UPLOAD_DIR = 'uploads'

import os, sys, socket, signal
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

def cleanchild(*args):
    os.wait()

# Generate an opencv image, using passed parameters.
def handle(client):
    # Parse input for args.
    b64input = client.recv(16384)
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
    # Close forked copy.
    client.close()


def main(bind, port, test=False):
    signal.signal(signal.SIGCHLD, cleanchild)
    try:
        server = socket.socket()
        server.bind((bind, port))
        server.listen()
    except:
        print("runeffect.py unable to open socket.")
        print("Usually means it's already running and flask restarted.")
        print("No worries.")
        return

    while True:
        client, addr = server.accept()
        if test:
            handle(client)
            return
        kid = os.fork()
        if kid == 0:
            server.close()
            handle(client)
            return
        # Close parent's copy.
        client.close()


if __name__ == '__main__':
    cmd, opt, bind, port = sys.argv[:4]
    test = False
    if len(sys.argv) > 4 and sys.argv[4] == 'test':
        test = True
    if opt == 'detach':
        # Detach from parent process.
        kid = os.fork()
        if kid == 0:
            os.execv(cmd, [cmd, 'run'] + sys.argv[2:])
        sys.exit(0)
    elif opt == 'run':
        port = int(port)
        main(bind, port, test=test)
    else:
        print("Invalid command")
