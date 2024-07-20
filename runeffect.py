#!/usr/bin/env python3
#
# runeffect.py
#
# The python image generator for opencvlive.

BASE_PATH = 'html'
CACHE_DIR = 'cached'
UPLOAD_DIR = 'uploads'

from threading import Thread
import os, sys, socket, signal
import base64

from glob import glob

try:
    import inotify.adapters
except:
    inotify = object()
    inotify.adapters = False
    pass

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
    try:
        b64input = client.recv(16384)
        jsobj = ejson.loads(base64.b64decode(b64input))

        # What is our hashed outfile going to be?
        newpath = f"{BASE_PATH}/{CACHE_DIR}/{jsobj['outhash']}.png"
        if os.path.isfile(newpath):
            return

        # Load images we're basing off of.

        deps = [cvread(getPath(dep)) for dep in jsobj['dependencies']]

        
        newimg = jsApply(jsobj['effect'], deps, jsobj['args'])

        cvwrite(newimg, newpath)
    except: pass

RUNNING = True
RESTART = False

def watchAndRestart(bind, port):
    global RUNNING
    global RESTART

    watcher = inotify.adapters.Inotify()

    for path in ['cvlib/*.py', 'applib/*.py', '*.py']:
        for file in glob(path):
            watcher.add_watch(file)

    print("Watching for file changes.")

    for event in watcher.event_gen(yield_nones=False):
        RUNNING=False
        RESTART=True
        break
   

    print("File changed. Triggering restart.")
    s = socket.socket()
    s.connect((bind, port))
    s.close()


def main(bind, port, test=False):
    signal.signal(signal.SIGCHLD, cleanchild)

    if (inotify.adapters):
        thread = Thread(target=watchAndRestart, args=(bind, port))
        thread.start()

    try:
        server = socket.socket()
        server.bind((bind, port))
        server.listen()
    except:
        print("runeffect.py unable to open socket.")
        print("Usually means it's already running and flask restarted.")
        print("No worries.")
        return

    while RUNNING:
        client, addr = server.accept()
        if test:
            handle(client)
            client.close()
            return
        kid = os.fork()
        if kid == 0:
            server.close()
            try:
                handle(client)
                client.close()
            except Exception as err:
                client.close()
            sys.exit(0)
        # Close parent's copy.
        client.close()

    print("Shutting down")
    if (inotify.adapters):
        thread.join()
    server.close()
    print("Closed")
    return


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
        if RESTART:
            print("Restarting")
            os.execv(cmd, sys.argv)
    else:
        print("Invalid command")
