import { clientId } from './lib';
import { error } from './logger';
import type { Local, Synced } from '../types/chrome';
import type { TwitchStream } from '../types/twitch';

export function setStorage(key: Synced, value: any): Promise<void> {
  return chrome.storage.sync.set({ [key]: value });
}

export function getStorage(
  key: 'NowLive:Favorites',
): Promise<string[] | undefined>;
export function getStorage(key: 'NowLive:Token'): Promise<string | undefined>;
export function getStorage<T>(key: Synced): Promise<T | undefined> {
  return new Promise(resolve =>
    chrome.storage.sync.get(key, res => resolve(res[key])),
  );
}

export function setStorageLocal(key: Local, value: any): Promise<void> {
  return chrome.storage.local.set({ [key]: value });
}

export function getStorageLocal(
  key: 'NowLive:Channels',
): Promise<TwitchStream[] | undefined>;
export function getStorageLocal(key: 'NowLive:Theme'): Promise<string>;
export function getStorageLocal<T>(key: Local): Promise<T> {
  return new Promise(resolve =>
    chrome.storage.local.get(key, res => resolve(res[key])),
  );
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  const reader = new FileReader();
  return new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export async function getChannelInfo(): Promise<void> {
  const token = await getStorage('NowLive:Token');
  if (!token) {
    await chrome.action.setTitle({
      title: `Please verify Now Live`,
    });
    await chrome.action.setBadgeText({ text: '' });
    return;
  }
  try {
    const userId = (
      await (
        await fetch('https://api.twitch.tv/helix/users', {
          headers: {
            'Client-Id': clientId,
            Authorization: `Bearer ${token}`,
          },
        })
      ).json()
    ).data[0].id;

    const { data }: { data: TwitchStream[] } = await (
      await fetch(
        `https://api.twitch.tv/helix/streams/followed?user_id=${userId}`,
        {
          headers: {
            'Client-Id': clientId,
            Authorization: `Bearer ${token}`,
          },
        },
      )
    ).json();

    // Downloads the images and converts them into a base64 url
    const withImages = await Promise.all(
      data.map(async stream => {
        const blob = await (
          await fetch(
            stream.thumbnail_url
              .replace('{width}', '128')
              .replace('{height}', '72'),
          )
        ).blob();

        const withImage: TwitchStream = {
          ...stream,
          thumbnail_url: await blobToBase64(blob),
        };

        return withImage;
      }),
    );

    const streamingNow = Number(data.length.toString());

    if (streamingNow !== 0) {
      await chrome.action.setTitle({
        title: `There are ${streamingNow} people streaming right now`,
      });
      await chrome.action.setBadgeText({
        text: streamingNow.toString(),
      });
    } else {
      await chrome.action.setTitle({
        title: `There is nobody streaming right now`,
      });
      await chrome.action.setBadgeText({ text: '' });
    }

    await setStorageLocal('NowLive:Channels', withImages);
  } catch (err) {
    error(err);
  }
}
