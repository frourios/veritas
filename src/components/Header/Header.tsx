'use client';

import { useEffect, useState } from 'react';
import { APP_NAME } from 'src/constants';
import styles from './Header.module.css';

export function Header(): React.ReactElement {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'system' | 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    function updateResolvedTheme(): void {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        setResolvedTheme(systemTheme);
      } else {
        setResolvedTheme(theme);
      }
    }

    updateResolvedTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      mediaQuery.addEventListener('change', updateResolvedTheme);

      return function (): void {
        mediaQuery.removeEventListener('change', updateResolvedTheme);
      };
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  function cycleTheme(): void {
    const themeOrder: ('system' | 'light' | 'dark')[] = ['system', 'light', 'dark'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  }

  function getThemeIcon(): string {
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? '🌙' : '☀️';
    }
    return theme === 'dark' ? '🌙' : '☀️';
  }

  function getThemeLabel(): string {
    if (theme === 'system') return 'System';
    return theme === 'dark' ? 'Dark' : 'Light';
  }

  return (
    <header className={styles.header}>
      <a href="/" className={styles.logo}>
        {APP_NAME}
      </a>
      <div className={styles.rightSection}>
        <a href="/about" className={styles.aboutLink}>
          ABOUT
        </a>
        <button
          onClick={cycleTheme}
          className={styles.themeToggle}
          type="button"
          title={`Current: ${getThemeLabel()}`}
          aria-label={`Switch theme. Current: ${getThemeLabel()}`}
        >
          {getThemeIcon()}
        </button>
      </div>
    </header>
  );
}
