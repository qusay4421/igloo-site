// Custom GLSL for the hero background.
// A domain-warped fractal-noise field — reads like slow-drifting glacial ice / aurora.
// Not a CSS gradient: every pixel is computed, mouse-reactive, and time-evolving.

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

export const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;     // -1..1
  uniform float uScroll;    // 0..1 page progress

  // --- hash / value noise (Inigo Quilez style) ---
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(
      dot(a, hash2(i + 0.0)),
      dot(b, hash2(i + o)),
      dot(c, hash2(i + 1.0))
    );
    return dot(n, vec3(70.0));
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.55;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 6; i++) {
      v += amp * noise(p);
      p = rot * p * 2.0;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5);
    p.x *= uResolution.x / uResolution.y;

    float t = uTime * 0.045;
    vec2 m = uMouse * 0.18;

    // domain warping: noise of noise — gives the organic, marbled ice flow
    vec2 q = vec2(
      fbm(p * 1.6 + vec2(0.0, t) + m),
      fbm(p * 1.6 + vec2(5.2, t * 1.3) - m)
    );
    vec2 r = vec2(
      fbm(p * 1.6 + 3.4 * q + vec2(1.7, 9.2) + t * 0.7),
      fbm(p * 1.6 + 3.4 * q + vec2(8.3, 2.8) - t * 0.6)
    );
    float f = fbm(p * 1.6 + 3.0 * r + t);

    // glacial palette: deep navy -> teal -> ice cyan -> white crest
    vec3 deep  = vec3(0.012, 0.027, 0.062);
    vec3 mid   = vec3(0.043, 0.18, 0.34);
    vec3 ice   = vec3(0.33, 0.74, 0.92);
    vec3 crest = vec3(0.88, 0.96, 1.0);

    vec3 col = mix(deep, mid, smoothstep(-0.35, 0.25, f));
    col = mix(col, ice, smoothstep(0.18, 0.6, length(r)));
    col = mix(col, crest, smoothstep(0.72, 0.98, f * 0.6 + length(q) * 0.5));

    // depth darkening toward edges + scroll cools the scene
    float vig = smoothstep(1.15, 0.25, length(uv - 0.5));
    col *= mix(0.45, 1.0, vig);
    col *= mix(1.0, 0.7, uScroll);

    // faint scanline-free dithering to avoid banding
    float dither = (hash2(uv * uResolution).x) * 0.012;
    col += dither;

    gl_FragColor = vec4(col, 1.0);
  }
`
