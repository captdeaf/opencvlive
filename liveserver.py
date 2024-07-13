#!/usr/bin/env python3
#
# liveserver.py
#
# The python backend for opencvlive.
#
# Serves up HTML/js/etc, and the backend operations for opencv effects.

import os, sys, time, threading, argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import webbrowser, json

cwd = os.getcwd()
if cwd not in sys.path:
    sys.path.append(cwd)

from cvlib.webmap import WebMap

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

class OCVLiveHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.strip("/")
        if path in WebMap:
            result = WebMap[path].call(self)
            if result is not None:
                self.respond(result)

        super().do_GET()

    def respond(self, body, code=200, ctype="text/plain", headers=[]):
        if body is None: return

        if type(body) == str:
            self.send_response(code)
            if ctype is not None:
                self.send_header("Content-Type", ctype)
            for (k, v) in headers:
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(bytes(body, 'utf-8'))
            return

        # Otherwise we're JSON
        ctype = "application/json"
        self.send_response(code)
        if ctype is not None:
            self.send_header("Content-Type", ctype)
        for (k, v) in headers:
            self.send_header(k, v)
        self.end_headers()
        # Convert to JSON and send.
        # self.wfile.write(bytes(body, 'utf-8'))
        json.dump(body, self.wfile, indent=2, cls=EasyEncoder)

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
            print("Unable to open browser", file=sys.stderr)
    browserthread = threading.Thread(target=openBrowser)
    browserthread.start()

os.chdir("html")
httpd = ThreadingHTTPServer((BIND, PORT), OCVLiveHandler)
print(f"HTTP Server started on {PORT}")
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    pass
