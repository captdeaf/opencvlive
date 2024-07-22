#!/usr/bin/env python3
#
# runeffect.py
#
# The python image generator for opencvlive.

BASE_PATH = 'html'
CACHE_DIR = 'cached'
UPLOAD_DIR = 'uploads'

from threading import Thread
import os, sys, socket, signal, traceback
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
from cvlib import INFO, Effects, jsApply, cv

def cvread(filename):
    debug(f"Reading {filename}")
    if filename.endswith('.json'):
        with open(filename, 'r', encoding='utf-8') as fin:
            return ejson.load(fin)
    # filename passed around is .png. Convert to .tiff
    return cv.imread(filename, cv.IMREAD_UNCHANGED)

def cvwrite(img, filename):
    debug(f"Writing {filename}")
    if filename.endswith('.json'):
        with open(filename, 'w', encoding='utf-8') as fout:
            return ejson.dump(img, fout)
    return cv.imwrite(filename, img)

def cleanchild(*args):
    os.wait()

# Generate an opencv image, using passed parameters.
def handle(client):
    # Parse input for args.
    try:
        b64input = client.recv(16384)

        jsobj = ejson.loads(base64.b64decode(b64input))

        print("We got")
        print(jsobj)

        effect = jsobj['effect']
        args = jsobj['args']

        if 'dependencies' in jsobj:
            for k, v in jsobj['dependencies'].items():
                print(v)
                path = f"{BASE_PATH}/{v}"
                print(f"{k}: {path}")
                args[k] = cvread(path)
        
        results = jsApply(jsobj['effect'], args)

        outs = jsobj['outputs']

        if len(outs) > 1:
            for out, result in zip(outs, results):
                cvwrite(result, 'html/' + out['path'])
        else:
            cvwrite(results, 'html/' + outs[0]['path'])
        return True
    except Exception as err:
        print("error")
        print(traceback.format_exc())
        return False

RUNNING = True
RESTART = False

def stopWatcher():
    os.remove('.runeffect.watch')

def startWatcher(bind, port):
    global RUNNING
    global RESTART

    watcher = inotify.adapters.Inotify()

    with open('.runeffect.watch', 'w') as fout:
        fout.write('watching')

    # I do this instead of watching the directory because
    # otherwise it triggers on my editor .swp file changes.
    for path in ['cvlib/*.py', 'appli/*.pyb', '*.py', '.runeffect.watch']:
        for file in glob(path):
            print(f"Watching {file}")
            watcher.add_watch(file)

    print("Watching for file changes.")

    for event in watcher.event_gen(yield_nones=False):
        # Main thread's check on the watcher..
        if not RUNNING: break

        (_, type_names, path, filename) = event
        for tname in type_names:
            if tname in ['IN_MOVE_SELF', 'IN_DELETE_SELF', 'IN_CLOSE_WRITE']:
                print(f"Quitting because of {path} and {filename} for {tname}")
                RUNNING=False
                RESTART=True
                break
   
    s = socket.socket()
    s.connect((bind, port))
    s.close()


def main(bind, port, test=False):
    global RUNNING
    global RESTART
    signal.signal(signal.SIGCHLD, cleanchild)

    try:
        server = socket.socket()
        server.bind((bind, port))
        server.listen()
    except:
        print("runeffect.py unable to open socket.")
        print("Usually means it's already running and flask restarted.")
        print("No worries, exiting..")
        return

    if (inotify.adapters):
        thread = Thread(target=startWatcher, args=(bind, port))
        thread.start()

    try:
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
                    if handle(client):
                        client.send('1')
                    else:
                        client.send('0')
                    client.close()
                except Exception as err:
                    client.close()
                sys.exit(0)
            # Close parent's copy.
            client.close()
    except KeyboardInterrupt as kbe:
        RUNNING=False
        stopWatcher()
        if (inotify.adapters):
            thread.join()
        sys.exit(0)

    server.close()
    if (inotify.adapters):
        thread.join()
    print("Closed")


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
            print("File changed. Triggering restart.")
            os.execv(cmd, sys.argv)
        else:
            sys.exit(0)
    else:
        print("Invalid command")
