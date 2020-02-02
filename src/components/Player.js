import React, { useEffect, useRef } from "react";
import { connect } from "react-redux";
import { setTrackIndex, togglePlay } from "../redux/actions/playerActions";
import styled from "styled-components";

const PlayerWrapper = styled.div`
  width: 100%;
  height: 20vh;
  background: #0569ac;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  position: fixed;
  bottom: 0;
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
`;

const ProgressBar = styled.div`
  height: 10%;
  min-height: 10px;
  border-radius: 50px;
  background: hsla(244, 0%, 100%, 0.5);
  width: 80%;
  display: flex;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.14, 1.35, 0.54, 1.95);

  &:hover {
    transform: scale(1.05);
  }
`;
const Progress = styled.div`
  border-radius: 50px;
  background: #044b7a;
  flex-basis: 0%;
`;

const Buttons = styled.div`
  display: flex;
  margin: 1% 0;
`;

const Button = styled.button`
  cursor: pointer;
  background: none;
  border: none;
  font-size: 1em;
  outline: none;
  transition: transform 0.2s cubic-bezier(0.14, 1.35, 0.54, 1.95);

  &:hover {
    transform: scale(1.1);
  }
  &:focus {
    transform: scale(1.1);
  }

  &:nth-of-type(2) {
    margin: 0 10%;

    @media (min-width: 768px) {
      margin: 0 5%;
    }
  }
`;

const CurrentTrack = styled.p`
  color: white;
  font-size: 1em;
`;

const Volume = styled.input`
  /* flex: 1; */
`;

const Player = props => {
  const { songs: playlist } = props.state.songs;
  const { isPlaying, trackIndex } = props.state.player;

  const audio = useRef(null);
  const canvas = useRef(null);
  const ctx = useRef(null);
  const progressRef = useRef(null);
  const progressBarRef = useRef(null);

  const WIDTH = 1000;
  const HEIGHT = 1000;
  let analyzer;
  let bufferLength;

  const handlePlayPause = () => {
    if (!audio.current.src) return;
    if (isPlaying) {
      props.togglePlay(false);
    } else {
      props.togglePlay(true);
    }
  };

  //check the isPlaying flag and play/pause audio
  useEffect(() => {
    if (!isPlaying) {
      audio.current.pause();
    } else {
      audio.current.play();
    }
  });

  useEffect(() => {
    ctx.current = canvas.current.getContext("2d");
    canvas.current.width = WIDTH;
    canvas.current.height = HEIGHT;
  }, [WIDTH, HEIGHT]);

  const getAudio = async () => {
    if (!audio.current.captureStream) return;
    const stream = audio.current.captureStream();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);

    analyzer = audioCtx.createAnalyser();
    source.connect(analyzer);

    analyzer.fftSize = 2 ** 8;

    bufferLength = analyzer.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    drawFrequency(frequencyData);
  };

  const drawFrequency = frequencyData => {
    ctx.current.clearRect(0, 0, WIDTH, HEIGHT);

    analyzer.getByteFrequencyData(frequencyData);

    const barWidth = (WIDTH / bufferLength) * 2.5;
    let x = 0;

    frequencyData.forEach(amount => {
      const percent = amount / 255;
      const barHeight = HEIGHT * percent;

      ctx.current.fillStyle = `hsla(204, 96%, 49%, ${percent})`;
      ctx.current.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
      x += barWidth;
    });

    requestAnimationFrame(() => drawFrequency(frequencyData));
  };

  const playPrev = () => {
    const newIndex = trackIndex > 0 ? trackIndex - 1 : 0;
    props.setTrackIndex(newIndex);
  };
  const playNext = () => {
    const lastIndex = playlist.length - 1;
    const newIndex = trackIndex < lastIndex ? trackIndex + 1 : lastIndex;
    props.setTrackIndex(newIndex);
  };

  const handleProgress = () => {
    const { currentTime, duration } = audio.current;
    const percent = (currentTime / duration) * 100;
    progressRef.current.style.flexBasis = `${percent}%`;
  };

  const handleProgressChange = e => {
    e.persist();
    if (!audio.current.currentTime) return;
    const width = progressBarRef.current.offsetWidth;
    const percent = (e.pageX - progressBarRef.current.offsetLeft) / width;
    audio.current.currentTime = percent * audio.current.duration;
  };

  return (
    <PlayerWrapper>
      <audio
        onTimeUpdate={handleProgress}
        onCanPlayThrough={getAudio}
        crossOrigin="anonymous"
        onEnded={playNext}
        ref={audio}
        src={playlist[trackIndex] && playlist[trackIndex].preview}
      ></audio>
      <Canvas ref={canvas}></Canvas>
      <CurrentTrack>
        {playlist[trackIndex]
          ? `${playlist[trackIndex].artist.name} - ${playlist[trackIndex].title}`
          : "..."}
      </CurrentTrack>
      <ProgressBar id="bar" ref={progressBarRef} onClick={handleProgressChange}>
        <Progress id="progress" ref={progressRef}></Progress>
      </ProgressBar>
      <Buttons>
        <Button onClick={playPrev}>prev</Button>
        <Button onClick={handlePlayPause}>
          {!isPlaying ? "play" : "pause"}
        </Button>
        <Button onClick={playNext}>next</Button>
      </Buttons>
      <Volume type="range" />
    </PlayerWrapper>
  );
};

const mapStateToProps = state => {
  return { state };
};

const mapDispatchToProps = dispatch => {
  return {
    setTrackIndex: elements => dispatch(setTrackIndex(elements)),
    togglePlay: isPlaying => dispatch(togglePlay(isPlaying))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Player);
