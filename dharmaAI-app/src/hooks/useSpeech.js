// src/hooks/useSpeech.js
import { useRef, useState, useCallback, useEffect } from "react";
import api from "../api/client.js";

// Defensive requires: a missing native module must not crash the Chat screen
let Speech = null;
try { Speech = require("expo-speech"); } catch (e) { console.warn("expo-speech unavailable:", e.message); }
let Audio = null;
try { Audio = require("expo-audio"); } catch (e) { console.warn("expo-audio unavailable:", e.message); }

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function useSpeech() {
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const mutedRef = useRef(false);   // ref so async code always sees the latest mute value
  const playerRef = useRef(null);
  const jobRef = useRef(0);         // each speak() gets a number; stale jobs check it and give up

  const releasePlayer = () => {
    if (!playerRef.current) return;
    try { playerRef.current.pause(); playerRef.current.remove(); } catch {}
    playerRef.current = null;
  };

  const stop = useCallback(() => {
    jobRef.current += 1;            // cancels any request still in flight
    Speech?.stop();
    releasePlayer();
    setSpeaking(false);
  }, []);

  // Ask the backend for the MP3. 200 = ready. 202 = still being made, so ask again.
  const fetchAudioUrl = async (messageId) => {
    for (let i = 0; i < 4; i++) {
      const res = await api.post(`/chat/messages/${messageId}/audio`);
      if (res.status === 200) return res.data.audio.url;
      await wait(1000);
    }
    return null;
  };

  const playUrl = async (url) => {
    // let audio play even when the iPhone silent switch is on
    try { await Audio.setAudioModeAsync({ playsInSilentMode: true }); } catch {}
    return new Promise((resolve) => {
      const player = Audio.createAudioPlayer({ uri: url });
      playerRef.current = player;
      const sub = player.addListener("playbackStatusUpdate", (s) => {
        if (s.didJustFinish) { sub.remove(); resolve(); }
      });
      player.play();
      setTimeout(resolve, 120000);  // safety net so "speaking" can never get stuck
    });
  };

  // Accepts a message object ({ _id, content }) or a plain string
  const speak = useCallback(async (msg) => {
    const text = typeof msg === "string" ? msg : msg?.content;
    const id = typeof msg === "string" ? null : msg?._id;
    if (!text || mutedRef.current) return;

    // // Types of Voices
    // Speech?.getAvailableVoicesAsync().then((vs) =>
    //   vs.filter((v) => v.language?.toLowerCase().startsWith("en"))
    //     .forEach((v) => console.log("VOICE:", v.identifier))
    // );

    stop();
    const job = jobRef.current;
    const stale = () => jobRef.current !== job || mutedRef.current;

    // 1) ElevenLabs voice via your backend
    if (id && Audio) {
      try {
        const url = await fetchAudioUrl(id);
        if (stale()) return;
        if (url) {
          setSpeaking(true);
          await playUrl(url);
          if (jobRef.current === job) { releasePlayer(); setSpeaking(false); }
          return;
        }
      } catch (e) {
        console.log("Cloud voice failed, using device voice:", e?.response?.status || e.message);
        releasePlayer();
        if (stale()) return;
      }
    }

    // 2) Fallback: the phone's own voice
    if (!Speech) return;
    Speech.speak(text, {
      voice: "en-us-x-iol-local",
      language: "en-IN",
      pitch: 0.85,
      rate: 0.9,
      onStart: () => setSpeaking(true),
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [stop]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) stop();               // muting cuts off anything currently playing
  }, [stop]);

  useEffect(() => stop, [stop]);    // stop speaking when leaving the screen

  return { speak, stop, toggleMute, muted, speaking };
}