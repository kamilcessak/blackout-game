import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

/**
 * Self-contained vector marker drawn entirely in SVG.
 *
 * Why SVG instead of <View> + a vector-icon font:
 * on Android react-native-maps rasterises a custom <Marker> child into a single
 * bitmap. If the icon font glyph is not yet measured at snapshot time the bitmap
 * comes out blank (the classic "invisible Android marker" bug). SVG paths are
 * self-contained and render synchronously, so the snapshot is always correct.
 */

export type MarkerVariant =
  | 'player'
  | 'airdrop'
  | 'water'
  | 'medical'
  | 'food'
  | 'package'
  | 'cooldown';

// MDI 24x24 path data (no font dependency).
const ICON_PATHS: Record<MarkerVariant, string> = {
  player:
    'M16.5,5.5A2,2 0 0,0 18.5,3.5A2,2 0 0,0 16.5,1.5A2,2 0 0,0 14.5,3.5A2,2 0 0,0 16.5,5.5M12.9,19.4L13.9,15L16,17V23H18V15.5L15.9,13.5L16.5,10.5C17.89,12.09 19.89,13 22,13V11C20.24,11.03 18.6,10.11 17.7,8.6L16.7,7C16.34,6.4 15.7,6 15,6C14.7,6 14.5,6.1 14.2,6.1L9,8.3V13H11V9.6L12.8,8.9L11.2,17L6.3,16L5.9,18L12.9,19.4M4,9A1,1 0 0,1 3,8A1,1 0 0,1 4,7H7V9H4M5,5A1,1 0 0,1 4,4A1,1 0 0,1 5,3H10V5H5M3,13A1,1 0 0,1 2,12A1,1 0 0,1 3,11H7V13H3Z',
  airdrop:
    'M21.2,10.95L12,23L2.78,10.96L2.87,10.88C3.08,10.67 3.33,10.5 3.58,10.36L10.73,19.69L8.58,13L9.24,11.81L12,20.38L14.73,11.8L15.4,13L13.27,19.69L20.41,10.35C20.66,10.5 20.9,10.64 21.1,10.85L21.2,10.95M5,9C6.5,9 7.81,9.86 8.5,11.1C9.17,9.86 10.47,9 12,9C13.5,9 14.8,9.85 15.5,11.09C16.16,9.84 17.47,9 19,9C20.09,9 21.09,9.42 21.81,10.14C20.94,5.5 16.88,2 12,2C7.09,2 3.03,5.5 2.16,10.17C2.89,9.45 3.89,9 5,9Z',
  water: 'M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14A6,6 0 0,1 12,20Z',
  medical:
    'M10,3L8,5V7H5C3.85,7 3.12,8 3,9L2,19C1.88,20 2.54,21 4,21H20C21.46,21 22.12,20 22,19L21,9C20.88,8 20.06,7 19,7H16V5L14,3H10M10,5H14V7H10V5M11,10H13V13H16V15H13V18H11V15H8V13H11V10Z',
  food: 'M5.26 11H18.74L18.07 20H5.93L5.26 11M9 4H14.97L19 7.38L20.59 5.79L22 7.21L19.21 10H4.79L2 7.21L3.41 5.8L5 7.38L9 4Z',
  package:
    'M2,10.96C1.5,10.68 1.35,10.07 1.63,9.59L3.13,7C3.24,6.8 3.41,6.66 3.6,6.58L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.66,6.72 20.82,6.88 20.91,7.08L22.36,9.6C22.64,10.08 22.47,10.69 22,10.96L21,11.54V16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V10.96C2.7,11.13 2.32,11.14 2,10.96M12,4.15V4.15L12,10.85V10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V12.69L14,15.59C13.67,15.77 13.3,15.76 13,15.6V19.29L19,15.91M13.85,13.36L20.13,9.73L19.55,8.72L13.27,12.35L13.85,13.36Z',
  cooldown:
    'M10,2H14C17.31,2 19,4.69 19,8V18.66C16.88,17.63 15.07,17 12,17C8.93,17 7.12,17.63 5,18.66V8C5,4.69 6.69,2 10,2M8,8V9.5H16V8H8M9,12V13.5H15V12H9M3,22V21.31C5.66,19.62 13.23,15.84 21,21.25V22H3Z',
};

type Style = {
  circleSize: number;
  iconSize: number;
  fill: string;
  border: string;
  icon: string;
};

const VARIANT_STYLE: Record<MarkerVariant, Style> = {
  player: {
    circleSize: 54,
    iconSize: 28,
    fill: 'rgba(0,0,0,0.78)',
    border: '#00ff00',
    icon: '#4ade80',
  },
  airdrop: {
    circleSize: 56,
    iconSize: 30,
    fill: 'rgba(60,40,5,0.85)',
    border: '#f59e0b',
    icon: '#fbbf24',
  },
  water: {
    circleSize: 46,
    iconSize: 24,
    fill: 'rgba(10,10,10,0.9)',
    border: '#cc3300',
    icon: '#ffffff',
  },
  medical: {
    circleSize: 46,
    iconSize: 24,
    fill: 'rgba(10,10,10,0.9)',
    border: '#cc3300',
    icon: '#ffffff',
  },
  food: {
    circleSize: 46,
    iconSize: 24,
    fill: 'rgba(10,10,10,0.9)',
    border: '#cc3300',
    icon: '#ffffff',
  },
  package: {
    circleSize: 46,
    iconSize: 24,
    fill: 'rgba(10,10,10,0.9)',
    border: '#cc3300',
    icon: '#ffffff',
  },
  cooldown: {
    circleSize: 46,
    iconSize: 24,
    fill: 'rgba(10,10,10,0.9)',
    border: '#555555',
    icon: '#888888',
  },
};

// Outer halo padding so the glow ring has room to draw beyond the circle.
const GLOW_PAD = 6;

type Props = { variant: MarkerVariant };

export const MarkerGraphic = React.memo(function MarkerGraphic({ variant }: Props) {
  const { circleSize, iconSize, fill, border, icon } = VARIANT_STYLE[variant];
  const canvas = circleSize + GLOW_PAD * 2;
  const center = canvas / 2;
  const radius = circleSize / 2 - 1;

  // Icon paths use a 24x24 viewBox; scale + centre into the circle.
  const scale = iconSize / 24;
  const offset = center - iconSize / 2;

  // The fixed-size wrapper + collapsable={false} is required on Android: it gives
  // react-native-maps a deterministic view size to snapshot. Without it Android
  // flattens the hierarchy and rasterises only part of the marker (clipped halo).
  return (
    <View
      collapsable={false}
      style={{
        width: canvas,
        height: canvas,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={canvas} height={canvas} viewBox={`0 0 ${canvas} ${canvas}`}>
        {/* faux glow (Android ignores shadow* props, so draw a translucent halo) */}
        <Circle
          cx={center}
          cy={center}
          r={circleSize / 2}
          stroke={border}
          strokeWidth={4}
          strokeOpacity={0.3}
          fill="none"
        />
        <Circle cx={center} cy={center} r={radius} fill={fill} stroke={border} strokeWidth={2} />
        <G transform={`translate(${offset}, ${offset}) scale(${scale})`}>
          <Path d={ICON_PATHS[variant]} fill={icon} />
        </G>
      </Svg>
    </View>
  );
});
