/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeDevSettings from '../NativeModules/specs/NativeDevSettings';
import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';

let DevSettings: {
  addMenuItem(title: string, handler: () => mixed): void,
  reload(reason?: string): void,
  onFastRefresh(): void,
} = {
  addMenuItem(title: string, handler: () => mixed): void {},
  reload(reason?: string): void {},
  onFastRefresh(): void {},
};

type DevSettingsEventDefinitions = {
  didPressMenuItem: [{title: string}],
};

if (__DEV__) {
  const emitter = new NativeEventEmitter<DevSettingsEventDefinitions>(
    NativeDevSettings,
  );
  const menuItems = new Map();

  DevSettings = {
    addMenuItem(title: string, handler: () => mixed): void {
      // Make sure items are not added multiple times. This can
      // happen when hot reloading the module that registers the
      // menu items. The title is used as the id which means we
      // don't support multiple items with the same name.
      const oldHandler = menuItems.get(title);
      if (oldHandler != null) {
        emitter.removeListener('didPressMenuItem', oldHandler);
      } else {
        NativeDevSettings.addMenuItem(title);
      }

      menuItems.set(title, handler);
      emitter.addListener('didPressMenuItem', event => {
        if (event.title === title) {
          handler();
        }
      });
    },
    reload(reason?: string): void {
      if (NativeDevSettings.reloadWithReason != null) {
        NativeDevSettings.reloadWithReason(reason ?? 'Uncategorized from JS');
      } else {
        NativeDevSettings.reload();
      }
    },
    onFastRefresh(): void {
      NativeDevSettings.onFastRefresh?.();
    },
  };
}

module.exports = DevSettings;
