import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: Check if user is authenticated
  const isAuthenticated = true;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/search/index" />;
  }

  return <Redirect href="/(auth)/login" />;
}
