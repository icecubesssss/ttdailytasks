import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { DownloadCloud, X } from 'lucide-react';

export default function DesktopUpdatePrompt() {
  const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string; notes: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only run on Electron (file:// protocol) or specifically user agent
    const isElectron = navigator.userAgent.toLowerCase().includes('electron') || window.location.protocol === 'file:';
    if (!isElectron) return;

    const checkUpdate = async () => {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('*')
          .eq('id', 'desktop_app')
          .single();

        if (error || !data) return;

        // __APP_VERSION__ is injected via Vite define
        const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
        const dbVersion = data.version;

        const isNewer = compareVersions(dbVersion, currentVersion) > 0;
        
        if (isNewer) {
          setUpdateInfo({
            version: data.version,
            url: data.download_url,
            notes: data.release_notes
          });
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    };

    checkUpdate();
  }, []);

  const compareVersions = (v1: string, v2: string) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  };

  if (!isOpen || !updateInfo) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 relative">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 bg-slate-800/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
          
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-4">
            <DownloadCloud size={24} />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Bản cập nhật mới!</h2>
          <p className="text-slate-400 text-sm mb-4">
            Phiên bản <strong className="text-white">v{updateInfo.version}</strong> đã ra mắt. Bạn đang dùng v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}.
          </p>

          {updateInfo.notes && (
            <div className="bg-slate-800/50 p-4 rounded-xl mb-6 border border-slate-700/50">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Chi tiết</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{updateInfo.notes}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
            >
              Để sau
            </button>
            <a
              href={updateInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <DownloadCloud size={18} />
              Tải ngay
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
