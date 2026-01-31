import { SidePanel } from './components/SidePanel';
import { SettingsProvider } from './context/SettingsContext';

function App() {
  return (
    <SettingsProvider>
      <SidePanel />
    </SettingsProvider>
  );
}

export default App;
