import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor, registerPlugin, PluginListenerHandle } from '@capacitor/core';

// Base64 encoded silent WAV (minimal 1-second silent audio for Media Session)
const SILENT_AUDIO_BASE64 = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

// Define the AudioService plugin interface
interface AudioServicePlugin {
  startService(): Promise<{ started: boolean }>;
  stopService(): Promise<{ stopped: boolean }>;
  updatePlayState(options: { isPlaying: boolean }): Promise<{ updated: boolean }>;
  addListener(
    eventName: 'mediaControl',
    listenerFunc: (data: { action: 'play' | 'pause' | 'stop' }) => void
  ): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}

// Register the native plugin (only works on Android)
const AudioService = registerPlugin<AudioServicePlugin>('AudioService');

// Check if running on Android native
const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export const useWhiteNoise = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  
  // Silent audio element ref for Media Session activation on Android
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Use a ref to track playing state inside event listeners without re-binding
  const isPlayingRef = useRef(false);

  // Initialize silent audio element for Media Session
  useEffect(() => {
    const audio = new Audio(SILENT_AUDIO_BASE64);
    audio.loop = true;
    audio.volume = 0.01; // Nearly silent
    silentAudioRef.current = audio;
    
    return () => {
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
        silentAudioRef.current = null;
      }
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
      
      // Play silent audio to activate Media Session on Android
      if (silentAudioRef.current) {
        silentAudioRef.current.play().catch(() => {});
      }
      
      // Start or update native foreground service on Android for lock screen controls
      if (isAndroidNative) {
        if (serviceStartedRef.current) {
          // Service already running, just update state
          AudioService.updatePlayState({ isPlaying: true }).catch(() => {});
        } else {
          // Start new service
          AudioService.startService().catch(() => {});
          serviceStartedRef.current = true;
        }
      }
      
      setIsPlaying(true);
      isPlayingRef.current = true;
    }
  }, [initializeAudio, createWhiteNoiseBuffer]);

  // Track if service has been started (to know if we should update vs stop)
  const serviceStartedRef = useRef(false);

  const pause = useCallback(() => {
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
    
    // Pause silent audio to update Media Session
    if (silentAudioRef.current) {
      silentAudioRef.current.pause();
    }
    
    // Update native service state to paused (keep notification visible)
    if (isAndroidNative && serviceStartedRef.current) {
      AudioService.updatePlayState({ isPlaying: false }).catch(() => {});
    }
    
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [volume]);

  // Fully stop and dismiss the notification
  const stop = useCallback(() => {
    pause();
    
    // Stop native foreground service on Android (dismisses notification)
    if (isAndroidNative && serviceStartedRef.current) {
      AudioService.stopService().catch(() => {});
      serviceStartedRef.current = false;
    }
  }, [pause]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

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
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('stop', stop);
    }
  }, [play, pause, stop]);

  // Update playback state
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Listen for native media control events (lock screen, notification buttons)
  useEffect(() => {
    if (!isAndroidNative) return;
    
    let listenerHandle: PluginListenerHandle | null = null;
    
    const setupListener = async () => {
      listenerHandle = await AudioService.addListener('mediaControl', (data) => {
        switch (data.action) {
          case 'play':
            if (!isPlayingRef.current) {
              play();
            }
            break;
          case 'pause':
            if (isPlayingRef.current) {
              pause();
            }
            break;
          case 'stop':
            if (isPlayingRef.current) {
              stop();
            }
            // Also reset service tracking when stopped from notification
            serviceStartedRef.current = false;
            break;
        }
      });
    };
    
    setupListener();
    
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [play, pause, stop]);

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
