import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes } from '../../constants/theme';
import { pickImage, saveProfilePhoto, takePhoto } from '../../services/media';
import ActionButton from '../../components/ActionButton';

const PHOTO_KEY = '@profile-photo';

export default function Profile() {
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [photoUri, setPhotoUri] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadPhoto() {
      setIsLoading(true);
      setLoadError(false);
      try {
        const savedUri = await AsyncStorage.getItem(PHOTO_KEY);
        if (active) setPhotoUri(savedUri);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadPhoto();
    return () => { active = false; };
  }, [retry]);

  async function handlePhoto(fromCamera) {
    setIsChanging(true);
    try {
      const selectedUri = fromCamera ? await takePhoto() : await pickImage();
      if (!selectedUri) return;
      const savedUri = saveProfilePhoto(selectedUri);
      await AsyncStorage.setItem(PHOTO_KEY, savedUri);
      setPhotoUri(savedUri);
    } catch {
      Alert.alert('Foto de perfil', 'Não foi possível salvar sua foto. Tente novamente.');
    } finally {
      setIsChanging(false);
    }
  }

  const disabled = isLoading || isChanging || loadError;

  return <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.screen}>
    <Text style={[styles.title, { color: colors.text }]}>Meu perfil</Text>
    <View style={styles.photoArea}>
      <Pressable onPress={() => handlePhoto(false)} disabled={disabled} accessibilityRole="button"
        accessibilityLabel="Escolher foto da galeria" accessibilityState={{ disabled }}
        style={({ pressed }) => [styles.avatar, { backgroundColor: colors.surface }, pressed && { opacity: 0.6 }]}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.avatar}
          onError={() => { setPhotoUri(null); Alert.alert('Foto indisponível', 'Escolha novamente uma foto na galeria.'); }} />
          : <Ionicons name="person-outline" size={64} color={colors.secondary} />}
      </Pressable>
      <Text style={{ color: colors.secondary }}>Toque no avatar para escolher uma foto.</Text>
    </View>
    {(isLoading || isChanging) && <ActivityIndicator color={colors.primary} />}
    {loadError && <View style={styles.error}>
      <Text style={{ color: colors.error }}>Não foi possível carregar a foto salva.</Text>
      <ActionButton title="Tentar novamente" onPress={() => setRetry(value => value + 1)} />
    </View>}
    <ActionButton title="Tirar foto" onPress={() => handlePhoto(true)} disabled={disabled} />
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { padding: 20, paddingBottom: 40, gap: 20 },
  title: { fontSize: 24, fontWeight: '600' },
  photoArea: { alignItems: 'center', gap: 16, paddingVertical: 16 },
  avatar: { width: 144, height: 144, borderRadius: 72, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  error: { gap: 12 },
});
