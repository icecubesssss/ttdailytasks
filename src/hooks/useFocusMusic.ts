import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import { appsScriptUrl } from '../config';
import { musicStore } from '../utils/musicStore';
import { useAppStore } from '../store/useAppStore';
import { UserData } from '../utils/helpers';

const globalAudio = new Audio();

export interface MusicTrackData {
  id: string;
  mood?: string;
  title: string;
  artist?: string;
  cover?: string;
  url: string;
  storagePath?: string;
  driveId?: string;
  isCustom?: boolean;
  createdAt: string;
  uploadedBy: string;
}

export interface UseFocusMusicReturn {
  tracks: MusicTrackData[];
  currentTrack: MusicTrackData | null;
  currentTrackIdx: number;
  setCurrentTrackIdx: (idx: number) => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  togglePlay: () => void;
  handleNext: () => void;
  handlePrevious: () => void;
  currentTime: number;
  duration: number;
  handleSeek: (time: number) => void;
  volume: number;
  setVolume: (val: number) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  isCaching: boolean;
  cachedIds: Set<string>;
  uploadProgress: number;
  handleFileUpload: (file: File, selectedMood?: string) => Promise<void>;
  handleDeleteTrack: (track: MusicTrackData) => Promise<void>;
  handleAddViaUrl: (url: string) => Promise<void>;
  handleRandomPlay: () => void;
  audioRef: React.MutableRefObject<HTMLAudioElement>;
}

