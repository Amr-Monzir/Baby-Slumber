import { useState, useEffect, useRef, useCallback } from 'react';

export const useWhiteNoise = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  // Use a ref to track playing state inside event listeners without re-binding
  const isPlayingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initializeAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      
      // Create Gain Node for volume
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = volume;
      
      // Create Filter Node for Brown/Pink noise effect (Lowpass)
      filterNodeRef.current = audioContextRef.current.createBiquadFilter();
      filterNodeRef.current.type = 'lowpass';
      filterNodeRef.current.frequency.value = 400; 
      
      filterNodeRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  }, [volume]);

  const createWhiteNoiseBuffer = useCallback(() => {
    if (!audioContextRef.current) return null;
    
    const bufferSize = audioContextRef.current.sampleRate * 5; 
    const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }, []);

  const play = useCallback(async () => {
    initializeAudio();
    
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // Prevent multiple sources
    if (sourceNodeRef.current) return;

    const buffer = createWhiteNoiseBuffer();
    if (audioContextRef.current && filterNodeRef.current && buffer) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(filterNodeRef.current);
      source.start();
      sourceNodeRef.current = source;
      
      setIsPlaying(true);
      isPlayingRef.current = true;
    }
  }, [initializeAudio, createWhiteNoiseBuffer]);

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        if (gainNodeRef.current && audioContextRef.current) {
           // Quick fade out
           gainNodeRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.1);
           setTimeout(() => {
             sourceNodeRef.current?.stop();
             sourceNodeRef.current = null;
             // Reset volume
             if (gainNodeRef.current) gainNodeRef.current.gain.value = volume;
           }, 150);
        } else {
           sourceNodeRef.current.stop();
           sourceNodeRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [volume]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      stop();
    } else {
      play();
    }
  }, [play, stop]);

  // Media Session API Integration
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Brown Noise',
        artist: 'BabySleep',
        album: 'Soothing Sounds',
        artwork: [
          { src: '/favicon.png', sizes: '96x96', type: 'image/png' },
          { src: '/favicon.png', sizes: '128x128', type: 'image/png' },
          { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
          { src: '/favicon.png', sizes: '512x512', type: 'image/png' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', play);
      navigator.mediaSession.setActionHandler('pause', stop);
      navigator.mediaSession.setActionHandler('stop', stop);
    }
  }, [play, stop]);

  // Update playback state
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const updateVolume = (val: number) => {
    setVolume(val);
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(val, audioContextRef.current.currentTime, 0.1);
    }
  };

  return {
    isPlaying,
    volume,
    setVolume: updateVolume,
    togglePlay
  };
};
