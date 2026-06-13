import { useEffect, useState } from 'react';

/** Chữ chạy từng ký tự kiểu hộp thoại Pokémon. Trả về text đang gõ + cờ xong. */
export function useTypewriter(text: string, speedMs = 22): { display: string; isDone: boolean } {
  const [display, setDisplay] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setDisplay('');
    setIsDone(false);
    if (!text) {
      setIsDone(true);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      // slice theo Array.from để không cắt đôi emoji
      const chars = Array.from(text);
      setDisplay(chars.slice(0, i).join(''));
      if (i >= chars.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, speedMs);
    return () => clearInterval(interval);
  }, [text, speedMs]);

  return { display, isDone };
}
