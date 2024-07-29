# types.py
#
#  So uh ... turns out JS and JSON are doing all the heavy lifting. The classes
#  below aren't really needed. Not yet, anyway? Still, the JSDicts are needed
#  to tell JS what to do.
#
####################################
#
# A collection of various types for OpenCV, from vague ("any string") to specific
# ("a %age between 0 and 1" or "a number indicating a bitwise set of flags.")
#
# This file is actually mostly for the JS end. A 'type' as far as we are concerned
# is:
#   - What JS needs to accurately represent the type.
#   - What we need to transform the type from JSON to an argument.
#   - A way to pass options from effect type def to JS. (min/max/etc)
#
####################################
#
# So the 'flow' here goes:
#
# 1) Javascript side implements type and type 'safety' on its side. ('safety'
#    in terms of the user, not type checking.)
#
# 2) Each EF effect has annotations, and every keyword must be a kwarg. This
#    is separate from opencv calls, as EF calls sit between.
#
# 3) When generating INFO, effects.py generates a kwargs, arg:type listing.
#    Just a string name and string type.
#
# 4) JS makes the inputs. User does selection on the JS side.
#
# 5) When activated (typically live), JS submits its arguments in kwargs-style
#    JSON format. {"<name"> = {json...}}
#
# 6) When server receives it, it uses the information generated in #2, combined
#    with the classes of Types, to convert arguments.
#
# This uses annotations:
#
# When annotated, an effect function should have __annotations__ of:
#
#    {kwargname = JSType, ...}
#
# PRIMARY TYPE CLASSES:
#
#   @T(name) is a class decorator that defines @T.name, and instantiates it as
#            a JSDict.
#
#   @T('int')
#   class TInt(TJson):
#       pass
#
#   @T('byte')
#   class TByte(TInt):
#       min=0
#       max=255
#
#   @T('select')
#   class TSelect(TJson):
#         ...
#
# SAVED SUBCLASSES
#
#    @T.select('channel', options={'blue': 0, 'green': 1, 'red': 2))
#    => @T.select.channel
#
#    @T.float('percentage', min=0.0, max=1.0)
#
# ANNOTATIONS:
#
#    @register(EF.BGR, EF.GRAY)
#    def effect(image,
#               channel : @T.select.channel = 1,
#               threshold : @T.int(min=0, max=256) = 1,
#               channel : @T.int(min=0, max=2) = 1,

TYPE_DECODERS = dict()

class JSDict(object):
    """
    JSDict: Represents a class+dict combo, but also can be called as a function
            to present a merged JSDict of the same "class". It uses a classname
            (cname) to tell the client javascript what to use. The sub-dicts
            will contain arguments such as limits, min+max, select names, etc.

            I'm using the top level JSDict to represent classes.

            It uses the name 'cname' to change and pass down 'class' names.
            Which are generally not overridden, but can be.

    e.g:
      class Dog(object):
          trainable=True
          sname='canine'

      pitbull = JSDict(Dog, 'pitbull', favorite_food='Kibble', color='brown')

      rex = pitbull(color='white and brown')
      jaxy = pitbull(color='white')

      jaxyskid = jaxy(favorite_food='people')

      print(jaxyskid.toDict())

      # Expected output.
      {'favorite_food': 'people', 'color': 'white',
       'cname': 'pitbull', 'trainable': True,
       'sname': 'canine'}
    """
    def __init__(self, cls, cname=None, **kwargs):
        self.cls = cls
        self.cname = cname

        kwargs.update(cname=cname)
        self.data = kwargs

        if cname not in TYPE_DECODERS:
            TYPE_DECODERS[cname] = cls()

        inst = TYPE_DECODERS[cname]

        for k, v in vars(cls).items():
            if k.startswith('_'): continue
            if type(v).__name__ in ['function']: continue

            self.data[k] = v

    def __getitem__(self, k):
        return self.data[k]

    def __setitem__(self, k, v):
        self.data[k] = v
        return v

    def __call__(self, *args, **kwargs):
        result = dict(**self.data)
        if len(args) > 0:
            result['args'] = args
        
        result.update(kwargs)

        if 'cname' not in result:
            result['cname'] = self.cname

        return JSDict(self.cls, **result)

    def toDict(self):
        ret = dict()
        for k, v in self.data.items():
            if hasattr(v, 'toDict'):
                ret[k] = v.toDict()
            else:
                ret[k] = v

        return ret

class TType(object):
    def __init__(self):
        self.classes = dict()
        self.jsdicts = dict()

    def __call__(self, name):
        # @T('name')(cls)
        def _call(cls):
            # For decoding.
            self.classes[name] = cls
            
            # @T.name  to return cls/jsdict
            jsd = JSDict(cls, name)
            self.jsdicts[name] = jsd
            setattr(self, name, jsd)

            return cls
        return _call

    def __getitem__(self, name):
        return self.classes[name]

T = TType()

@T('json')
class TJSON(object):
    # Convert from JSON. For most of the simple types, this is already done on
    # the JS side, so we just take the jsonarg as our arg.
    def __init__(self):
        pass

    def fromJSON(self, jsonarg):
        return jsonarg

@T('int')
class TInt(TJSON): pass

@T('string')
class TString(TJSON): pass

T.byte = T.int(min=0, max=255)

@T('float')
class TFloat(TInt): pass

T.double = T.float

@T('percent')
class TPercent(TFloat):
    min=0.0
    max=1.0

@T('bool')
class TBool(TJSON):
    pass

@T('select')
class TSelect(TString):
    pass

T.colorChannel = T.select({
    "BLUE": 0,
    "GREEN": 1,
    "RED": 2,
}, title="Color channel", ctype='int')

@T('image')
class TImage(TString):
    type = 'ANY'
    # Complex one, need to convert TString to a path?
    pass

T.grayscale = T.image(type='Grayscale')
T.bgr = T.image(type='Color')
T.color = T.bgr

@T('complex')
class TComplex(TJSON):
    def fromJSON(self, jsonarg):
        return jsonarg
