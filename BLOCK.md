= What is a block in OpenCVLive?

- Has zero or more inputs
- One or more outputs.
- Outputs can be linked to others.
- Outputs can be zoomed. (Depends on type of output).

SERVER_DATA.effects:
  Effects have:
    - param definitions. (dict)
    - output definitions. (array)
    - param name sorting. (array)

Chart Data:
  - Misc
    - name
    - mtime?
  - Block data
    - UUID for processing.
    - effectName
      - (additional effects):
        - imageProvider
        - complexProvider
    - params
      - name
      - jtype (image, complex, string, int, etc)
      - attrs (for inputs: min, max, step, etc.)
      - source (which output to get it from)
        - optional
      - value (if it's direct)
        - optional
      - valueSelector (for selector to find its value. 'input' for most.)
    - outputs
      - jstype (image, complex, string, int, etc)
      - output location (a cached .png or .json)
    - layout
      - pos {x, y}
    - state
      - state (invalid, valid)
      - hash

A Block element contains:
  - data-type="block"
  - blockData

  - Param elements contain:
    - data-type="param"
    - paramData (a reference to blockData's)
    - data-input="image" (or otherwise)
    -
    - on change: call refresh

  - Output elements contain:
    - data-type="output"
    - data-output="image" (or otherwise)
    - data-path

A block element is ready to be included when:
  - It has no unsatisfied inputs
