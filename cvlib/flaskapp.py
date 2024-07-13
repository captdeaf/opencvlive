# flaskapp.py
#
# Basics and utilities for flask and various paths.

from flask import Flask, request, redirect, url_for
import argparse, sys, json

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

app = Flask(
    'cvliveserver',
    static_url_path='',
    static_folder='html',
)

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

def jsondump(body, file, **kwargs):
    json.dump(body, file, cls=EasyEncoder, **kwargs)

def debug(msg):
    print(msg, file=sys.stderr)
    sys.stdout.flush()
