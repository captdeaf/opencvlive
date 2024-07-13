# cvlib/webhandlers.py
#
# Intended to map cvlive-specific web calls, without getting involved in web
# server code or vice versa

# A sorta-singleton that holds all the cvlive calls.
WebMap = {}

class Handler(object):
    def __init__(self, path, func):
        self.path = path
        self.call = func

def handle(path):
    def mapfunc(func):
        WebMap[path] = Handler(path, func)
    return mapfunc

@handle("alltools.js")
def gettools(handler):
    """
    Get a list of all tools. We don't really care about arguments yet.
    """
    return []

__all__ = ['WebMap', 'handle']
