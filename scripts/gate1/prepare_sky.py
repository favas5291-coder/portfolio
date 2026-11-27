"""Convert the CC0 Rained Street HDRI to the daylight sky fill for The Appointment.
blender -b -P scripts/gate1/prepare_sky.py -- /path/to/rained-street.exr
"""
from pathlib import Path
import sys
import bpy
import numpy as np

source = Path(sys.argv[sys.argv.index("--") + 1])
repo = Path(__file__).resolve().parents[2]
image = bpy.data.images.load(str(source.resolve()))
width, height = image.size
pixels = np.empty(width * height * 4, np.float32)
image.pixels.foreach_get(pixels)
pixels = pixels.reshape(height, width, 4)
# The set supplies the street and its lights. Keep the storm canopy, feather
# its low skyline into a neutral horizon and discard the photographed streetscape.
# The open street canyon contains the photographed cloud bank between the
# buildings. Sample this sector only. Flatten chrome highlights from street
# lights near the original skyline before remapping to the outdoor exposure.
patch = pixels[int(height*.84):int(height*.97), int(width*.455):int(width*.548), :3]
luma = np.log1p(patch.mean(axis=2) * 60)
lo, hi = np.percentile(luma,[9,92])
luma = np.clip((luma-lo) / max(.0001,hi-lo),0,1)
x = np.arange(width) / width
horizon = np.array([.57,.62,.63])
for row in range(height):
    altitude = row / (height-1)
    if altitude < .5:
        pixels[row,:,:3] = np.array([.18,.19,.17]) + (horizon - [.18,.19,.17]) * (altitude*2)**4
        continue
    elevation = 2*altitude-1
    j = min(len(patch)-1, int(elevation*(len(patch)-1)))
    longitude = (.5-.5*np.cos((x+.13)*np.pi*2)) * (patch.shape[1]-1)
    cloud = np.interp(longitude,np.arange(patch.shape[1]),luma[j])
    fade = np.sin(np.pi*elevation)**.8
    pixels[row,:,:3] = horizon + np.array([-.19,-.13,-.06])*elevation + (cloud[:,None]-.5)*fade*.31
image.pixels.foreach_set(pixels.reshape(-1))
dest = repo / 'public/appointment/environment/after-rain.hdr'
dest.parent.mkdir(parents=True, exist_ok=True)
image.filepath_raw = str(dest)
image.file_format = 'HDR'
image.save()
