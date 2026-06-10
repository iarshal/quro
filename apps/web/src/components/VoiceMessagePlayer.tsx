import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessagePlayerProps {
  src: string;
  isMe: boolean;
}

export default function VoiceMessagePlayer({ src, isMe }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Fetch the audio entirely to avoid Safari HTTP streaming bugs with WebM/MP4 blobs
    const fetchAudio = async () => {
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        setBlobUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error("Failed to load audio blob, falling back to src", err);
      }
    };
    fetchAudio();
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      if (audio.duration !== Infinity && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const setAudioTime = () => {
      if (audio.duration === Infinity) return;
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audio.play().catch(e => {
        console.warn("Playback interrupted or aborted", e);
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seekTime = (Number(e.target.value) / 100) * duration;
    audio.currentTime = seekTime;
    setProgress(Number(e.target.value));
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className={`flex items-center gap-3 w-[220px] ${isMe ? 'text-black' : 'text-black'}`}>
      <audio ref={audioRef} src={blobUrl || src} preload="metadata" />
      
      <button 
        onClick={togglePlayPause}
        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${
          isMe ? 'text-black' : 'text-gray-600'
        }`}
      >
        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
      </button>

      <div className="flex flex-col flex-1">
        <input
          type="range"
          min="0"
          max="100"
          value={progress || 0}
          onChange={handleSeek}
          className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${
            isMe ? 'bg-black/20 accent-black' : 'bg-gray-300 accent-gray-500'
          }`}
          style={{
            background: `linear-gradient(to right, ${isMe ? '#000' : '#4b5563'} ${progress}%, ${isMe ? 'rgba(0,0,0,0.2)' : '#d1d5db'} ${progress}%)`
          }}
        />
        <div className="flex justify-between mt-1 items-center">
          <span className={`text-[11px] font-medium ${isMe ? 'text-black/60' : 'text-gray-400'}`}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
