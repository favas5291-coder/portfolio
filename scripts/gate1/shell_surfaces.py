"""Prepare tileable colour, normal and packed AO/roughness maps for the Blender shell."""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SOURCE = Path(__file__).resolve().parents[2] / 'public/appointment/finishes'


def make(out):
    out.mkdir(parents=True, exist_ok=True)
    recipes = [
        ('laterite', 'masonry', (.78, .77, .74), .89, .76),
        ('lime', 'limewash', (.96, .97, .95), .89, 2.0),
        ('teak', 'timber', (.81, .75, .68), .48, 1.1),
        ('dry', 'honed-stone', (.82, .84, .82), .76, 1.4),
        ('paving', 'wet-basalt', (1.15, 1.08, 1.), .60, 1.8),
        ('road', 'asphalt', (1.02, 1., .98), .70, 1.7),
    ]
    for idx, (name, file, tint, rough, amplitude) in enumerate(recipes):
        im = Image.open(SOURCE / (file + '.webp')).convert('RGB')
        rgb = np.array(im, dtype=float) / 255
        if name == 'laterite':
            # Alter each photographed course inside its mortar joint. Offset related rows
            # in different directions to break the repeated vertical bond.
            cuts = [0,9,124,244,360,482,571,658,768]
            for j,(a,b) in enumerate(zip(cuts,cuts[1:])):
                band=rgb[a:b]
                if j%3==1:band=band[:,::-1]
                rgb[a:b]=np.roll(band,(137*j)%589,axis=1)
            lum=(rgb@np.array([.2126,.7152,.0722]))[:,:,None]
            rgb=.50*rgb+.50*lum
            rgb=rgb*.78+.085
        shape = rgb.shape[:2]
        rng = np.random.default_rng(52700 + idx)
        height = rgb @ np.array([.2126, .7152, .0722])
        grit = rng.normal(0, .018 if name != 'lime' else .01, shape)
        height = height + grit
        # Periodic multi-scale film. Depressions remain wet between larger drying areas.
        water = np.zeros(shape)
        for size, weight in [(9,.56), (28,.28), (63,.16)]:
            noise = rng.uniform(0, 1, (size, size))
            wrapped = np.pad(noise, 1, mode='wrap')
            tile = Image.fromarray((wrapped*255).astype('uint8')).resize(
                (shape[1]+2*shape[1]//size, shape[0]+2*shape[0]//size), Image.Resampling.BICUBIC)
            margin_x, margin_y = shape[1]//size, shape[0]//size
            water += weight * np.asarray(tile.crop((margin_x,margin_y,margin_x+shape[1],margin_y+shape[0]))) / 255
        wet = np.clip((water - .40) / .22, 0, 1) if name in ('paving','road') else np.zeros(shape)
        albedo = np.clip((rgb+grit[:,:,None]*.45) * tint * (1 - .23*wet[:,:,None]), 0, 1)
        Image.fromarray((albedo*255).astype('uint8')).save(out / (name+'-color.jpg'), quality=88)
        dx = (np.roll(height,-1,1)-np.roll(height,1,1))*amplitude*(1-.60*wet)
        dy = (np.roll(height,-1,0)-np.roll(height,1,0))*amplitude*(1-.60*wet)
        n = np.stack((-dx,dy,np.ones(shape)),axis=-1)
        n /= np.linalg.norm(n,axis=-1,keepdims=True)
        Image.fromarray(((n*.5+.5)*255).astype('uint8')).save(out / (name+'-normal.jpg'), quality=84)
        blurred = np.asarray(Image.fromarray(np.uint8(np.clip(height,0,1)*255)).filter(ImageFilter.GaussianBlur(4))) / 255
        ao = 1-np.clip((blurred-height)*.64,0,.24)
        r = np.clip(rough + (height-np.mean(height))*.6 + grit - wet*.34,.08,.98)
        packed = np.stack((ao,r,np.zeros(shape)),axis=-1)
        Image.fromarray(np.uint8(packed*255)).save(out / (name+'-orm.jpg'),quality=89,subsampling=0)


if __name__ == '__main__':
    make(Path(sys.argv[1]))
