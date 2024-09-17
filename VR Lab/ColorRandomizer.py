# Copyright 2020, Karljohan Lundin Palmerius
#

"""Simple example of how to change color upon boolen input, for
example from haptic touch.

At the end of the file you find the instantiation, that creates the
actual field that can be routed to and from.
"""


from H3D import *
from H3DInterface import *

import colorsys, random

class ColorRandomizer(TypedField(SFColor, SFBool)):

  """This ColorRandomizer can be instantiated into a field that is-a
  SFColor and takes SFBool as input."""

  def __init__(self):
    TypedField(SFColor, SFBool).__init__(self)
    self.is_in_touch = False
    self.current_color = RGB(1, 1, 1)

  def update(self, event):

    routes_in = self.getRoutesIn()
    if len(routes_in) < 1:
      return RGB(.5,.5,.5)
    value = routes_in[0].getValue()
    
    if not value or self.is_in_touch:
      self.is_in_touch = value
      return self.current_color

    rgb = colorsys.hsv_to_rgb(random.random(),
                              0.3 + 0.3 * random.random(),
                              0.3 + 0.3 * random.random())
    self.current_color = RGB(rgb[0], rgb[1], rgb[2] )
    return self.current_color

color = ColorRandomizer()
