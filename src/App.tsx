import './app.css';
import { Sidebar } from './components/sidebar/sidebar';
import { StoreProvider } from './components/store/store';
import { Viewport } from './components/viewport/viewport';
import { Toaster } from './components/ui/toaster';
import { Dropzone } from './components/dropzone/dropzone';

function App() {
  return (
    <StoreProvider>
      <div className="flex gap-6 py-6 px-8 w-screen h-screen relative">
        <Viewport />
        <Sidebar />
      </div>
      <Dropzone />
      <Toaster richColors />
    </StoreProvider>
  );
}

export default App;
