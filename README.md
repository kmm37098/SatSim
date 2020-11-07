# SatSim

### Simulate SPOC and MOCI satellite pointing accuracies

## Key data points-
- 400 km altitude
- 50 x 50km target area
- 98 km x 130m swath
- .5 degree pointing accuracy
- .055 degree pointing knowledge

The swath is the area on the ground that the satellite can “see” at a certain point in time. It is susceptible to .5 degrees of inaccuracy in yaw, pitch, and roll. The satellite also experiences a 3 sigma instability of .1 degrees/sec.This means that the pointing is wiggling at a rate of .1 degrees/sec or less 99.7% of the time, and it will detect any time that the pointing is off by more than .5 degrees and fix it. 

When looking down on the target area from the satellite, it is a square. The swath is a very thin rectangle that is almost twice as wide. The swath should move from one end of the square to the other, and capture the entire square. In perfect conditions, the midpoint of the rectangle should draw a line cutting the square in half. When the yaw is off, the rectangle is either to the left or to the right (max of 3.4908 km). When the pitch is off, the rectangle is shifted up or down (max of 3.4908 km). When the roll is off, the rectangle is at an angle (max of .5 degrees). The instability is changing the point of the satellite by less than 0.698 km/sec in yaw and pitch and .1 deg/sec in roll 99.7% of the time.
