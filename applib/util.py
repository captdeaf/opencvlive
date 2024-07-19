# util.py
#

import re
import json
import sys, os

# This is ganked from another project of mine. All it really does is
# make class objects default to __dict__. They may optionally have a
# __json_ignore__ to remove keys from it, usually to remove nesting.
class EasyEncoder(json.JSONEncoder):
    def default(self, o):
        ret = dict()
        if hasattr(o, 'toDict'):
            return o.toDict()
        elif type(o) == object:
            ret.update(o.__dict__)
            for ign in getattr(o, '__json_ignore__', []):
                ret.pop(ign)
            return ret
        else:
            return super().default(o)

# A wrapper around EasyEncoder + json
class ejson(object):
    def dump(*args, **kwargs):
        return json.dump(*args, cls=EasyEncoder, **kwargs)

    def dumps(*args, **kwargs):
        return json.dumps(*args, cls=EasyEncoder, **kwargs)

    def load(*args, **kwargs):
        return json.load(*args, **kwargs)

    def loads(*args, **kwargs):
        return json.loads(*args, **kwargs)

# Get around flask's hijacking of print(), and make it clear.
def debug(msg):
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    print("!!")
    print("!! " + msg, file=sys.stderr)
    print("!!")
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    sys.stderr.flush()

# Building our html templates, which are getting unwieldy.
#
# Very straightforward. {{basename}} and that's it.
TEMPLATE_RE = re.compile(r'\{\{(\w+)\}\}')

def optimize(content):
    # 'content' is html code that has lots of whitespace, etc.
    stripped = re.sub(r'\s+',' ', content)
    return re.sub(r'>\s+<','><', stripped)

def buildTemplates(filename, dirname):
    print("buildTemplates called")
    with open(f"{dirname}/{filename}.html", 'r', encoding='utf-8') as fin:
        body = fin.read()

    return optimize(re.sub(TEMPLATE_RE, lambda x: buildTemplates(x[1], dirname), body))
