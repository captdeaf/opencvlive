#!/usr/bin/env python3
#
# liveserver.py
#
# The python backend for opencvlive.
#
# Serves up HTML/js/etc, and the backend operations for opencv effects.

import os, sys, time, threading, argparse

cwd = os.getcwd()
if cwd not in sys.path:
    sys.path.append(cwd)

from cvlib.flaskapp import app

def main():
    parser = argparse.ArgumentParser(
        prog=sys.argv[0],
        description="Creates a mini webserver that lets you experiment with opencv's functions, live.",
    )

    parser.add_argument('-p', '--port', default='8838', type=int)
    parser.add_argument('-b', '--bind', default="", type=str)
    parser.add_argument('-w', '--browser', action='store_true', default=False)

    args = parser.parse_args()

    if args.browser:
        import webbrowser
        def openBrowser():
            try:
                time.sleep(2)
                webbrowser.open(f"http://{args.bind}:{args.port}", new=1)
            except:
                debug("Unable to open browser", file=sys.stderr)
        browserthread = threading.Thread(target=openBrowser)
        browserthread.start()

    try:
        app.run(host=args.bind, port=args.port, debug=True)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
