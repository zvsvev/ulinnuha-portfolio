import { useState } from 'react';
import LockScreen from './LockScreen';
import HomeScreen, { type AppId } from './HomeScreen';
import AboutView from './views/AboutView';
import ProjectsView from './views/ProjectsView';
import GaleriView from './views/GaleriView';
import NotesView from './views/NotesView';
import ContactView from './views/ContactView';
import PadelGame from './PadelGame';
import TTSApp from './TTSApp';
import './AppShell.css';

type View = 'lock' | 'home' | AppId;

const VIEW_TITLES: Record<AppId, string> = {
  about: 'About',
  projects: 'Projects',
  photos: 'Photos',
  notes: 'Notes',
  contacts: 'Contacts',
  padel: 'Padel Pong',
  tts: 'Text to Speech',
};

export default function AppShell() {
  const [view, setView] = useState<View>('lock');

  const goHome = () => setView('home');
  const open = (id: AppId) => setView(id);

  return (
    <div className="shell">
      {view === 'lock' && <LockScreen onUnlock={goHome} />}

      {view === 'home' && <HomeScreen onOpen={open} />}

      {view === 'about' && <AboutView onBack={goHome} onOpen={open} />}
      {view === 'projects' && <ProjectsView onBack={goHome} onOpen={open} />}
      {view === 'photos' && <GaleriView onBack={goHome} />}
      {view === 'notes' && <NotesView onBack={goHome} />}
      {view === 'contacts' && <ContactView onBack={goHome} />}

      {view === 'padel' && (
        <div className="app-view">
          <PadelGame onBack={goHome} />
        </div>
      )}
      {view === 'tts' && (
        <div className="app-view">
          <TTSApp onBack={goHome} />
        </div>
      )}
    </div>
  );
}

export { VIEW_TITLES };
