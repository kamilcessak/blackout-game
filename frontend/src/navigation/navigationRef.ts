import { createNavigationContainerRef } from '@react-navigation/native';

import { RootStackParamList } from './types';

// Ref do nawigacji używany poza drzewem React (np. w interceptorze axios),
// żeby po wygaśnięciu tokena (401) wyrzucić gracza na ekran logowania.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const resetToLogin = () => {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
  }
};
