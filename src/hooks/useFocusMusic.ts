import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, appsScriptUrl } from '../firebase';
import { musicStore } from '../utils/musicStore';
import { useAppStore } from '../store/useAppStore';
import { UserData } from '../utils/helpers';

// Singleton Audio instance to persist across hook re-mounts
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

interface FirestoreMusicTrack {
  mood?: string;
  title?: string;
  artist?: string;
  cover?: string;
  url?: string;
  storagePath?: string;
  driveId?: string;
  isCustom?: boolean;
  createdAt?: string;
  uploadedBy?: string;
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

  // --- Load Shared Music ---
  useEffect(() => {
    const q = query(collection(db, 'shared_music'), orderBy('createdAt', 'desc'));
    const unsubscribe: Unsubscribe = onSnapshot(q, (snapshot) => {
      const nextTracks = snapshot.docs
        .map((snap): MusicTrackData | null => {
          const data = snap.data() as FirestoreMusicTrack;
          if (!data.title || !data.url) return null;
          return {
            id: snap.id,
            title: data.title,
            url: data.url,
            mood: data.mood,
            artist: data.artist,
            cover: data.cover,
            storagePath: data.storagePath,
            driveId: data.driveId,
            isCustom: data.isCustom,
            createdAt: data.createdAt || new Date(0).toISOString(),
            uploadedBy: data.uploadedBy || 'unknown'
          };
        })
        .filter((track): track is MusicTrackData => Boolean(track));
      setCustomTracks(nextTracks);
    });
    return () => unsubscribe();
  }, []);

  const tracks = customTracks;
  const currentTrack = tracks[currentTrackIdx] || null;

  // --- Migration Logic ---
  useEffect(() => {
    const migrate = async () => {
      try {
        const localMetadata = await musicStore.getAllMetadata();
        if (localMetadata?.length > 0) {
          for (const track of localMetadata) {
            if (track.url === 'local') {
              const fullTrack = await musicStore.getTrack(track.id);
              if (fullTrack?.blob) {
                const fileName = `migration-${Date.now()}-${track.title}.mp3`;
                const storageRef = ref(storage, `music/${fileName}`);
                const uploadResult = await uploadBytes(storageRef, fullTrack.blob);
                const downloadUrl = await getDownloadURL(uploadResult.ref);
                await addDoc(collection(db, 'shared_music'), {
                  mood: track.mood || 'lofi',
                  title: track.title,
                  artist: 'Migrated Upload',
                  cover: track.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
                  url: downloadUrl,
                  storagePath: `music/${fileName}`,
                  isCustom: true,
                  createdAt: new Date().toISOString(),
                  uploadedBy: userData.uid || 'migration'
                });
              }
              await musicStore.deleteTrack(track.id);
            }
          }
        }
      } catch (err) { console.error('Migration failed:', err); }
    };
    if (userData?.uid) migrate();
  }, [userData?.uid]);

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
    const isExternal = track.url.includes('sharepoint.com') || track.url.includes('soundhelix.com');
    if (isExternal) return track.url;

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
      
      // Only update src if it's different to avoid restart
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

  // Handle Pause/Complete from external state
  useEffect(() => {
    return () => {
      // This runs on unmount of the FocusView
      globalAudio.pause();
      // Use the ref to avoid stale closure
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
      await addDoc(collection(db, 'shared_music'), {
        mood: selectedMood,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Shared Drive',
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        url: result.url,
        driveId: result.id,
        isCustom: true,
        createdAt: new Date().toISOString(),
        uploadedBy: userData.uid || 'unknown'
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
      await deleteDoc(doc(db, 'shared_music', track.id));
      if (track.storagePath) await deleteObject(ref(storage, track.storagePath));
      await musicStore.deleteTrack(track.id);
      if (currentTrack?.id === track.id) handleNext();
    } catch { alert('Xóa nhạc thất bại.'); }
  };

  return {
    tracks, currentTrack, currentTrackIdx, setCurrentTrackIdx: (idx: number) => setMusicState({ currentTrackIdx: idx }),
    isPlaying, setIsPlaying: (val: boolean) => setMusicState({ isPlaying: val }), togglePlay, handleNext, handlePrevious,
    currentTime, duration, handleSeek,
    volume, setVolume: (val: number) => setMusicState({ volume: val }), isMuted, setIsMuted: (val: boolean) => setMusicState({ isMuted: val }),
    isCaching, cachedIds, uploadProgress,
    handleFileUpload, handleDeleteTrack, handleRandomPlay,
    audioRef
  };
}
