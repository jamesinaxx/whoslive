import { FunctionComponent, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { Global, ThemeProvider, Theme, css } from '@emotion/react';
import { getStorageLocal } from './lib/chromeapi';
import Themes from './theme';
import Main from './pages/main';

// TODO Add support for multiple pages of live streams
const App: FunctionComponent = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(Themes.light);
  const [themeLoaded, setThemeLoaded] = useState<boolean>(false);

  useEffect(() => {
    const updateTheme = async () => {
      const newTheme =
        Themes[(await getStorageLocal('NowLive:Theme')) || 'light'];

      setCurrentTheme(newTheme);
      setThemeLoaded(true);
    };

    updateTheme();
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && 'NowLive:Theme' in changes) {
        updateTheme();
      }
    });
  }, []);

  if (!themeLoaded) {
    return null;
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <Global
        styles={css`
          body::-webkit-scrollbar {
            width: 0.5em;
          }

          body::-webkit-scrollbar-thumb {
            background-color: ${currentTheme.colors.scrollbarColor};
            border-radius: 25px;
          }

          body {
            background-color: ${currentTheme.colors.backgroundColor};
            transition: background-color 100ms ease-in-out;
            color: ${currentTheme.colors.color};
            width: 550px;
            height: 550px;
          }
        `}
      />
      <Main />
    </ThemeProvider>
  );
};

if (!process.env.PRODUCTION) {
  import('./lib/chromeapi').then(({ getChannelInfo }) => getChannelInfo());
} else {
  document.oncontextmenu = (e) => e.preventDefault();
}

render(<App />, document.getElementById('root'));
