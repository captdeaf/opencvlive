# opencvlive

Uhh how am I gonna do this. Gigantic tree (with N roots). uuid for each node?

No direct references to each other (prevent nesting)

nodes = {
  'nodeuuid': node
}

What a node needs to know:

   - name
   - effect type
   - effect args
   - effect values
   - image name/location
   - ids of output nodes it pulls its sources from
     + cosmetic: locations of source points.

Two items:
   - An operation: A set of instructions
   - A node: a single in+out of an operation.

Generates them:
   - Server-&gt;Client
