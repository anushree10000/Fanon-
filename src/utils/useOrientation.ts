import { useEffect, useState } from 'react';
import { Dimensions, type ScaledSize } from 'react-native';

export type Orientation = 'portrait' | 'landscape';

function orientationOf(dims: ScaledSize): Orientation {
  return dims.width > dims.height ? 'landscape' : 'portrait';
}

/**
 * Deliberately not react-native-orientation-locker: that library locks/reads
 * *device* orientation (fights the OS rotation lock, needs native
 * permissions setup on both platforms). All the spec asks for is "this
 * screen's layout should follow the current rotation", which `Dimensions`
 * already reports without touching platform rotation state -- one less
 * native module to link for a bare RN project a reviewer has to build.
 */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState(() => orientationOf(Dimensions.get('window')));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setOrientation(orientationOf(window));
    });
    return () => sub.remove();
  }, []);

  return orientation;
}
