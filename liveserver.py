#!/usr/bin/env python3
#
# liveserver.py
#
# The python backend for opencvlive.
#
# Serves up HTML/js/etc, and the backend operations for opencv effects.
#
# Additional: Create all the sample images, if they don't exist (spot check
# latest)
#
# LATEST_SAMPLE is path to latest sample. In other words, if we manage a new
# sample generation, change this to that sample.
#
####################################

LATEST_SAMPLE = 'html/samples/blend.png'

TEMPLATE_BASE = 'index'
TEMPLATE_DIR = 'templates'
TEMPLATE_OUT = 'html/index.html'

import os, sys, time, threading, argparse
from glob import glob

cwd = os.getcwd()
if cwd not in sys.path:
    sys.path.append(cwd)

####################################
#
# Initialize app and import all the effects and routes for opencvlive
#
####################################

from applib.flaskapp import app

# Load OpenCV stuff
from cvlib import EF, INFO

# And routes for OpenCV
from applib import cveffects

from applib.imagegen import rebuildEffectImages

####################################
#
# Main: parse args, launch a browser if requested, and start the app.
#
####################################


def main():
    parser = argparse.ArgumentParser(
        prog=sys.argv[0],
        description="Creates a mini webserver that lets you experiment with opencv's functions, live.",
    )

    # This server.
    parser.add_argument('-b', '--bind', default='localhost', type=str)
    parser.add_argument('-p', '--port', default='8838', type=int)
    # Effect fork-and-process server
    parser.add_argument('-e', '--ebind', default='', type=str)
    parser.add_argument('-f', '--eport', default='8839', type=int)
    # Launch browser?
    parser.add_argument('-w', '--browser', action='store_true', default=False)

    args = parser.parse_args()

    rebuildEffectImages()

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
        # cveffects.EFLaunchServer(args.ebind, args.eport)
        cveffects.EFInitialize()
        app.run(host=args.bind, port=args.port, threaded=True, debug=True, use_reloader=True)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
