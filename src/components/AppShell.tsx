import { useState } from 'react';
import { AppProvider } from '../context/AppContext';
import LockScreen from './LockScreen';
import HomeScreen, { type AppId } from './HomeScreen';
import AboutView from './views/AboutView';
import ProjectsView from './views/ProjectsView';
import GaleriView from './views/GaleriView';
import NotesView from './views/NotesView';
import ContactView from './views/ContactView';
import InstagramView from './views/InstagramView';
import FacebookView from './views/FacebookView';
import CalculatorView from './views/CalculatorView';
import SettingsView from './views/SettingsView';
import PadelGame from './PadelGame';
import TTSApp from './TTSApp';
import './AppShell.css';

type View = 'lock' | 'home' | AppId;

export default function AppShell() {
  const [view, setView] = useState<View>('lock');

  const goHome = () => setView('home');
  const open = (id: AppId) => setView(id);

  return (
    <AppProvider>
      <div className="shell">
        {view === 'lock' && <LockScreen onUnlock={goHome} />}

        {view === 'home' && <HomeScreen onOpen={open} />}

        {view === 'about' && <AboutView onBack={goHome} onOpen={open} />}
        {view === 'projects' && <ProjectsView onBack={goHome} onOpen={open} />}
        {view === 'photos' && <GaleriView onBack={goHome} />}
        {view === 'notes' && <NotesView onBack={goHome} />}
        {view === 'contacts' && <ContactView onBack={goHome} />}

        {view === 'instagram' && <InstagramView onBack={goHome} />}
        {view === 'facebook' && <FacebookView onBack={goHome} />}
        {view === 'calculator' && <CalculatorView onBack={goHome} />}
        {view === 'settings' && <SettingsView onBack={goHome} />}

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
    </AppProvider>
  );
}
