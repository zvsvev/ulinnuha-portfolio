import AppNav from '../AppNav';
import './views.css';

const PHOTOS = [
  '/img/nature/image1.jpg',
  '/img/nature/image2.jpg',
  '/img/nature/image3.jpg',
  '/img/nature/image4.jpg',
  '/img/nature/image5.jpg',
  '/img/nature/image6.jpg',
];

type Props = { onBack: () => void };

export default function GaleriView({ onBack }: Props) {
  return (
    <div className="app-view">
      <AppNav title="Photos" onBack={onBack} />

      <div className="photo-grid">
        {PHOTOS.map((src, i) => (
          <img key={src} src={src} alt={`Nature photo ${i + 1}`} className="photo" loading="lazy" />
        ))}
      </div>
    </div>
  );
}
