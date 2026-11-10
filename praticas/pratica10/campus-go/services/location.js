import * as Location from 'expo-location';

// Evita ficar esperando para sempre quando o GPS ou o endereço não respondem.
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export async function getCurrentPlace() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return null;
  if (!await Location.hasServicesEnabledAsync()) {
    throw new Error('Ative a localização do aparelho e tente novamente.');
  }
  let position;
  try {
    position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 15000);
  } catch {
    // Se o GPS demorar, usa a última posição conhecida do aparelho.
    position = await Location.getLastKnownPositionAsync();
    if (!position) throw new Error('Não foi possível obter sua localização agora. Tente novamente.');
  }
  const { latitude, longitude } = position.coords;
  let label = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  try {
    const [address] = await withTimeout(Location.reverseGeocodeAsync({ latitude, longitude }), 5000);
    if (address) {
      label = [address.street, address.streetNumber, address.district, address.city || address.subregion]
        .filter(Boolean).join(', ') || label;
    }
  } catch {
    // Sem endereço disponível, as coordenadas ainda identificam o lugar.
  }
  return { latitude, longitude, label };
}
