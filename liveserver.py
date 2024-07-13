#!/usr/bin/env python3
#
# liveserver.py
#
# The python backend for opencvlive.
#
# Serves up HTML/js/etc, and the backend operations for opencv effects.

import os, sys, time, threading, argparse
import webbrowser, json

from flask import send_from_directory

cwd = os.getcwd()
if cwd not in sys.path:
    sys.path.append(cwd)

from cvlib.flaskapp import app, jsondump, debug

@app.route('/')
def main_index():
    return send_from_directory('html', 'index.html')

@app.route('/<path:path>', defaults={'file': 'index.html'})
def static_files(path):
    if os.path.isfile(path + "/index.html"):
        return send_from_directory('html', path + "/index.html")
    return send_from_directory('html', path)

import cvlib.uploads

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog=sys.argv[0],
        description="Creates a mini webserver that lets you experiment with opencv's functions, live.",
    )

    parser.add_argument('-p', '--port', default='8838', type=int)
    parser.add_argument('-b', '--bind', default="", type=str)
    parser.add_argument('-w', '--browser', action='store_true', default=False)

    args = parser.parse_args()

    BIND = args.bind
    PORT = args.port

    if args.browser:
        def openBrowser():
            try:
                time.sleep(2)
                webbrowser.open(f"http://{BIND}:{PORT}", new=1)
            except:
                debug("Unable to open browser", file=sys.stderr)
        browserthread = threading.Thread(target=openBrowser)
        browserthread.start()

    try:
        app.run(host=BIND, port=PORT, debug=True)
    except KeyboardInterrupt:
        pass
