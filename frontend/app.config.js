// Rozszerza statyczny app.json o konfigurację wymagającą zmiennych środowiskowych:
// klucz Google Maps (z env, żeby nie trzymać go w repo) oraz plugin/uprawnienia lokalizacji.
// Klucz ustaw w środowisku builda (np. eas.json -> env albo .env): GOOGLE_MAPS_API_KEY=...
//
// Uwaga: klucz Maps podajemy przez config plugin `react-native-maps`, a NIE przez
// ios.config.googleMapsApiKey / android.config.googleMaps.apiKey. Wbudowany w Expo
// plugin map jest pisany pod react-native-maps 1.20.x i na 1.27.x wstrzykuje do
// Podfile nieistniejący `pod 'react-native-google-maps'` (pod install się wywala).
// Własny plugin biblioteki wstawia poprawny `pod 'react-native-maps/Google'`.

const LOCATION_PERMISSION =
  'Blackout używa Twojej lokalizacji, aby pokazać Cię na mapie i pozwolić lootować pobliskie miejsca.';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export default ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    infoPlist: {
      ...config.ios?.infoPlist,
      NSLocationWhenInUseUsageDescription: LOCATION_PERMISSION,
    },
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-location',
      {
        locationWhenInUsePermission: LOCATION_PERMISSION,
      },
    ],
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: GOOGLE_MAPS_API_KEY,
        iosGoogleMapsApiKey: GOOGLE_MAPS_API_KEY,
      },
    ],
  ],
});
