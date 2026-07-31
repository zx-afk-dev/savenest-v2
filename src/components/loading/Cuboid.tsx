import type { CSSProperties, ReactNode } from 'react';

interface CuboidProps {
  /** Size along the X axis (screen-horizontal), in px */
  width: number;
  /** Size along the Y axis (screen-vertical), in px */
  height: number;
  /** Size along the Z axis (depth, toward/away from viewer), in px */
  depth: number;
  color: string;
  className?: string;
  style?: CSSProperties;
  /** Optional content stamped onto the front face (e.g. a platform letter). */
  frontContent?: ReactNode;
}

/**
 * A solid 3D box made of six absolutely-positioned, CSS-transformed faces,
 * all sharing one coordinate origin at the box's own center. Each face is a
 * flat div rotated/translated into place with real `rotateX/rotateY` +
 * `translateZ` (not an illustration) and shaded via `filter: brightness()` —
 * top brightest (as if lit from above), front/back mid-tone, sides darker.
 *
 * This is the primitive every part of the 3D voxel courier in
 * DownloadLoadingOverlay is built from. Pure CSS 3D transforms stay on the
 * compositor thread, so many of these on screen at once still runs smoothly
 * — no WebGL/canvas needed for a chibi-sized scene like this.
 */
export function Cuboid({ width: w, height: h, depth: d, color, className, style, frontContent }: CuboidProps) {
  const faceBase: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: color,
    backfaceVisibility: 'hidden',
  };

  return (
    <div
      className={className}
      style={{ position: 'absolute', width: w, height: h, transformStyle: 'preserve-3d', ...style }}
    >
      {/* front */}
      <div
        style={{
          ...faceBase,
          width: w,
          height: h,
          marginLeft: -w / 2,
          marginTop: -h / 2,
          transform: `translateZ(${d / 2}px)`,
          filter: 'brightness(1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {frontContent}
      </div>
      {/* back */}
      <div
        style={{
          ...faceBase,
          width: w,
          height: h,
          marginLeft: -w / 2,
          marginTop: -h / 2,
          transform: `rotateY(180deg) translateZ(${d / 2}px)`,
          filter: 'brightness(0.8)',
        }}
      />
      {/* right */}
      <div
        style={{
          ...faceBase,
          width: d,
          height: h,
          marginLeft: -d / 2,
          marginTop: -h / 2,
          transform: `rotateY(90deg) translateZ(${w / 2}px)`,
          filter: 'brightness(0.68)',
        }}
      />
      {/* left */}
      <div
        style={{
          ...faceBase,
          width: d,
          height: h,
          marginLeft: -d / 2,
          marginTop: -h / 2,
          transform: `rotateY(-90deg) translateZ(${w / 2}px)`,
          filter: 'brightness(0.58)',
        }}
      />
      {/* top */}
      <div
        style={{
          ...faceBase,
          width: w,
          height: d,
          marginLeft: -w / 2,
          marginTop: -d / 2,
          transform: `rotateX(90deg) translateZ(${h / 2}px)`,
          filter: 'brightness(1.3)',
        }}
      />
      {/* bottom */}
      <div
        style={{
          ...faceBase,
          width: w,
          height: d,
          marginLeft: -w / 2,
          marginTop: -d / 2,
          transform: `rotateX(-90deg) translateZ(${h / 2}px)`,
          filter: 'brightness(0.4)',
        }}
      />
    </div>
  );
}
