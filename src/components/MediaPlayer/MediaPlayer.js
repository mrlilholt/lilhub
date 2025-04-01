import React, { useState, useRef, useEffect } from 'react';
import { 
    FaPlay, 
    FaPause, 
    FaStepBackward, 
    FaStepForward, 
    FaBackward, 
    FaForward 
} from 'react-icons/fa';

const tracks = [
  {
    title: 'Chill 1',
    url: 'https://res.cloudinary.com/dtvecsd0q/video/upload/v1740790841/1_hour_of_aesthetic_calm_lofi_music_chill_4_p5mjqn.mp3'
  },
  {
    title: 'Chill 2',
    url: 'https://res.cloudinary.com/dtvecsd0q/video/upload/v1740790674/1_Hour_Lofi_Cat_Relax_with_my_cat_-_Sleep_Relax_Study_Chill_4_qqgaut.mp3'
  },
  {
    title: 'Chill 3',
    url: 'https://res.cloudinary.com/dtvecsd0q/video/upload/v1739498833/Just_wanna_stay_here_forever_lofi_hip_hop_mix_4_waxyif.mp3'
  },
  {
    title: 'Chill 4',
    url: 'https://res.cloudinary.com/dtvecsd0q/video/upload/v1739497734/Seoul_City_View_-_chill___lofi_hiphop_beats_to_sleep_relax_study_to___%E1%84%85%E1%85%A9%E1%84%91%E1%85%A1%E1%84%8B%E1%85%B5_%E1%84%89%E1%85%A5%E1%84%8B%E1%85%AE%E1%86%AF_%E1%84%89%E1%85%B5%E1%84%90%E1%85%B5_%E1%84%8B%E1%85%A3%E1%84%80%E1%85%A7%E1%86%BC_%E1%84%80%E1%85%A1%E1%86%B7%E1%84%89%E1%85%A1%E1%86%BC_%E1%84%82%E1%85%A6%E1%84%8B%E1%85%A9%E1%86%AB%E1%84%89%E1%85%B5%E1%84%90%E1%85%B5_4_eizdpn.mp3'
  },
  {
    title: 'Chill 6',
    url: 'https://res.cloudinary.com/dtvecsd0q/video/upload/v1739497428/comfort_zone._4_mvgogu.mp3'
  },
  {
    title: 'Chill 7',
    url: 'https://res.cloudinary.com/dtvecsd0q/video/upload/v1739496827/SNOWING_IN_%EF%BC%AF%EF%BC%B3%EF%BC%A1%EF%BC%AB%EF%BC%A1_Lofi_Hip_Hop_4_dwjuaw.mp3'
  },
  {
    title: 'Chill 8',
    url: 'https://res.cloudinary.com/dtvecsd0q/video/upload/v1739496795/Chill_Work_Music_chill_lo-fi_hip_hop_beats_4_soqp92.mp3'
  },
  {
    title: 'Chill 9',
    url: 'https://res.cloudinary.com/dtvecsd0q/video/upload/v1739496721/Lofi_Beats_Mix_chill_lo-fi_hip_hop_beats_4_jvhske.mp3'
  },
];

const MediaPlayer = () => {
  const audioRef = useRef(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // When a track ends, go to the next track (in order)
  const handleTrackEnd = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrackIndex, isPlaying]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.currentTime === 0) {
        // Choose a random track when starting fresh
        const randomIndex = Math.floor(Math.random() * tracks.length);
        setCurrentTrackIndex(randomIndex);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const handleFastForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
    }
  };

  const handlePreviousTrack = () => {
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(prevIndex);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const handleNextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  // Style for control buttons
  const buttonStyle = {
    background: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer'
  };

  return (
    <div
      className="media-player-card"
      style={{
        background: '#f0f0f0',
        padding: '10px',
        borderRadius: '4px',
        marginTop: '20px',
        textAlign: 'center',
        maxWidth: '300px',
        margin: '20px auto'
      }}
    >
      <h3 style={{ fontSize: '18px' }}>Listen to the Lilholt Cafe</h3>
      <p style={{ fontSize: '14px' }}>{tracks[currentTrackIndex].title}</p>
      <audio ref={audioRef} onEnded={handleTrackEnd} style={{ display: 'none' }}>
        <source src={tracks[currentTrackIndex].url} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={handlePreviousTrack} style={buttonStyle}>
          <FaStepBackward />
        </button>
        <button onClick={handleRewind} style={buttonStyle}>
          <FaBackward />
        </button>
        <button onClick={togglePlayPause} style={buttonStyle}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button onClick={handleFastForward} style={buttonStyle}>
          <FaForward />
        </button>
        <button onClick={handleNextTrack} style={buttonStyle}>
          <FaStepForward />
        </button>
      </div>
    </div>
  );
};

export default MediaPlayer;