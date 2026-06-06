// Synthesized sound — no audio files. A soft ambient ice pad (detuned
// oscillator chord through a slowly-sweeping lowpass + airy filtered noise)
// plus short UI ticks. Starts only on a user gesture (browser autoplay
// policy) and is off by default.

let ctx
let master
let started = false
let enabled = false
let suspendTimer

function ensure() {
  if (ctx) return true
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return false
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  return true
}

function noiseBuffer() {
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5
  return buf
}

function buildAmbient() {
  const ambient = ctx.createGain()
  ambient.gain.value = 0.06
  ambient.connect(master)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 520
  filter.Q.value = 0.8
  filter.connect(ambient)

  // soft low chord (A2 / E3 / A3 / C#4), slightly detuned for warmth
  ;[110, 164.81, 220, 277.18].forEach((f, i) => {
    const o = ctx.createOscillator()
    o.type = i % 2 ? 'sine' : 'triangle'
    o.frequency.value = f
    o.detune.value = (i - 1.5) * 7
    const g = ctx.createGain()
    g.gain.value = 0.5 / 4
    o.connect(g)
    g.connect(filter)
    o.start()
  })

  // very slow filter sweep so the pad breathes
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.05
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 150
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)
  lfo.start()

  // airy "wind" layer
  const ns = ctx.createBufferSource()
  ns.buffer = noiseBuffer()
  ns.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 900
  bp.Q.value = 0.6
  const ng = ctx.createGain()
  ng.gain.value = 0.015
  ns.connect(bp)
  bp.connect(ng)
  ng.connect(ambient)
  ns.start()
}

export const audio = {
  enable() {
    if (!ensure()) return
    if (!started) {
      buildAmbient()
      started = true
    }
    clearTimeout(suspendTimer)
    ctx.resume()
    const t = ctx.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.setValueAtTime(master.gain.value, t)
    master.gain.linearRampToValueAtTime(1, t + 1.4)
    enabled = true
  },
  disable() {
    if (!ctx) return
    const t = ctx.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.setValueAtTime(master.gain.value, t)
    master.gain.linearRampToValueAtTime(0, t + 0.5)
    enabled = false
    clearTimeout(suspendTimer)
    suspendTimer = setTimeout(() => {
      if (!enabled && ctx) ctx.suspend()
    }, 700)
  },
  // short UI blip
  tick(freq = 1600) {
    if (!ctx || !enabled) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = 0
    o.connect(g)
    g.connect(master)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.04, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11)
    o.start(t)
    o.stop(t + 0.12)
  },
  get isOn() {
    return enabled
  },
}
