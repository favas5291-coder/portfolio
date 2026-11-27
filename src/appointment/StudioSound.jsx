import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

// Two quiet frequency bands distinguish air under the canopy from the
// closed office. No recording, network request or AudioContext on arrival.
const roomTone = {
  arrival: [650, 0.037, 0.018],
  pavement: [1800, 0.075, 0.025],
  reception: [550, 0.036, 0.009],
  studio: [490, 0.031, 0.006],
  landing: [900, 0.046, 0.011],
  office: [395, 0.027, 0.004],
}

function setRoom(graph, id) {
  const [frequency, air, street] = roomTone[id] || roomTone.office
  const now = graph.context.currentTime
  graph.airFilter.frequency.setTargetAtTime(frequency, now, 0.3)
  graph.airLevel.gain.setTargetAtTime(air, now, 0.3)
  graph.streetLevel.gain.setTargetAtTime(street, now, 0.4)
}

function makeRoomTone(context) {
  const buffer = context.createBuffer(2, Math.ceil(context.sampleRate * 3), context.sampleRate)
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel)
    let soft = 0
    for (let i = 0; i < samples.length; i++) {
      const noise = Math.random() * 2 - 1
      soft = soft * 0.93 + noise * 0.07
      samples[i] = soft * 2 + noise * 0.45
    }
  }
  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const airFilter = context.createBiquadFilter()
  airFilter.type = 'lowpass'
  airFilter.Q.value = 0.47
  const airLevel = context.createGain()
  airLevel.gain.value = 0
  source.connect(airFilter).connect(airLevel).connect(context.destination)

  const streetFilter = context.createBiquadFilter()
  streetFilter.type = 'bandpass'
  streetFilter.frequency.value = 125
  streetFilter.Q.value = 0.57
  const streetLevel = context.createGain()
  streetLevel.gain.value = 0
  source.connect(streetFilter).connect(streetLevel).connect(context.destination)
  source.start()
  return { context, airFilter, airLevel, streetLevel }
}

export function StudioSound({ chapter, inspecting }) {
  const audio = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [available, setAvailable] = useState(false)
  const room = useRef(chapter.id)
  const stop = useCallback(() => {
    const context = audio.current?.context
    audio.current = null
    if (context && context.state !== 'closed') context.close().catch(() => {})
    setPlaying(false)
  }, [])

  useEffect(() => {
    setAvailable(Boolean(window.AudioContext || window.webkitAudioContext))
    const hidden = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('pagehide', stop)
    return () => {
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('pagehide', stop)
      stop()
    }
  }, [stop])

  useEffect(() => {
    room.current = chapter.id
    if (inspecting) stop()
    else if (audio.current?.airLevel) setRoom(audio.current, chapter.id)
  }, [chapter.id, inspecting, stop])

  async function toggle() {
    if (audio.current) return stop()
    if (inspecting || document.hidden) return
    const Context = window.AudioContext || window.webkitAudioContext
    if (!Context) return
    let context
    try {
      context = new Context()
      audio.current = { context }
      await context.resume()
      if (audio.current?.context !== context || document.hidden) return
      const graph = makeRoomTone(context)
      audio.current = graph
      setRoom(graph, room.current)
      setPlaying(true)
    } catch {
      if (audio.current?.context === context) stop()
    }
  }

  return available ? (
    <button type="button" aria-label="Ambient sound" aria-pressed={playing}
      title={playing ? 'Mute ambient sound' : 'Enable ambient sound'} onClick={toggle} disabled={inspecting}>
      {playing ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
    </button>
  ) : null
}
