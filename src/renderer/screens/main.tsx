import { Terminal } from 'lucide-react';
import { useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/renderer/components/ui/alert';
import { useTranslation } from 'react-i18next';

// The "App" comes from the context bridge in preload/index.ts
const { App } = window;

export function MainScreen() {
  const { t } = useTranslation();

  useEffect(() => {
    // check the console on dev tools
    App.sayHelloFromBridge();
  }, []);

  const userName = App.username || 'there';

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-black">
      <Alert className="mt-5 bg-transparent border-transparent text-accent w-fit">
        <AlertTitle className="text-5xl text-muted">Hi, {userName}!</AlertTitle>

        <AlertDescription className="flex items-center gap-2 text-lg">
          <Terminal className="size-6 text-fuchsia-300" />

          <span className="text-gray-400">{t('main.greet')}</span>
          <span className="text-primary">302AI</span>
        </AlertDescription>
      </Alert>
    </main>
  );
}
