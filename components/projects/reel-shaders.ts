/**
 * The reel panel's shaders (DESIGN.md §16). Each panel is a 1×1 PlaneGeometry
 * (32×1 segments) scaled to `uSize` px in the vertex shader.
 *
 * Vertex: the panel is laid along a cylinder whose axis is on the viewer's
 * side (arc length → x = sin(s·k)/k, z = (1 − cos(s·k))/k), so the edges come
 * towards the camera and every panel is bent with the curve. `uFlat` pulls it
 * towards its tangent plane (hover), `uMorph` towards a flat rect (the
 * gallery transition). The maths matches reel-state.ts (arcPoint), which the
 * hit areas use.
 *
 * Fragment: object-cover sampling, an RGB split towards the panel edges that
 * grows with scroll speed, hover brightening, and rounded corners (SDF with
 * screen-space antialiasing).
 */

export const REEL_VERTEX = /* glsl */ `
uniform vec2 uSize;
uniform float uCenter;
uniform float uCurve;
uniform float uFlat;
uniform float uMorph;
uniform vec3 uRect;
varying vec2 vUv;

vec3 arc(float s, float k) {
  float t = s * k;
  float h = sin(t * 0.5);
  return vec3(sin(t) / k, 0.0, 2.0 * h * h / k);
}

void main() {
  vUv = uv;
  vec2 local = position.xy * uSize;
  float k = max(uCurve, 1e-6);

  vec3 curved = arc(uCenter + local.x, k);
  curved.y = local.y;

  float tc = uCenter * k;
  vec3 tangent = arc(uCenter, k) + vec3(cos(tc), 0.0, sin(tc)) * local.x;
  tangent.y = local.y;

  vec3 reelPose = mix(curved, tangent, uFlat);
  vec3 flatPose = uRect + vec3(local, 0.0);
  vec3 p = mix(reelPose, flatPose, uMorph);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

export const REEL_FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uImage;
uniform vec2 uSize;
uniform float uHasMap;
uniform float uAlpha;
uniform float uBright;
uniform float uSplit;
uniform float uRadius;
uniform vec3 uBase;
varying vec2 vUv;

vec2 cover(vec2 uv) {
  float pa = uSize.x / uSize.y;
  float ia = uImage.x / uImage.y;
  vec2 scale = pa > ia ? vec2(1.0, ia / pa) : vec2(pa / ia, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 uv = cover(vUv);
  float edge = abs(vUv.x - 0.5) * 2.0;
  vec2 shift = vec2(uSplit * edge * edge, 0.0);
  vec3 col = vec3(
    texture2D(uMap, uv + shift).r,
    texture2D(uMap, uv).g,
    texture2D(uMap, uv - shift).b
  );
  col = mix(uBase, col, uHasMap) * (1.0 + uBright);

  float d = roundedBox((vUv - 0.5) * uSize, uSize * 0.5, uRadius);
  float aa = fwidth(d);
  float mask = 1.0 - smoothstep(-aa, aa, d);
  if (mask * uAlpha < 0.002) discard;
  gl_FragColor = vec4(col, mask * uAlpha);
}
`;
