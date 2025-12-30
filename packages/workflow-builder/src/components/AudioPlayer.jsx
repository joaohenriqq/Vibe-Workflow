import React, { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";

const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    setProgress(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const setMeta = () => setDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", setMeta);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", setMeta);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const value = Number(e.target.value);
    audio.currentTime = (value / 100) * audio.duration;
    setProgress(value);
  };

  const formatTime = (seconds = 0) => {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 w-full h-full">
      <audio ref={audioRef} src={src} />
      <button
        type="button"
        onClick={toggleAudio}
        className="absolute w-9 h-9 z-10 object-cover cursor-pointer bg-transparent text-white rounded flex items-center justify-center"
      >
        {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
      </button>
      <span className="absolute z-10 bottom-1 left-2 text-[10px] text-white">{formatTime(currentTime)}/{formatTime(duration)}</span>
      <div className="relative z-0 flex-1 h-full bg-[#151618]">
        <div
          className="absolute left-0 top-0 h-full bg-[#2c3037] pointer-events-none"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
