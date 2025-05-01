import React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@nextui-org/react';
import { SunIcon, MoonIcon } from './icons/theme_toggle_icon';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, set_mounted] = React.useState(false);

  React.useEffect(() => {
    set_mounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      isIconOnly
      variant="light"
      aria-label="Toggle theme"
      className="text-kawaii-pink hover:text-accent-cyan transition-colors"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </Button>
  );
}; 