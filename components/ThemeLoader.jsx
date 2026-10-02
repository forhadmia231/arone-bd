'use client';

import { useEffect, useState } from 'react';

const defaults = {
  primaryColor: '#235b37',
  primaryDarkColor: '#173f29',
  primaryLightColor: '#edf4e8',
};

export default function ThemeLoader() {
  const [theme, setTheme] = useState(defaults);

  useEffect(() => {
    let active = true;

    fetch('/api/theme', {
      cache: 'no-store',
    })
      .then((response) =>
        response.ok ? response.json() : null
      )
      .then((data) => {
        if (active && data?.theme) {
          setTheme({
            ...defaults,
            ...data.theme,
          });
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const css = `
    :root {
      --green: ${theme.primaryColor};
      --green-dark: ${theme.primaryDarkColor};
      --green-light: ${theme.primaryLightColor};
    }

    .arh-header {
      --arh-green: ${theme.primaryColor} !important;
      --arh-dark: ${theme.primaryDarkColor} !important;
      --arh-light: ${theme.primaryLightColor} !important;
    }

    footer.abg-footer {
      background: ${theme.primaryDarkColor} !important;
    }
  `;

  return <style>{css}</style>;
}
