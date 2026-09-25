import { Platform } from 'react-native';

export type Theme = ReturnType<typeof makeTheme>;
export type ThemePreference = 'system' | 'light' | 'dark';

export function makeTheme(dark: boolean) {
  return {
    dark,
    background: dark ? '#171b1b' : '#f7f5ef',
    surface: dark ? '#222827' : '#fffdf8',
    surfaceAlt: dark ? '#29312e' : '#eeeae0',
    ink: dark ? '#f2eee3' : '#26312d',
    muted: dark ? '#a3ada6' : '#78817a',
    accent: dark ? '#b5c7a3' : '#536c59',
    accentSoft: dark ? '#35463a' : '#e5ece2',
    line: dark ? '#3b4440' : '#e7e4da',
    danger: dark ? '#e4a89d' : '#a84f45',
    gold: dark ? '#d8bd8a' : '#a68149',
  };
}

export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