export function useFocusMusic(userData: UserData): UseFocusMusicReturn {
  const music = useAppStore((state) => state.userData.music || {
    currentTrackIdx: 0,
    isPlaying: false,
    volume: 0.7,
    isMuted: false
  });
  const patchUserData = useAppStore((state) => state.patchUserData);

  const audioRef = useRef<HTMLAudioElement>(globalAudio);
  const [customTracks, setCustomTracks] = useState<MusicTrackData[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCaching, setIsCaching] = useState(false);
  const [cachedIds] = useState(new Set<string>());
  const [uploadProgress, setUploadProgress] = useState(0);

  const { currentTrackIdx, isPlaying, volume, isMuted } = music;

  const musicRef = useRef(music);
  useEffect(() => { musicRef.current = music; }, [music]);

  const setMusicState = useCallback((updates: Partial<typeof music>) => {
    patchUserData({
      music: { ...musicRef.current, ...updates }
    });
  }, [patchUserData]);

  const isDirectStreamUrl = (url: string) =>
    /sharepoint\.com|onedrive\.live\.com|1drv\.ms|drive\.google\.com|dropbox\.com|soundhelix\.com/i.test(url);

  // --- Load Shared Music ---
  useEffect(() => {
    const fetchMusic = async () => {
      const { data, error } = await supabase
        .from('shared_music')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[FocusMusic] Không đọc được shared_music:', error);
        return;
      }
      if (data) {
        const nextTracks = data.map(d => ({
          id: d.id,
          mood: d.mood,
          title: d.title,
          artist: d.artist,
          cover: d.cover,
          url: d.url,
          storagePath: d.storage_path,
          driveId: d.drive_id,
          isCustom: d.is_custom,
          createdAt: d.created_at || new Date(0).toISOString(),
          uploadedBy: d.uploaded_by || 'unknown'
        } as MusicTrackData));
        setCustomTracks(nextTracks);
      }
    };
    
    fetchMusic();

    const channel = supabase.channel('public:shared_music')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_music' }, () => {
        fetchMusic();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const tracks = customTracks;
  const currentTrack = tracks[currentTrackIdx] || null;

  useEffect(() => {
    if (tracks.length === 0) return;
    if (currentTrackIdx >= tracks.length) {
      setMusicState({ currentTrackIdx: 0 });
    }
  }, [tracks.length, currentTrackIdx, setMusicState]);

  // --- Audio Control Functions ---
  const handleNext = useCallback(() => {
    if (tracks.length === 0) return;
    const nextIdx = (currentTrackIdx + 1) % tracks.length;
    setMusicState({ currentTrackIdx: nextIdx, isPlaying: true });
  }, [tracks.length, currentTrackIdx, setMusicState]);

  const handlePrevious = useCallback(() => {
    if (tracks.length === 0) return;
    const prevIdx = (currentTrackIdx - 1 + tracks.length) % tracks.length;
    setMusicState({ currentTrackIdx: prevIdx, isPlaying: true });
  }, [tracks.length, currentTrackIdx, setMusicState]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      globalAudio.pause();
      setMusicState({ isPlaying: false });
    } else if (currentTrack) {
      globalAudio.play().catch(console.warn);
      setMusicState({ isPlaying: true });
    }
  }, [isPlaying, currentTrack, setMusicState]);

  const handleSeek = useCallback((time: number) => {
    globalAudio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleRandomPlay = useCallback(() => {
    if (tracks.length === 0) return;
    const randomIdx = Math.floor(Math.random() * tracks.length);
    setMusicState({ currentTrackIdx: randomIdx, isPlaying: true });
  }, [tracks, setMusicState]);

  // --- Caching ---
  const ensureTrackCached = async (track: MusicTrackData | null): Promise<string | null> => {
    if (!track) return null;
    if (isDirectStreamUrl(track.url)) return track.url;

    try {
      const cached = await musicStore.getTrack(track.id);
      if (cached?.blob) return URL.createObjectURL(cached.blob);
      if (track.url === 'local') return null;
      
      setIsCaching(true);
      const response = await fetch(track.url);
      const blob = await response.blob();
      await musicStore.saveTrack({ id: track.id, blob, name: track.title });
      setIsCaching(false);
      return URL.createObjectURL(blob);
    } catch {
      setIsCaching(false);
      return track.url;
    }
  };

  useEffect(() => {
    let objectUrl: string | null = null;
    const updateSource = async () => {
      if (!currentTrack) return;
      const src = await ensureTrackCached(currentTrack);
      if (src?.startsWith('blob:')) objectUrl = src;
      
      if (globalAudio.src !== src && src) {
        globalAudio.src = src;
        globalAudio.load();
      }
      
      globalAudio.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        globalAudio.play().catch(console.warn);
      } else {
        globalAudio.pause();
      }
    };
    updateSource();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [currentTrackIdx, tracks, volume, isMuted, isPlaying, currentTrack]);

  useEffect(() => {
    const audio = globalAudio;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => handleNext();
    
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [handleNext]);

  useEffect(() => {
    return () => {
      globalAudio.pause();
      patchUserData({
        music: { ...musicRef.current, isPlaying: false }
      });
    };
  }, [patchUserData]);

  // --- Upload/Delete ---
  const handleFileUpload = async (file: File, selectedMood = 'all') => {
    if (!file || !appsScriptUrl) return;
    try {
      setIsCaching(true);
      setUploadProgress(10);
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
      });
      setUploadProgress(30);
      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'uploadMusic', fileName: file.name, mimeType: file.type, base64 })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setUploadProgress(80);
      
      await supabase.from('shared_music').insert({
        id: crypto.randomUUID(),
        mood: selectedMood,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Shared Drive',
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        url: result.url,
        drive_id: result.id,
        is_custom: true,
        created_at: new Date().toISOString(),
        uploaded_by: userData.uid || 'unknown'
      });
      setUploadProgress(100);
      setTimeout(() => { setIsCaching(false); setUploadProgress(0); }, 1000);
    } catch (err: unknown) {
      setIsCaching(false);
      setUploadProgress(0);
      alert('Tải nhạc thất bại: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteTrack = async (track: MusicTrackData) => {
    try {
      await supabase.from('shared_music').delete().eq('id', track.id);
      await musicStore.deleteTrack(track.id);
      if (currentTrack?.id === track.id) handleNext();
    } catch { alert('Xóa nhạc thất bại.'); }
  };

  const handleAddViaUrl = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    try {
      const label = decodeURIComponent(trimmed.split('/').pop()?.split('?')[0] || 'Custom Track');
      await supabase.from('shared_music').insert({
        id: crypto.randomUUID(),
        mood: 'all',
        title: label,
        artist: isDirectStreamUrl(trimmed) ? 'Cloud Link' : 'Custom Link',
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        url: trimmed,
        is_custom: true,
        created_at: new Date().toISOString(),
        uploaded_by: userData.uid || 'unknown'
      });
    } catch (err: unknown) {
      alert('Thêm link nhạc thất bại: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return {
    tracks, currentTrack, currentTrackIdx, setCurrentTrackIdx: (idx: number) => setMusicState({ currentTrackIdx: idx }),
    isPlaying, setIsPlaying: (val: boolean) => setMusicState({ isPlaying: val }), togglePlay, handleNext, handlePrevious,
    currentTime, duration, handleSeek,
    volume, setVolume: (val: number) => setMusicState({ volume: val }), isMuted, setIsMuted: (val: boolean) => setMusicState({ isMuted: val }),
    isCaching, cachedIds, uploadProgress,
    handleFileUpload, handleDeleteTrack, handleAddViaUrl, handleRandomPlay,
    audioRef
  };
}
