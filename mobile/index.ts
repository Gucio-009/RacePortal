/**
 * Punkt wejścia aplikacji Expo / React Native (RacePortal mobile).
 *
 * Rola w architekturze: rejestruje komponent główny w AppRegistry — wspólny
 * bootstrap dla Expo Go, buildów natywnych (dev client / EAS) oraz Expo web.
 * Bez tego kroku silnik RN nie wie, który drzewo React renderować.
 *
 * Technologie: Expo (`registerRootComponent`), React Native AppRegistry.
 *
 * Pomysł (alt): React Native CLI bez Expo (`index.js` + `AppRegistry.registerComponent`);
 * Flutter (`main.dart` + `runApp`); Expo Router z folderem `app/` zamiast ręcznego entry.
 */
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent wywołuje AppRegistry.registerComponent('main', () => App)
// i ustawia środowisko tak, by działało zarówno w Expo Go, jak i w natywnym buildzie.
registerRootComponent(App);
