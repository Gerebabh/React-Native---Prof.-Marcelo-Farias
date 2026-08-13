import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Olá Geraldo!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Minha primeira prática</ThemedText>
        <ThemedText>Meu app React Native com Expo está rodando no celular.</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Passo 2: Explorar</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Toque na aba Explorar para saber mais sobre o que está incluído neste aplicativo inicial.`}
        </ThemedText>
      </ThemedView>
<ThemedView style={styles.stepContainer}>
    <ThemedText type="subtitle">Passo 3: Recomece do zero</ThemedText>

    <ThemedText>
      Quando estiver pronto, execute{' '}
      <ThemedText type="defaultSemiBold">
        npm run reset-project
      </ThemedText>{' '}
      para começar do zero com um novo diretório{' '}
      <ThemedText type="defaultSemiBold">app</ThemedText>. Isso moverá o diretório{' '}
      <ThemedText type="defaultSemiBold">app</ThemedText> atual para{' '}
      <ThemedText type="defaultSemiBold">app-example</ThemedText>.
    </ThemedText>
  </ThemedView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
