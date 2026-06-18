// Rozszerza statyczny app.json o konfigurację wymagającą zmiennych środowiskowych:
// klucz Google Maps (z env, żeby nie trzymać go w repo) oraz plugin/uprawnienia lokalizacji.
// Klucz ustaw w środowisku builda (np. eas.json -> env albo .env): GOOGLE_MAPS_API_KEY=...

const LOCATION_PERMISSION =
  'Blackout używa Twojej lokalizacji, aby pokazać Cię na mapie i pozwolić lootować pobliskie miejsca.';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export default ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: {
      ...config.ios?.config,
      googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      ...config.ios?.infoPlist,
      NSLocationWhenInUseUsageDescription: LOCATION_PERMISSION,
    },
  },
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: GOOGLE_MAPS_API_KEY,
      },
    },
    // Uprawnienia ACCESS_FINE/COARSE_LOCATION dodaje automatycznie plugin expo-location.
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-location',
      {
        locationWhenInUsePermission: LOCATION_PERMISSION,
      },
    ],
  ],
});
