// SDK 54's create-expo-app no longer ships an index.ts even though
// package.json declares `"main": "index.ts"`. Without this file, the
// "Bundle React Native code and images" build phase fails with
// `Unable to resolve module .../index.ts` and the resulting .app
// has no main.jsbundle. See:
// https://github.com/ehab180hb/expo-sdk54-ios-repro README + skill
// `expo-sdk54-rn081-setup`.
import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
