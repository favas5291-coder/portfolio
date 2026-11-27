"""The screened side garden at the eastern end of the street elevation."""
from math import sin, cos, pi
from random import Random
from mathutils import Vector

def build_garden(s):
    # A low boundary wall turns away from the entry. A second, more distant
    # eave closes the gap at street level while preserving sky above the office.
    s.block((10.23,.8,.12),(18.4,1.05,1.34),'Lime',.016,'Garden enclosure')
    s.block((10.20,.77,1.31),(18.45,1.09,1.39),'DryStone',.015,'Garden coping')
    s.block((10.26,.72,.14),(18.43,.79,.35),'Laterite',.012,'Garden plinth')
    s.block((11,5.6,.14),(20.7,6,2.58),'Lime',.015,'Neighbour wall')
    s.block((10.72,5.14,2.57),(21.05,8,2.72),'Iron',.013,'Garden roof')
    for i in range(24):
        x=10.34+i*.115
        s.block((x,.845,1.38),(x+.044,.913,1.96),'Teak',.003,'Garden screen')

    rng = Random(2759)
    mats = ['Forest leaf','Young leaf','Underside leaf']
    for mat,col in zip(mats,[(.045,.095,.045),(.098,.181,.074),(.068,.135,.082)]):
        s.finish(mat,col,.55)
        s.materials[mat].use_backface_culling=False
    def leaf(start,azimuth,length,width,rise,mat):
        forward=Vector((cos(azimuth),sin(azimuth),0))
        side=Vector((-sin(azimuth),cos(azimuth),0))
        vertices=[]
        steps=15
        for j in range(steps+1):
            u=j/steps
            centre=start+forward*(length*u)
            centre.z += length*(rise*u+.28*sin(pi*u)-.28*u*u)
            spread=width*max(.007,sin(pi*u)**.7)*(1+.03*sin(12*pi*u))
            for k in (-2,-1,0,1,2):
                w=k/2
                v=centre+side*(spread*w)
                v.z+=spread*(.17*abs(w)-.24*w*w+.035*sin(u*26+k)*abs(w))
                vertices.append(v)
        faces=[(5*j+k,5*(j+1)+k,5*(j+1)+k+1,5*j+k+1) for j in range(steps) for k in range(4)]
        s.geometry(('Garden planting',mat,0),vertices,faces)
        s.tube(start,vertices[5*8+2],width*.021,'Young leaf','Leaf midribs',5,end_r=width*.008)
    # Dense heliconia leaves and shorter, broader elephant ears at the joints.
    for i in range(28):
        x=rng.uniform(10.43,19.8); y=rng.uniform(1.22,4.8); h=rng.uniform(1.25,3.47)
        base=Vector((x,y,.14)); tip=base+Vector((rng.uniform(-.21,.21),rng.uniform(-.17,.17),h))
        s.tube(base,tip,.029,'Underside leaf','Leaf stems',8,end_r=.014)
        for j in range(rng.randrange(5,9)):
            u=.55+.05*j
            leaf(base.lerp(tip,u),i+j*2.42,rng.uniform(.62,1.20),rng.uniform(.13,.26),rng.uniform(.20,.84),rng.choice(mats))
    for i in range(15):
        base=Vector((rng.uniform(10.23,14.8),rng.uniform(.14,.58),.14))
        for j in range(5):
            a=j*1.25+i
            top=base+Vector((.14*cos(a),.14*sin(a),rng.uniform(.23,.58)))
            s.tube(base,top,.012,'Young leaf','Leaf stems',7,end_r=.007)
            leaf(top,a,rng.uniform(.24,.52),rng.uniform(.07,.14),rng.uniform(.02,.45),rng.choice(mats))
