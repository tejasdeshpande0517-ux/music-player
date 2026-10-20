/**
 * Aura Melody - Modern Pastel Music Player
 * Complete Vanilla JavaScript Application
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Initial State & Track Data
  // ==========================================================================

  const DEFAULT_TRACKS = [
    {
      id: 'track-1',
      title: 'Aetherial Drift',
      artist: 'Aura & Echo',
      album: 'Aetherial Drift EP',
      genre: 'Dreamy Lofi',
      duration: 60, // 1:00 full composition
      cover: 'assets/covers/cover-1.jpg',
      synthProfile: 'lofi_dream'
    },
    {
      id: 'track-2',
      title: 'Tranquil Drift',
      artist: 'Ether',
      album: 'Pastel Horizon',
      genre: 'Ambient Waters',
      duration: 60, // 1:00 full composition
      cover: 'assets/covers/cover-2.jpg',
      synthProfile: 'ambient_harp'
    },
    {
      id: 'track-3',
      title: 'Dawn Chorus',
      artist: 'Morning Rays',
      album: 'Morning Rays Album',
      genre: 'Sunrise Chill',
      duration: 60, // 1:00 full composition
      cover: 'assets/covers/cover-3.jpg',
      synthProfile: 'sunrise_guitar'
    },
    {
      id: 'track-4',
      title: 'Velvet Blooms',
      artist: 'Eliza Vance',
      album: 'Subtle Echoes',
      genre: 'Neo-Acoustic',
      duration: 60, // 1:00 full composition
      cover: 'assets/covers/cover-4.jpg',
      synthProfile: 'neo_rhodes'
    },
    {
      id: 'track-5',
      title: 'Lavender Mist',
      artist: 'Etheria',
      album: 'Delicate Dust',
      genre: 'Cosmic Chillhop',
      duration: 60, // 1:00 full composition
      cover: 'assets/covers/cover-5.jpg',
      synthProfile: 'cosmic_synth'
    }
  ];

  // Repeat modes enum
  const REPEAT_MODES = {
    ALL: 'ALL',
    ONE: 'ONE',
    OFF: 'OFF'
  };

  // State object
  const state = {
    playlist: [...DEFAULT_TRACKS],
    currentIndex: 0,
    isPlaying: false,
    isShuffle: false,
    repeatMode: REPEAT_MODES.ALL,
    isAutoplay: true,
    volume: 0.8,
    isMuted: false,
    previousVolume: 0.8,
    playbackRate: 1.0,
    filter: 'all', // 'all', 'favorites', or playlist ID ('pl-...')
    searchQuery: '',
    favorites: new Set(),
    userPlaylists: [], // array of { id, name, trackIds: [] }
    selectedTrackForModal: null,
    isDraggingProgress: false,
    synthCache: new Map(), // id -> objectURL
    audioContext: null,
    analyserNode: null,
    audioSourceNode: null
  };

  let activePlayPromise = null;

  // ==========================================================================
  // 2. DOM Elements
  // ==========================================================================

  const audio = document.getElementById('audioElement');
  const artworkShowcase = document.querySelector('.artwork-showcase');
  const currentCover = document.getElementById('currentCover');
  const trackTitle = document.getElementById('trackTitle');
  const trackArtist = document.getElementById('trackArtist');
  const trackGenre = document.getElementById('trackGenre');
  const audioStatusPill = document.getElementById('audioStatusPill');
  const audioStatusText = document.getElementById('audioStatusText');

  // Progress & Time
  const progressBarContainer = document.getElementById('progressBarContainer');
  const progressFill = document.getElementById('progressFill');
  const progressThumb = document.getElementById('progressThumb');
  const currentTimeEl = document.getElementById('currentTime');
  const totalDurationEl = document.getElementById('totalDuration');
  const timeTooltip = document.getElementById('timeTooltip');

  // Controls
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const repeatBtn = document.getElementById('repeatBtn');
  const repeatBadge = document.getElementById('repeatBadge');
  const likeBtn = document.getElementById('likeBtn');

  // Volume & Speed
  const muteBtn = document.getElementById('muteBtn');
  const volHighIcon = document.getElementById('volHighIcon');
  const volLowIcon = document.getElementById('volLowIcon');
  const volMuteIcon = document.getElementById('volMuteIcon');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeFill = document.getElementById('volumeFill');
  const volText = document.getElementById('volText');
  const speedBtn = document.getElementById('speedBtn');
  const speedText = document.getElementById('speedText');
  const speedDropdown = document.getElementById('speedDropdown');

  // Playlist & Library
  const playlistContainer = document.getElementById('playlistContainer');
  const playlistCounter = document.getElementById('playlistCounter');
  const mobileCount = document.getElementById('mobileCount');
  const favCount = document.getElementById('favCount');
  const playlistTabs = document.getElementById('playlistTabs');
  const newPlaylistBtn = document.getElementById('newPlaylistBtn');
  const autoplayToggle = document.getElementById('autoplayToggle');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const emptyState = document.getElementById('emptyState');
  const resetFilterBtn = document.getElementById('resetFilterBtn');

  // Create Playlist Modal
  const createPlaylistModal = document.getElementById('createPlaylistModal');
  const playlistNameInput = document.getElementById('playlistNameInput');
  const closeCreatePlaylistModal = document.getElementById('closeCreatePlaylistModal');
  const cancelCreatePlaylistBtn = document.getElementById('cancelCreatePlaylistBtn');
  const confirmCreatePlaylistBtn = document.getElementById('confirmCreatePlaylistBtn');

  // Add to Playlist Modal
  const addToPlaylistModal = document.getElementById('addToPlaylistModal');
  const addToSongTitle = document.getElementById('addToSongTitle');
  const addToSongArtist = document.getElementById('addToSongArtist');
  const playlistPickList = document.getElementById('playlistPickList');
  const closeAddToPlaylistModal = document.getElementById('closeAddToPlaylistModal');
  const closeAddToModalBtn = document.getElementById('closeAddToModalBtn');

  // File Upload & Drop Zone
  const fileUploadInput = document.getElementById('fileUploadInput');
  const dropZone = document.getElementById('dropZone');

  // Visualizer Canvas
  const visualizerCanvas = document.getElementById('visualizerCanvas');
  const canvasCtx = visualizerCanvas.getContext('2d');

  // Shortcuts Modal & Toasts
  const shortcutsBtn = document.getElementById('shortcutsBtn');
  const shortcutsModal = document.getElementById('shortcutsModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const gotItBtn = document.getElementById('gotItBtn');
  const toastContainer = document.getElementById('toastContainer');

  // Mobile Tabs
  const mobileTabBtns = document.querySelectorAll('.mobile-tab-btn');
  const playerView = document.getElementById('playerView');
  const playlistView = document.getElementById('playlistView');

  // ==========================================================================
  // 3. Audio Synthesis Engine (OfflineAudioContext -> WAV Blob URL)
  // ==========================================================================

  function audioBufferToWavBlob(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const length = buffer.length * numChannels * bytesPerSample;
    const wavBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(wavBuffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    const channels = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });

    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }
  }

  async function generateSynthesizedTrack(profile, durationSeconds = 60) {
    const sampleRate = 22050;
    const OfflineCtxClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineCtxClass) return null;

    const ctx = new OfflineCtxClass(2, Math.floor(sampleRate * durationSeconds), sampleRate);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, 0);
    masterGain.connect(ctx.destination);

    const chords = {
      lofi_dream: [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [196.00, 246.94, 293.66, 349.23]  // G7
      ],
      ambient_harp: [
        [293.66, 369.99, 440.00, 554.37], // Dmaj7
        [246.94, 293.66, 369.99, 440.00], // Bm7
        [196.00, 246.94, 293.66, 369.99], // Gmaj7
        [220.00, 277.18, 329.63, 440.00]  // A
      ],
      sunrise_guitar: [
        [329.63, 392.00, 493.88, 587.33], // Em7
        [261.63, 329.63, 392.00, 523.25], // Cmaj7
        [196.00, 246.94, 293.66, 392.00], // G
        [293.66, 369.99, 440.00, 587.33]  // D
      ],
      neo_rhodes: [
        [261.63, 311.13, 392.00, 466.16], // Cm7
        [207.65, 261.63, 311.13, 392.00], // Abmaj7
        [174.61, 207.65, 261.63, 311.13], // Fm7
        [233.08, 293.66, 349.23, 415.30]  // Bb7
      ],
      cosmic_synth: [
        [220.00, 277.18, 329.63, 440.00], // A
        [174.61, 220.00, 261.63, 349.23], // F
        [261.63, 329.63, 392.00, 523.25], // C
        [196.00, 246.94, 293.66, 392.00]  // G
      ]
    }[profile] || [
      [261.63, 329.63, 392.00, 523.25],
      [220.00, 261.63, 329.63, 440.00]
    ];

    const chordLength = 4.0;
    const totalBars = Math.ceil(durationSeconds / chordLength);

    for (let bar = 0; bar < totalBars; bar++) {
      const startTime = bar * chordLength;
      if (startTime >= durationSeconds) break;

      const chord = chords[bar % chords.length];

      chord.forEach((freq, noteIdx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = noteIdx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        noteGain.gain.setValueAtTime(0.0001, startTime);
        noteGain.gain.linearRampToValueAtTime(0.08 / chord.length, startTime + 0.6);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, Math.min(durationSeconds, startTime + chordLength - 0.1));

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(startTime);
        osc.stop(Math.min(durationSeconds, startTime + chordLength));
      });

      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(chord[0] / 2, startTime);

      bassGain.gain.setValueAtTime(0.0001, startTime);
      bassGain.gain.linearRampToValueAtTime(0.18, startTime + 0.2);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, Math.min(durationSeconds, startTime + chordLength - 0.2));

      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);

      bassOsc.start(startTime);
      bassOsc.stop(Math.min(durationSeconds, startTime + chordLength));

      for (let step = 0; step < 8; step++) {
        const stepTime = startTime + step * 0.5;
        if (stepTime >= durationSeconds) break;

        const arpFreq = chord[step % chord.length] * (step % 2 === 1 ? 2 : 1);
        const arpOsc = ctx.createOscillator();
        const arpGain = ctx.createGain();

        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(arpFreq, stepTime);

        arpGain.gain.setValueAtTime(0.0001, stepTime);
        arpGain.gain.linearRampToValueAtTime(0.04, stepTime + 0.05);
        arpGain.gain.exponentialRampToValueAtTime(0.0001, stepTime + 0.45);

        arpOsc.connect(arpGain);
        arpGain.connect(masterGain);

        arpOsc.start(stepTime);
        arpOsc.stop(stepTime + 0.5);
      }
    }

    const renderedBuffer = await ctx.startRendering();
    const wavBlob = audioBufferToWavBlob(renderedBuffer);
    return URL.createObjectURL(wavBlob);
  }

  async function getTrackAudioUrl(track) {
    if (track.customUrl) return track.customUrl;
    if (state.synthCache.has(track.id)) {
      return state.synthCache.get(track.id);
    }

    try {
      const url = await generateSynthesizedTrack(track.synthProfile, track.duration || 60);
      if (url) {
        state.synthCache.set(track.id, url);
        return url;
      }
    } catch (err) {
      console.warn('Synth generation failed for track:', track.title, err);
    }

    return track.customUrl || '';
  }

  // ==========================================================================
  // 4. Web Audio API Visualizer Setup
  // ==========================================================================

  function initWebAudioVisualizer() {
    if (state.audioContext) return;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      state.audioContext = new AudioCtxClass();
      state.analyserNode = state.audioContext.createAnalyser();
      state.analyserNode.fftSize = 64;

      try {
        state.audioSourceNode = state.audioContext.createMediaElementSource(audio);
        state.audioSourceNode.connect(state.analyserNode);
        state.analyserNode.connect(state.audioContext.destination);
      } catch (e) {
        console.debug('MediaElementSource already connected or simulated.');
      }
    } catch (err) {
      console.warn('Web Audio API initializing on gesture:', err);
    }
  }

  let visualizerAnimFrameId = null;
  const BAR_COUNT = 32;
  const smoothedHeights = new Float32Array(BAR_COUNT).fill(4);

  function startVisualizerLoop() {
    if (visualizerAnimFrameId) return;

    const bufferLength = state.analyserNode ? state.analyserNode.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);
    let waveOffset = 0;

    function renderFrame() {
      visualizerAnimFrameId = requestAnimationFrame(renderFrame);

      const rect = visualizerCanvas.getBoundingClientRect();
      const targetWidth = Math.floor(rect.width || 500);
      const targetHeight = Math.floor(rect.height || 48);

      if (visualizerCanvas.width !== targetWidth || visualizerCanvas.height !== targetHeight) {
        visualizerCanvas.width = targetWidth;
        visualizerCanvas.height = targetHeight;
      }

      const width = visualizerCanvas.width;
      const height = visualizerCanvas.height;
      canvasCtx.clearRect(0, 0, width, height);

      let hasRealAudioData = false;
      if (state.analyserNode && state.isPlaying) {
        state.analyserNode.getByteFrequencyData(dataArray);
        for (let i = 0; i < dataArray.length; i++) {
          if (dataArray[i] > 0) {
            hasRealAudioData = true;
            break;
          }
        }
      }

      waveOffset += 0.06;

      let bass = 0;
      let mids = 0;
      let highs = 0;

      if (hasRealAudioData) {
        bass = (dataArray[0] + dataArray[1] + dataArray[2]) / 3;
        mids = (dataArray[3] + dataArray[4] + dataArray[5] + dataArray[6]) / 4;
        highs = (dataArray[7] + dataArray[8] + dataArray[9] + dataArray[10]) / 4;
      }

      const barSpacing = 4;
      const totalSpacing = barSpacing * (BAR_COUNT - 1);
      const sidePadding = 12;
      const barWidth = Math.max(3, (width - totalSpacing - (sidePadding * 2)) / BAR_COUNT);

      canvasCtx.strokeStyle = 'rgba(221, 214, 254, 0.45)';
      canvasCtx.lineWidth = 1;
      canvasCtx.beginPath();
      canvasCtx.moveTo(sidePadding, height / 2);
      canvasCtx.lineTo(width - sidePadding, height / 2);
      canvasCtx.stroke();

      for (let i = 0; i < BAR_COUNT; i++) {
        const norm = i / (BAR_COUNT - 1);
        let targetHeight = 4;

        if (state.isPlaying) {
          if (hasRealAudioData) {
            const binFloat = Math.pow(norm, 1.4) * Math.min(14, dataArray.length - 1);
            const binLow = Math.floor(binFloat);
            const binHigh = Math.min(dataArray.length - 1, binLow + 1);
            const frac = binFloat - binLow;
            const directVal = (dataArray[binLow] * (1 - frac)) + (dataArray[binHigh] * frac);

            const arch = Math.sin(norm * Math.PI);
            const ripple = Math.sin(norm * 4 * Math.PI + waveOffset);
            const harmonicBonus = (bass * 0.45 * arch) + (mids * 0.35 * (0.6 + 0.4 * ripple)) + (highs * 0.25 * norm);

            const combinedEnergy = Math.max(directVal * 0.85, harmonicBonus);
            targetHeight = 4 + (combinedEnergy / 255) * (height - 10);
          } else {
            const wave1 = Math.sin(waveOffset * 1.2 + norm * Math.PI * 3);
            const wave2 = Math.cos(waveOffset * 0.8 + norm * Math.PI * 2);
            const arch = Math.sin(norm * Math.PI);
            targetHeight = 6 + (Math.abs(wave1 * 0.6 + wave2 * 0.4) * arch) * (height - 14);
          }
        } else {
          targetHeight = 4;
        }

        smoothedHeights[i] += (targetHeight - smoothedHeights[i]) * 0.22;
        const barHeight = Math.max(3, Math.min(height - 4, smoothedHeights[i]));

        const x = sidePadding + i * (barWidth + barSpacing);
        const y = (height - barHeight) / 2;

        const grad = canvasCtx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#8B5CF6');
        grad.addColorStop(0.4, '#6366F1');
        grad.addColorStop(0.8, '#38BDF8');
        grad.addColorStop(1, '#C084FC');

        canvasCtx.fillStyle = grad;
        canvasCtx.beginPath();
        const radius = Math.min(barWidth / 2, 4);
        if (canvasCtx.roundRect) {
          canvasCtx.roundRect(x, y, barWidth, barHeight, radius);
        } else {
          canvasCtx.rect(x, y, barWidth, barHeight);
        }
        canvasCtx.fill();
      }
    }

    renderFrame();
  }

  // ==========================================================================
  // 5. Playback Controller
  // ==========================================================================

  async function loadTrack(index, autoPlay = false) {
    if (index < 0 || index >= state.playlist.length) return;

    state.currentIndex = index;
    const track = state.playlist[index];

    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    trackGenre.textContent = track.genre;
    currentCover.src = track.cover;
    currentCover.alt = `${track.title} - ${track.artist}`;

    updateFavoriteButton(track.id);

    progressFill.style.width = '0%';
    progressThumb.style.left = '0%';
    currentTimeEl.textContent = '0:00';
    totalDurationEl.textContent = formatTime(track.duration);

    setAudioStatus(autoPlay ? 'Loading...' : 'Ready');

    const audioUrl = await getTrackAudioUrl(track);
    audio.src = audioUrl;
    audio.playbackRate = state.playbackRate;
    audio.defaultPlaybackRate = state.playbackRate;
    audio.volume = state.isMuted ? 0 : state.volume;

    renderPlaylist();

    if (autoPlay) {
      playSong();
    } else {
      setAudioStatus('Ready');
    }
  }

  async function playSong() {
    state.isPlaying = true;
    updatePlayPauseButton();
    artworkShowcase.classList.remove('is-paused');
    artworkShowcase.classList.add('is-playing');
    setAudioStatus('Playing');
    renderPlaylist();

    try {
      initWebAudioVisualizer();
      if (state.audioContext && state.audioContext.state === 'suspended') {
        await state.audioContext.resume();
      }

      if (!audio.src || audio.src === window.location.href) {
        const track = state.playlist[state.currentIndex];
        if (track) {
          const url = await getTrackAudioUrl(track);
          if (!state.isPlaying) return;
          audio.src = url;
          audio.playbackRate = state.playbackRate;
        }
      }

      if (!state.isPlaying) return;

      activePlayPromise = audio.play();
      await activePlayPromise;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.debug('Play request interrupted by pause.');
        return;
      }

      console.warn('Playback error:', err);
      if (state.isPlaying) {
        handleAudioError();
      }
    } finally {
      activePlayPromise = null;
    }
  }

  function pauseSong() {
    state.isPlaying = false;
    updatePlayPauseButton();
    artworkShowcase.classList.add('is-paused');
    artworkShowcase.classList.remove('is-playing');
    setAudioStatus('Paused');
    renderPlaylist();

    audio.pause();
  }

  function togglePlayPause() {
    if (state.isPlaying) {
      pauseSong();
    } else {
      playSong();
    }
  }

  function nextSong() {
    if (state.playlist.length === 0) return;

    if (state.isShuffle) {
      let nextIndex;
      if (state.playlist.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * state.playlist.length);
        } while (nextIndex === state.currentIndex);
      } else {
        nextIndex = 0;
      }
      loadTrack(nextIndex, true);
      return;
    }

    if (state.currentIndex < state.playlist.length - 1) {
      loadTrack(state.currentIndex + 1, true);
    } else {
      if (state.repeatMode === REPEAT_MODES.ALL || state.isAutoplay) {
        loadTrack(0, true);
      } else {
        pauseSong();
        audio.currentTime = 0;
      }
    }
  }

  function prevSong() {
    if (state.playlist.length === 0) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (state.currentIndex > 0) {
      loadTrack(state.currentIndex - 1, true);
    } else {
      loadTrack(state.playlist.length - 1, true);
    }
  }

  function handleTrackEnded() {
    if (state.repeatMode === REPEAT_MODES.ONE) {
      audio.currentTime = 0;
      audio.play();
    } else if (state.isAutoplay) {
      nextSong();
    } else {
      pauseSong();
      audio.currentTime = 0;
    }
  }

  async function handleAudioError() {
    if (!state.isPlaying) return;

    const track = state.playlist[state.currentIndex];
    if (!track) return;

    setAudioStatus('Loading...', 'buffering');

    try {
      const synthUrl = await generateSynthesizedTrack(track.synthProfile || 'lofi_dream', track.duration || 60);
      if (!state.isPlaying) return;

      state.synthCache.set(track.id, synthUrl);
      audio.src = synthUrl;
      audio.playbackRate = state.playbackRate;

      if (state.isPlaying) {
        activePlayPromise = audio.play();
        await activePlayPromise;
        setAudioStatus('Playing');
        showToast(`Playing "${track.title}"`, 'info');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('All audio fallbacks exhausted:', err);
      setAudioStatus('Audio Error');
    }
  }

  // ==========================================================================
  // 6. Progress & Seeking
  // ==========================================================================

  function updateProgress() {
    if (state.isDraggingProgress) return;

    const duration = audio.duration || state.playlist[state.currentIndex]?.duration || 0;
    const current = audio.currentTime || 0;

    if (duration > 0) {
      const percent = (current / duration) * 100;
      progressFill.style.width = `${percent}%`;
      progressThumb.style.left = `${percent}%`;
      currentTimeEl.textContent = formatTime(current);
      totalDurationEl.textContent = formatTime(duration);
      progressBarContainer.setAttribute('aria-valuenow', Math.round(percent));
    }
  }

  function seekTo(event) {
    const rect = progressBarContainer.getBoundingClientRect();
    const clientX = event.clientX !== undefined ? event.clientX : (event.touches && event.touches[0].clientX);
    if (clientX === undefined) return;

    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = offsetX / rect.width;
    const duration = audio.duration || state.playlist[state.currentIndex]?.duration || 0;

    if (duration > 0) {
      audio.currentTime = percent * duration;
      progressFill.style.width = `${percent * 100}%`;
      progressThumb.style.left = `${percent * 100}%`;
      currentTimeEl.textContent = formatTime(audio.currentTime);
    }
  }

  function handleProgressBarHover(event) {
    const rect = progressBarContainer.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const percent = offsetX / rect.width;
    const duration = audio.duration || state.playlist[state.currentIndex]?.duration || 0;

    timeTooltip.textContent = formatTime(percent * duration);
    timeTooltip.style.left = `${percent * 100}%`;
  }

  // ==========================================================================
  // 7. Volume & Speed Controls
  // ==========================================================================

  function setVolume(value) {
    state.volume = Math.max(0, Math.min(1, parseFloat(value)));
    if (state.volume > 0) {
      state.isMuted = false;
      state.previousVolume = state.volume;
    } else {
      state.isMuted = true;
    }

    audio.volume = state.isMuted ? 0 : state.volume;
    updateVolumeUI();
  }

  function toggleMute() {
    if (state.isMuted) {
      state.isMuted = false;
      state.volume = state.previousVolume > 0 ? state.previousVolume : 0.8;
      audio.volume = state.volume;
    } else {
      state.isMuted = true;
      state.previousVolume = state.volume;
      audio.volume = 0;
    }
    updateVolumeUI();
  }

  function updateVolumeUI() {
    const effectiveVol = state.isMuted ? 0 : state.volume;
    volumeSlider.value = effectiveVol;
    volumeFill.style.width = `${effectiveVol * 100}%`;
    volText.textContent = `${Math.round(effectiveVol * 100)}%`;

    if (effectiveVol === 0) {
      volMuteIcon.hidden = false;
      volLowIcon.hidden = true;
      volHighIcon.hidden = true;
    } else if (effectiveVol < 0.5) {
      volMuteIcon.hidden = true;
      volLowIcon.hidden = false;
      volHighIcon.hidden = true;
    } else {
      volMuteIcon.hidden = true;
      volLowIcon.hidden = true;
      volHighIcon.hidden = false;
    }
  }

  function setPlaybackRate(rate) {
    state.playbackRate = parseFloat(rate);
    audio.playbackRate = state.playbackRate;
    audio.defaultPlaybackRate = state.playbackRate;
    speedText.textContent = `${state.playbackRate.toFixed(1)}x`;

    document.querySelectorAll('.speed-opt').forEach((opt) => {
      opt.classList.toggle('active', parseFloat(opt.dataset.speed) === state.playbackRate);
    });

    speedDropdown.classList.remove('show');
    showToast(`Playback Speed: ${state.playbackRate}x`, 'info');
  }

  // ==========================================================================
  // 8. Shuffle & Repeat Modes
  // ==========================================================================

  function toggleShuffle() {
    state.isShuffle = !state.isShuffle;
    shuffleBtn.classList.toggle('is-active', state.isShuffle);
    showToast(`Shuffle ${state.isShuffle ? 'On' : 'Off'}`, 'info');
  }

  function toggleRepeat() {
    if (state.repeatMode === REPEAT_MODES.ALL) {
      state.repeatMode = REPEAT_MODES.ONE;
      repeatBadge.textContent = '1';
      repeatBadge.classList.add('show');
      repeatBtn.classList.add('is-active');
      showToast('Repeat: Current Song', 'info');
    } else if (state.repeatMode === REPEAT_MODES.ONE) {
      state.repeatMode = REPEAT_MODES.OFF;
      repeatBadge.classList.remove('show');
      repeatBtn.classList.remove('is-active');
      showToast('Repeat: Off', 'info');
    } else {
      state.repeatMode = REPEAT_MODES.ALL;
      repeatBadge.textContent = 'ALL';
      repeatBadge.classList.add('show');
      repeatBtn.classList.add('is-active');
      showToast('Repeat: All Songs', 'info');
    }
  }

  // ==========================================================================
  // 9. Favorites & User Playlists System
  // ==========================================================================

  function loadFavorites() {
    try {
      const stored = localStorage.getItem('aura_melody_favorites');
      if (stored) {
        state.favorites = new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read favorites from localStorage:', e);
    }
    updateFavCounter();
  }

  function saveFavorites() {
    try {
      localStorage.setItem('aura_melody_favorites', JSON.stringify([...state.favorites]));
    } catch (e) {
      console.warn('Could not save favorites to localStorage:', e);
    }
    updateFavCounter();
  }

  function toggleFavorite(trackId) {
    if (state.favorites.has(trackId)) {
      state.favorites.delete(trackId);
      showToast('Removed from favorites', 'info');
    } else {
      state.favorites.add(trackId);
      showToast('Added to favorites!', 'success');
    }

    saveFavorites();
    updateFavoriteButton(state.playlist[state.currentIndex]?.id);
    renderPlaylist();
    renderPlaylistTabs();
  }

  function updateFavoriteButton(currentId) {
    const isFav = state.favorites.has(currentId);
    likeBtn.classList.toggle('is-favorite', isFav);
  }

  function updateFavCounter() {
    favCount.textContent = state.favorites.size;
  }

  // User Playlists Storage
  function loadUserPlaylists() {
    try {
      const stored = localStorage.getItem('aura_melody_user_playlists');
      if (stored) {
        state.userPlaylists = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load user playlists:', e);
    }
    renderPlaylistTabs();
  }

  function saveUserPlaylists() {
    try {
      localStorage.setItem('aura_melody_user_playlists', JSON.stringify(state.userPlaylists));
    } catch (e) {
      console.warn('Could not save user playlists:', e);
    }
    renderPlaylistTabs();
  }

  function createNewPlaylist(name) {
    const cleanName = (name || '').trim();
    if (!cleanName) {
      showToast('Please enter a playlist name.', 'error');
      return;
    }

    const newId = `pl-${Date.now()}`;
    const newPlaylist = {
      id: newId,
      name: cleanName,
      trackIds: []
    };

    state.userPlaylists.push(newPlaylist);
    saveUserPlaylists();
    setFilter(newId);
    showToast(`Created playlist "${cleanName}"!`, 'success');
  }

  function deletePlaylist(playlistId) {
    const pl = state.userPlaylists.find((p) => p.id === playlistId);
    state.userPlaylists = state.userPlaylists.filter((p) => p.id !== playlistId);
    saveUserPlaylists();

    if (state.filter === playlistId) {
      setFilter('all');
    } else {
      renderPlaylist();
    }
    showToast(`Deleted playlist "${pl ? pl.name : ''}"`, 'info');
  }

  function addTrackToPlaylist(playlistId, trackId) {
    const pl = state.userPlaylists.find((p) => p.id === playlistId);
    if (!pl) return;

    if (!pl.trackIds.includes(trackId)) {
      pl.trackIds.push(trackId);
      saveUserPlaylists();
      renderPlaylist();
      renderPlaylistTabs();
      showToast(`Added to "${pl.name}"`, 'success');
    }
  }

  function removeTrackFromPlaylist(playlistId, trackId) {
    const pl = state.userPlaylists.find((p) => p.id === playlistId);
    if (!pl) return;

    pl.trackIds = pl.trackIds.filter((id) => id !== trackId);
    saveUserPlaylists();
    renderPlaylist();
    renderPlaylistTabs();
    showToast(`Removed from "${pl.name}"`, 'info');
  }

  // ==========================================================================
  // 10. Playlist Tabs & Items Rendering
  // ==========================================================================

  function renderPlaylistTabs() {
    playlistTabs.innerHTML = '';

    // 1. All Songs Tab
    const allBtn = document.createElement('button');
    allBtn.className = `tab-chip ${state.filter === 'all' ? 'active' : ''}`;
    allBtn.textContent = 'All Songs';
    allBtn.addEventListener('click', () => setFilter('all'));
    playlistTabs.appendChild(allBtn);

    // 2. Favorites Tab
    const favBtn = document.createElement('button');
    favBtn.className = `tab-chip ${state.filter === 'favorites' ? 'active' : ''}`;
    favBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      Favorites (${state.favorites.size})
    `;
    favBtn.addEventListener('click', () => setFilter('favorites'));
    playlistTabs.appendChild(favBtn);

    // 3. Custom User Playlists
    state.userPlaylists.forEach((pl) => {
      const plBtn = document.createElement('button');
      plBtn.className = `tab-chip ${state.filter === pl.id ? 'active' : ''}`;
      plBtn.innerHTML = `
        <span>${escapeHTML(pl.name)} (${pl.trackIds.length})</span>
        <span class="tab-remove-btn" title="Delete playlist">&times;</span>
      `;

      plBtn.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-remove-btn')) {
          e.stopPropagation();
          deletePlaylist(pl.id);
          return;
        }
        setFilter(pl.id);
      });

      playlistTabs.appendChild(plBtn);
    });
  }

  function renderPlaylist() {
    playlistContainer.innerHTML = '';

    const isCustomPlaylist = state.filter.startsWith('pl-');
    const currentCustomPlaylist = isCustomPlaylist
      ? state.userPlaylists.find((p) => p.id === state.filter)
      : null;

    const filteredTracks = state.playlist.filter((track) => {
      let matchesFilter = true;
      if (state.filter === 'all') {
        matchesFilter = true;
      } else if (state.filter === 'favorites') {
        matchesFilter = state.favorites.has(track.id);
      } else if (currentCustomPlaylist) {
        matchesFilter = currentCustomPlaylist.trackIds.includes(track.id);
      }

      const query = state.searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.genre.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });

    const activeListCount = filteredTracks.length;
    playlistCounter.textContent = `${activeListCount} track${activeListCount === 1 ? '' : 's'}`;
    mobileCount.textContent = state.playlist.length;

    if (filteredTracks.length === 0) {
      emptyState.hidden = false;
      const emptySub = emptyState.querySelector('.empty-subtitle');
      if (isCustomPlaylist) {
        emptySub.textContent = `No songs in "${currentCustomPlaylist ? currentCustomPlaylist.name : 'this playlist'}" yet. Click the "+" button on any track to add it here.`;
      } else {
        emptySub.textContent = 'Try adjusting your search query or tab filter.';
      }
      return;
    }
    emptyState.hidden = true;

    filteredTracks.forEach((track, displayIdx) => {
      const originalIndex = state.playlist.findIndex((t) => t.id === track.id);
      const isCurrent = originalIndex === state.currentIndex;
      const isPlaying = isCurrent && state.isPlaying;
      const isFav = state.favorites.has(track.id);

      const item = document.createElement('div');
      item.className = `playlist-item ${isCurrent ? 'is-active' : ''} ${isPlaying ? 'is-playing' : ''}`;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `Play ${track.title} by ${track.artist}`);

      item.innerHTML = `
        <div class="track-index">${displayIdx + 1}</div>
        <div class="mini-equalizer" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div class="item-thumb-wrapper">
          <img src="${track.cover}" alt="" class="item-thumb" loading="lazy">
        </div>
        <div class="item-meta">
          <span class="item-title">${escapeHTML(track.title)}</span>
          <span class="item-artist">${escapeHTML(track.artist)}</span>
        </div>
        <div class="item-actions">
          <span class="item-duration">${formatTime(track.duration)}</span>
          <button class="item-fav-btn ${isFav ? 'is-favorite' : ''}" title="Favorite" aria-label="Favorite song" data-id="${track.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button class="item-add-btn" title="Add to playlist" aria-label="Add to playlist" data-id="${track.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          ${isCustomPlaylist ? `
            <button class="item-del-btn" title="Remove from this playlist" aria-label="Remove from this playlist" data-remove-track="${track.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          ` : (track.isCustom ? `
            <button class="item-del-btn" title="Delete custom audio" aria-label="Delete custom audio" data-delete-track="${track.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          ` : '')}
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.item-fav-btn') || e.target.closest('.item-add-btn') || e.target.closest('.item-del-btn')) return;

        if (state.currentIndex === originalIndex) {
          togglePlayPause();
        } else {
          loadTrack(originalIndex, true);
        }
      });

      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadTrack(originalIndex, true);
        }
      });

      // Favorite button
      const favBtn = item.querySelector('.item-fav-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(track.id);
      });

      // Add to playlist button
      const addBtn = item.querySelector('.item-add-btn');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openAddToPlaylistModal(track);
      });

      // Delete / Remove button
      const delBtn = item.querySelector('.item-del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (isCustomPlaylist) {
            removeTrackFromPlaylist(state.filter, track.id);
          } else if (track.isCustom) {
            deleteCustomTrack(track.id);
          }
        });
      }

      playlistContainer.appendChild(item);
    });
  }

  function setFilter(filterType) {
    state.filter = filterType;
    renderPlaylistTabs();
    renderPlaylist();
  }

  // ==========================================================================
  // 11. Add to Playlist Modal UI
  // ==========================================================================

  function openAddToPlaylistModal(track) {
    state.selectedTrackForModal = track;
    addToSongTitle.textContent = track.title;
    addToSongArtist.textContent = track.artist;

    playlistPickList.innerHTML = '';

    if (state.userPlaylists.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-subtitle';
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.padding = '12px';
      emptyMsg.innerHTML = `No custom playlists yet.<br><button class="pill-btn-small" style="margin-top: 8px;" id="quickCreatePlBtn">+ Create Playlist</button>`;
      playlistPickList.appendChild(emptyMsg);

      emptyMsg.querySelector('#quickCreatePlBtn').addEventListener('click', () => {
        addToPlaylistModal.classList.remove('show');
        createPlaylistModal.classList.add('show');
        playlistNameInput.focus();
      });
    } else {
      state.userPlaylists.forEach((pl) => {
        const item = document.createElement('div');
        item.className = 'pick-playlist-item';

        const isInPl = pl.trackIds.includes(track.id);

        item.innerHTML = `
          <div>
            <span class="pick-name">${escapeHTML(pl.name)}</span>
            <span class="pick-count">(${pl.trackIds.length} tracks)</span>
          </div>
          <button class="pick-add-btn ${isInPl ? 'in-playlist' : ''}">
            ${isInPl ? 'Added' : '+ Add'}
          </button>
        `;

        const btn = item.querySelector('.pick-add-btn');
        btn.addEventListener('click', () => {
          if (isInPl) {
            removeTrackFromPlaylist(pl.id, track.id);
            btn.classList.remove('in-playlist');
            btn.textContent = '+ Add';
          } else {
            addTrackToPlaylist(pl.id, track.id);
            btn.classList.add('in-playlist');
            btn.textContent = 'Added';
          }
        });

        playlistPickList.appendChild(item);
      });
    }

    addToPlaylistModal.classList.add('show');
  }

  // ==========================================================================
  // 12. Custom File Upload & Drag-and-Drop
  // ==========================================================================

  function handleFiles(files) {
    if (!files || files.length === 0) return;

    let addedCount = 0;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('audio/')) {
        showToast(`Skipped "${file.name}": Not an audio file.`, 'error');
        return;
      }

      const fileUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const parts = cleanName.split(' - ');
      const title = parts.length > 1 ? parts[1].trim() : parts[0].trim();
      const artist = parts.length > 1 ? parts[0].trim() : 'Local Audio';

      const coverIndex = (state.playlist.length % 5) + 1;

      const newTrack = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: title || 'Untitled Track',
        artist: artist || 'Local Artist',
        album: 'My Uploads',
        genre: 'User Track',
        duration: 180,
        cover: `assets/covers/cover-${coverIndex}.jpg`,
        customUrl: fileUrl,
        isCustom: true
      };

      const tempAudio = new Audio();
      tempAudio.src = fileUrl;
      tempAudio.addEventListener('loadedmetadata', () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration)) {
          newTrack.duration = Math.round(tempAudio.duration);
          renderPlaylist();
        }
      });

      state.playlist.push(newTrack);
      addedCount++;
    });

    if (addedCount > 0) {
      showToast(`Added ${addedCount} song${addedCount === 1 ? '' : 's'} to playlist!`, 'success');
      renderPlaylist();
      if (!state.isPlaying && state.isAutoplay) {
        loadTrack(state.playlist.length - 1, true);
      }
    }
  }

  function deleteCustomTrack(trackId) {
    const idx = state.playlist.findIndex((t) => t.id === trackId);
    if (idx === -1) return;

    const track = state.playlist[idx];
    if (track.customUrl) {
      URL.revokeObjectURL(track.customUrl);
    }

    state.playlist.splice(idx, 1);
    state.favorites.delete(trackId);
    saveFavorites();

    // Remove from any custom playlists
    state.userPlaylists.forEach((pl) => {
      pl.trackIds = pl.trackIds.filter((id) => id !== trackId);
    });
    saveUserPlaylists();

    if (state.currentIndex === idx) {
      if (state.playlist.length > 0) {
        loadTrack(Math.min(idx, state.playlist.length - 1), state.isPlaying);
      } else {
        pauseSong();
        trackTitle.textContent = 'No tracks in playlist';
        trackArtist.textContent = 'Add some music to start listening';
      }
    } else if (state.currentIndex > idx) {
      state.currentIndex--;
    }

    renderPlaylist();
    showToast('Track removed', 'info');
  }

  // ==========================================================================
  // 13. Helper Functions & UI Utilities
  // ==========================================================================

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function updatePlayPauseButton() {
    if (state.isPlaying) {
      playIcon.hidden = true;
      pauseIcon.hidden = false;
      playPauseBtn.setAttribute('title', 'Pause (Space)');
      playPauseBtn.setAttribute('aria-label', 'Pause');
    } else {
      playIcon.hidden = false;
      pauseIcon.hidden = true;
      playPauseBtn.setAttribute('title', 'Play (Space)');
      playPauseBtn.setAttribute('aria-label', 'Play');
    }
  }

  function setAudioStatus(text, className = '') {
    audioStatusText.textContent = text;
    audioStatusPill.className = `audio-status-pill ${className}`;
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHTML(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // ==========================================================================
  // 14. Event Listeners Wire-up
  // ==========================================================================

  function bindEvents() {
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleTrackEnded);
    audio.addEventListener('error', handleAudioError);
    audio.addEventListener('playing', () => setAudioStatus('Playing'));
    audio.addEventListener('pause', () => {
      if (!audio.seeking) setAudioStatus('Paused');
    });
    audio.addEventListener('waiting', () => setAudioStatus('Buffering...', 'buffering'));

    audio.addEventListener('loadedmetadata', () => {
      audio.playbackRate = state.playbackRate;
      audio.defaultPlaybackRate = state.playbackRate;
    });

    // Playback Controls
    playPauseBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);

    likeBtn.addEventListener('click', () => {
      const currentTrack = state.playlist[state.currentIndex];
      if (currentTrack) toggleFavorite(currentTrack.id);
    });

    // Autoplay Toggle Switch
    autoplayToggle.addEventListener('change', (e) => {
      state.isAutoplay = e.target.checked;
      try {
        localStorage.setItem('aura_melody_autoplay', JSON.stringify(state.isAutoplay));
      } catch (err) {}
      showToast(`Autoplay ${state.isAutoplay ? 'Enabled' : 'Disabled'}`, 'info');
    });

    // Seek / Progress Scrubbing
    progressBarContainer.addEventListener('mousedown', (e) => {
      state.isDraggingProgress = true;
      progressBarContainer.classList.add('is-dragging');
      seekTo(e);

      const onMouseMove = (moveEvent) => seekTo(moveEvent);
      const onMouseUp = () => {
        state.isDraggingProgress = false;
        progressBarContainer.classList.remove('is-dragging');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    progressBarContainer.addEventListener('touchstart', (e) => {
      state.isDraggingProgress = true;
      seekTo(e);
    }, { passive: true });

    progressBarContainer.addEventListener('touchmove', (e) => {
      if (state.isDraggingProgress) seekTo(e);
    }, { passive: true });

    progressBarContainer.addEventListener('touchend', () => {
      state.isDraggingProgress = false;
    });

    progressBarContainer.addEventListener('mousemove', handleProgressBarHover);

    progressBarContainer.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
      } else if (e.key === 'ArrowLeft') {
        audio.currentTime = Math.max(0, audio.currentTime - 5);
      }
    });

    // Volume Slider & Mute
    volumeSlider.addEventListener('input', (e) => setVolume(e.target.value));
    muteBtn.addEventListener('click', toggleMute);

    // Speed Selector
    speedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      speedDropdown.classList.toggle('show');
    });

    document.querySelectorAll('.speed-opt').forEach((opt) => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        setPlaybackRate(opt.dataset.speed);
      });
    });

    document.addEventListener('click', (e) => {
      if (!speedDropdown.contains(e.target) && e.target !== speedBtn) {
        speedDropdown.classList.remove('show');
      }
    });

    // Create Playlist Modal Handlers
    newPlaylistBtn.addEventListener('click', () => {
      playlistNameInput.value = '';
      createPlaylistModal.classList.add('show');
      playlistNameInput.focus();
    });

    closeCreatePlaylistModal.addEventListener('click', () => createPlaylistModal.classList.remove('show'));
    cancelCreatePlaylistBtn.addEventListener('click', () => createPlaylistModal.classList.remove('show'));

    confirmCreatePlaylistBtn.addEventListener('click', () => {
      createNewPlaylist(playlistNameInput.value);
      createPlaylistModal.classList.remove('show');
    });

    playlistNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        createNewPlaylist(playlistNameInput.value);
        createPlaylistModal.classList.remove('show');
      }
    });

    // Add to Playlist Modal Handlers
    closeAddToPlaylistModal.addEventListener('click', () => addToPlaylistModal.classList.remove('show'));
    closeAddToModalBtn.addEventListener('click', () => addToPlaylistModal.classList.remove('show'));

    // Search input
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      clearSearchBtn.hidden = !state.searchQuery;
      renderPlaylist();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      clearSearchBtn.hidden = true;
      renderPlaylist();
    });

    resetFilterBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      clearSearchBtn.hidden = true;
      setFilter('all');
    });

    // File Upload & Drag-and-Drop
    fileUploadInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      e.target.value = '';
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files) {
        handleFiles(dt.files);
      }
    });

    // Keyboard Shortcuts Global Handler
    window.addEventListener('keydown', (e) => {
      if (e.target === searchInput || e.target === playlistNameInput) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            e.preventDefault();
            nextSong();
          } else {
            e.preventDefault();
            audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
            showToast('Seek: +5s', 'info');
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            e.preventDefault();
            prevSong();
          } else {
            e.preventDefault();
            audio.currentTime = Math.max(0, audio.currentTime - 5);
            showToast('Seek: -5s', 'info');
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, state.volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, state.volume - 0.05));
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyL':
          const currentTrack = state.playlist[state.currentIndex];
          if (currentTrack) toggleFavorite(currentTrack.id);
          break;
        case 'KeyS':
          toggleShuffle();
          break;
        case 'KeyR':
          toggleRepeat();
          break;
      }
    });

    // Shortcuts Modal
    shortcutsBtn.addEventListener('click', () => shortcutsModal.classList.add('show'));
    closeModalBtn.addEventListener('click', () => shortcutsModal.classList.remove('show'));
    gotItBtn.addEventListener('click', () => shortcutsModal.classList.remove('show'));

    [shortcutsModal, createPlaylistModal, addToPlaylistModal].forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
      });
    });

    // Mobile View Tab Switcher
    mobileTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        mobileTabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        if (tab === 'player') {
          playerView.classList.add('active-tab');
          playlistView.classList.remove('active-tab');
        } else {
          playlistView.classList.add('active-tab');
          playerView.classList.remove('active-tab');
        }
      });
    });
  }

  // ==========================================================================
  // 15. Initialization
  // ==========================================================================

  async function init() {
    // Load autoplay preference
    try {
      const storedAutoplay = localStorage.getItem('aura_melody_autoplay');
      if (storedAutoplay !== null) {
        state.isAutoplay = JSON.parse(storedAutoplay);
      }
    } catch (e) {}
    autoplayToggle.checked = state.isAutoplay;

    loadFavorites();
    loadUserPlaylists();
    updateVolumeUI();
    bindEvents();
    startVisualizerLoop();

    playerView.classList.add('active-tab');

    await loadTrack(0, false);
    renderPlaylistTabs();
    renderPlaylist();

    setTimeout(async () => {
      for (const track of state.playlist) {
        if (!state.synthCache.has(track.id)) {
          try {
            const url = await generateSynthesizedTrack(track.synthProfile, track.duration || 60);
            if (url) state.synthCache.set(track.id, url);
          } catch (e) {
            console.debug('Background synth deferred for track:', track.title);
          }
        }
      }
    }, 100);

    console.log('%c Aura Melody 🎵 Initialized with Autoplay & Custom Playlist Support!', 'color: #7C3AED; font-weight: bold; font-size: 14px;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
