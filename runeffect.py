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
from cvlib import INFO, Effects, jsApply, cv, TYPE_DECODERS

def cvread(filename):
    if filename.endswith('.json'):
        with open(filename, 'r', encoding='utf-8') as fin:
            return ejson.load(fin)
    # filename passed around is .png. Convert to .tiff
    return cv.imread(filename, cv.IMREAD_UNCHANGED)

def cvwrite(img, filename):
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

        # debug("We got: " + ejson.dumps(jsobj))

        effect = jsobj['effect']
        args = jsobj['args']
        outs = jsobj['outputs']

        cached = True
        for out in outs:
            path = f"{BASE_PATH}/{out['path']}"
            if not os.path.isfile(path):
                cached = False

        if cached:
            return None

        if 'dependencies' in jsobj:
            for k, v in jsobj['dependencies'].items():
                path = f"{BASE_PATH}/{v}"
                args[k] = cvread(path)

        # debug("Comparison: " + ejson.dumps(INFO['effects'][effect]['parameters']))

        mappedArgs = dict()

        for desc in INFO['effects'][effect]['parameters']:
            decoder = TYPE_DECODERS[desc['cname']]
            mappedArgs[desc['name']] = decoder.fromJSON(args[desc['name']])
        
        results = jsApply(jsobj['effect'], mappedArgs)

        # Because I can't tell if results is an array intended
        # to be a single result or multiple, I'm using outs.
        if len(outs) > 1:
            for out, result in zip(outs, results):
                cvwrite(result, f"{BASE_PATH}/{out['path']}")
        else:
            cvwrite(results, f"{BASE_PATH}/{outs[0]['path']}")
        return None
    except Exception as err:
        print('err', file=sys.stderr)
        return err.args[0]

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
    
        success = bytes('1', 'utf-8')
        failure = bytes('0', 'utf-8')
        while RUNNING:
            client, addr = server.accept()
            if test:
                msg = handle(client)
                client.close()
                if (msg):
                    print("Error", file=sys.stderr)
                    print(msg, file=sys.stderr)
                return
            kid = os.fork()
            if kid == 0:
                server.close()
                try:
                    msg = handle(client)
                    if not msg:
                        client.send(success)
                    else:
                        client.send(bytes(msg, 'utf-8'))
                    client.shutdown(socket.SHUT_WR)
                    client.close()
                except Exception as err:
                    client.send(failure)
                    client.shutdown(socket.SHUT_WR)
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
