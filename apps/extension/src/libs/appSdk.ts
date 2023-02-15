import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { EventEmitter } from '@tonkeeper/core/dist/entries/eventEmitter';
import copyToClipboard from 'copy-to-clipboard';
import browser from 'webextension-polyfill';
import packageJson from '../../package.json';
import { checkForError } from './utils';

export class ExtensionAppSdk implements IAppSdk {
  copyToClipboard = (value: string, notification?: string) => {
    copyToClipboard(value);
    this.uiEvents.emit('copy', {
      method: 'copy',
      params: notification,
    });
  };
  openPage = (url: string) => {
    return new Promise((resolve, reject) => {
      browser.tabs.create({ url }).then((newTab) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(newTab);
      });
    });
  };

  uiEvents = new EventEmitter();
  version = packageJson.version ?? 'Unknown';

  static openTab(options: browser.Tabs.CreateCreatePropertiesType) {
    return new Promise((resolve, reject) => {
      browser.tabs.create(options).then((newTab) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(newTab);
      });
    });
  }

  closeExtensionInBrowser = () => {
    window.close();
  };

  openExtensionInBrowser = async (
    route: string | null = null,
    queryString: string | null = null
  ) => {
    let extensionURL = browser.runtime.getURL('index.html');

    if (route) {
      extensionURL += `#${route}`;
    }

    if (queryString) {
      extensionURL += `${queryString}`;
    }

    await ExtensionAppSdk.openTab({ url: extensionURL });

    window.close();
  };
}
