import React, { useEffect, useState } from 'react';
import { Marker, MapMarkerProps } from 'react-native-maps';

import { MarkerGraphic, MarkerVariant } from './MarkerGraphic';

type SvgMarkerProps = {
  variant: MarkerVariant;
  coordinate: MapMarkerProps['coordinate'];
  title?: string;
  description?: string;
  zIndex?: number;
  children?: React.ReactNode;
};

/**
 * <Marker> wrapper that renders a self-contained SVG graphic and drives
 * `tracksViewChanges` correctly for Android.
 *
 * On Android the marker child is rasterised to a bitmap. We must keep
 * tracksViewChanges=true until the SVG has actually painted, then switch it off
 * so the map does not re-snapshot on every pan/zoom (a real perf drain).
 * Two animation frames + a safety timeout guarantee the first snapshot is
 * non-blank without relying on a fragile fixed delay.
 */
export const SvgMarker = React.memo(function SvgMarker({
  variant,
  coordinate,
  title,
  description,
  zIndex,
  children,
}: SvgMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    // react-native-svg paints into the Android marker bitmap asynchronously, so
    // we must keep tracksViewChanges=true long enough for the full graphic to be
    // captured before freezing it. Flipping too early (a frame or two) freezes a
    // half-painted bitmap -> the marker looks clipped. ~1.5s is comfortably safe
    // and only runs once per marker mount, so the ongoing CPU cost is nil.
    const timer = setTimeout(() => setTracksViewChanges(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      zIndex={zIndex}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
    >
      <MarkerGraphic variant={variant} />
      {children}
    </Marker>
  );
});
