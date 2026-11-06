"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { blobToWav16k } from "./audio";

export const MAX_SECONDS = 60; // spec C-04: default maximum per answer
export const MIN_SECONDS = 2; // spec C-04: minimum
const QUIET_RMS = 0.004; // below this the microphone captured (almost) nothing
const BARS = 24;

export type Recording = { wav: Blob; url: string; seconds: number; quiet: boolean };
export type RecorderPhase = "idle" | "recording" | "converting" | "ready";
export type RecorderError = "too_short" | "convert_failed" | null;

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
export const recordingSupported = () => typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

export function useRecorder() {
  const [phase, setPhase] = useState<RecorderPhase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0));
  const [recording, setRecording] = useState<Recording | null>(null);
  const [error, setError] = useState<RecorderError>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const audioContext = useRef<AudioContext | null>(null);
  const url = useRef<string | null>(null);

  const stopMeter = useCallback(() => {
    window.clearInterval(timer.current);
    void audioContext.current?.close().catch(() => undefined);
    audioContext.current = null;
  }, []);

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const start = useCallback(
    (stream: MediaStream) => {
      setError(null);
      setRecording(null);
      setSeconds(0);
      const mimeType = MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
      const media = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      const startedAt = Date.now();
      recorder.current = media;
      media.ondataavailable = (event) => event.data.size && chunks.push(event.data);
      media.onstop = async () => {
        stopMeter();
        const elapsed = (Date.now() - startedAt) / 1000;
        if (elapsed < MIN_SECONDS) {
          setError("too_short");
          setPhase("idle");
          return;
        }
        setPhase("converting");
        try {
          const { wav, rms } = await blobToWav16k(new Blob(chunks, { type: media.mimeType }));
          url.current = URL.createObjectURL(wav);
          setRecording({ wav, url: url.current, seconds: elapsed, quiet: rms < QUIET_RMS });
          setPhase("ready");
        } catch {
          setError("convert_failed");
          setPhase("idle");
        }
      };

      // A live level meter: the candidate sees the microphone is hearing them (and we notice a dead one).
      const context = new AudioContext();
      audioContext.current = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      timer.current = window.setInterval(() => {
        const elapsed = (Date.now() - startedAt) / 1000;
        setSeconds(elapsed);
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const s of samples) sum += ((s - 128) / 128) ** 2;
        const level = Math.min(1, Math.sqrt(sum / samples.length) * 6);
        setLevels((previous) => [...previous.slice(1), level]);
        if (elapsed >= MAX_SECONDS) stop(); // spec: recording stops by itself at the limit
      }, 80);

      media.start();
      setPhase("recording");
    },
    [stop, stopMeter],
  );

  const reset = useCallback(() => {
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = null;
    setRecording(null);
    setError(null);
    setSeconds(0);
    setLevels(Array(BARS).fill(0));
    setPhase("idle");
  }, []);

  // Spec: if the browser goes to the background or a call comes in, recording stops and what was said is kept.
  useEffect(() => {
    const onHide = () => document.hidden && stop();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [stop]);

  // Leaving the screen must never leave the microphone running.
  useEffect(
    () => () => {
      if (recorder.current?.state === "recording") {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      stopMeter();
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [stopMeter],
  );

  return { phase, seconds, levels, recording, error, start, stop, reset };
}
