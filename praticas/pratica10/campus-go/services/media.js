import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';

export function saveProfilePhoto(uri) {
  const photo = new File(uri);
  const savedPhoto = new File(Paths.document, 'profile-photo-' + Date.now() + '.jpg');
  if (savedPhoto.exists) savedPhoto.delete();
  photo.copy(savedPhoto);
  return savedPhoto.uri;
}

export async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  return result.canceled ? null : result.assets[0].uri;
}

export async function takePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permissão da câmera', 'Permita o acesso à câmera para tirar sua foto.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir ajustes', onPress: () => Linking.openSettings().catch(() => {
        Alert.alert('Ajustes', 'Abra as configurações do aparelho e confira a permissão da câmera.');
      }) },
    ]);
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  return result.canceled ? null : result.assets[0].uri;
}
