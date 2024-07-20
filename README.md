# opencvlive

OpenCVLive is a small service that lets you see, in real time, the effects of
opencv's calls on images. In a chain:

image->blur->grayscale->threshold->find arucos? Add a bit for finding arucos
if it doesn't already exist, and you can see if it improves or declines by
changing 'blur' from 3 to 7? Or threshold's block size from 83 to 191?

You can have multiple chains, and trees. And see the results of all changed
images live.

Upload an image, select some effects, and have fun!

## Why make it?

OpenCVLive is my attempt at reducing the difficulty curve for me to understand
what steps I need to take in OpenCV to get the result I need.

I've been constantly amazed by people I ask who can say "Yeah, I think you can
do X, Y, then Z to get the ideal image for it." They can see it in their head.
I can't do that at all. (Aphantasia, for those who know the term).

Hence, OpenCVLive: Lets me chain opencv calls in a row and see, real time, the
effects that, say, changing the threshold value from 73 to 127 will have.

## TODO:

Lots of stuff left to do here. In no particular order:

 - Multi-image inputs: for, e.g: cv.merge
 - Non-image processes and arguments. e.g: Find a polygon in one, render it in
   another?
 - More complicated inputs. e.g: polygons? color wheel?
 - Populate the effects list with as many opencv calls as can be done. I'm
   still just a newb working the basics.
 - QoL stuff: Save an output image to uploads. Save+load multiple 'documents'
 - Delete from uploads.
 - Shave that yak next door.
 - Lots of other things.
