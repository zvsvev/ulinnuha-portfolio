import { useEffect, useState } from 'react';
import AppNav from '../AppNav';
import './views.css';

const FALLBACK = [
  '/img/nature/image1.jpg',
  '/img/nature/image2.jpg',
  '/img/nature/image3.jpg',
  '/img/nature/image4.jpg',
  '/img/nature/image5.jpg',
  '/img/nature/image6.jpg',
];

type Props = { onBack: () => void };

export default function GaleriView({ onBack }: Props) {
  const [urls, setUrls] = useState<string[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/posts?app=gallery')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { imageUrl: string }[]) => {
        if (!alive) return;
        setUrls(data.length ? data.map((p) => p.imageUrl) : FALLBACK);
      })
      .catch(() => { if (alive) setUrls(FALLBACK); });
    return () => { alive = false; };
  }, []);

  const shown = urls ?? FALLBACK;

  return (
    <div className="app-view">
      <AppNav title="Photos" onBack={onBack} />

      <div className="photo-grid">
        {shown.map((src, i) => (
          <img key={src + i} src={src} alt={`Photo ${i + 1}`} className="photo" loading="lazy" />
        ))}
      </div>
    </div>
  );
}
