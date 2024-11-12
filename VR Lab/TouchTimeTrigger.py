# Copyright 2024, Karljohan Lundin Palmerius
#

"""This script version of the TimeTrigger provides a simple
encapsulation of a more complex routing necessary to connect the
isTouched field in an X3DGeometryNode to a X3DTimeDependentNode.

Use set_boolean and triggerTime as input and output fields,
respectively.
"""


from H3D import *
from H3DInterface import *

class MFBoolToSFBool(TypedField(SFBool, MFBool)):
  """Script for converting an MFBool to an SFBool by "or" operation,
  i.e. the output will be true iff any of values in the input is
  true."""

  def update(self, event):
    for value in event.getValue():
      if value:
        return True
    return False


# Input from a geometry's isTouched field
set_boolean = MFBool()

# Output for a X3DTimeDependentNode such as AudioClip
triggerTime = SFTime()

# Field for making SFBool out of MFBool by "or" operator
mfboolToSfbool = MFBoolToSFBool()

# Two nodes to filter and convert the events
booleanFilter,defs = createX3DNodeFromString("<BooleanFilter/>")
timeTrigger,defs = createX3DNodeFromString("<TimeTrigger/>")

set_boolean.routeNoEvent(mfboolToSfbool)
mfboolToSfbool.routeNoEvent(booleanFilter.set_boolean)
booleanFilter.inputTrue.routeNoEvent(timeTrigger.set_boolean)
timeTrigger.triggerTime.routeNoEvent(triggerTime)
