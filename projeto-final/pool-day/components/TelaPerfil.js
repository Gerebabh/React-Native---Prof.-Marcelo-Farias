import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { cores } from '../styles/colors';
import { atualizarNomePerfil } from '../services/firebase';

function chaveFoto(usuarioId) {
  return `@pool_day/foto_perfil/${usuarioId}`;
}

export default function TelaPerfil({ visivel, usuario, perfil, aoFechar, aoAtualizarPerfil, aoAtualizarFoto }) {
  const [nome, setNome] = useState(perfil.nome || '');
  const [foto, setFoto] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!visivel) return;
    setNome(perfil.nome || '');
    let ativo = true;
    AsyncStorage.getItem(chaveFoto(usuario.uid))
      .then((fotoSalva) => { if (ativo) setFoto(fotoSalva); })
      .catch(() => Alert.alert('Perfil', 'Não foi possível carregar a foto do perfil.'));
    return () => { ativo = false; };
  }, [visivel, usuario.uid, perfil.nome]);

  async function escolherFoto() {
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso às fotos para escolher uma imagem de perfil.');
        return;
      }
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      const uriSelecionada = resultado.assets?.[0]?.uri;
      if (resultado.canceled || !uriSelecionada) return;

      const fotoAnterior = await AsyncStorage.getItem(chaveFoto(usuario.uid));
      const destino = `${FileSystem.documentDirectory}perfil-${usuario.uid}-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uriSelecionada, to: destino });
      await AsyncStorage.setItem(chaveFoto(usuario.uid), destino);
      setFoto(destino);
      aoAtualizarFoto(destino);
      if (fotoAnterior && fotoAnterior.startsWith(FileSystem.documentDirectory || '\0')) {
        await FileSystem.deleteAsync(fotoAnterior, { idempotent: true }).catch(() => undefined);
      }
    } catch (_erro) {
      Alert.alert('Não foi possível atualizar a foto', 'Tente escolher a imagem novamente.');
    }
  }

  async function salvarPerfil() {
    const nomeAtualizado = nome.trim();
    if (!nomeAtualizado || nomeAtualizado.length > 100) {
      Alert.alert('Nome inválido', 'Informe um nome com até 100 caracteres.');
      return;
    }
    setCarregando(true);
    try {
      if (nomeAtualizado !== (perfil.nome || '')) {
        await atualizarNomePerfil(usuario.uid, perfil.empresaId, nomeAtualizado);
        aoAtualizarPerfil({ ...perfil, nome: nomeAtualizado });
      }
      Alert.alert('Perfil atualizado', 'Seus dados foram salvos.');
      aoFechar();
    } catch (erro) {
      Alert.alert('Não foi possível salvar', erro.code === 'permission-denied'
        ? 'O Firestore bloqueou a alteração do perfil. Atualize as regras do projeto.'
        : 'Confira sua conexão e tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={aoFechar}>
      <KeyboardAvoidingView style={styles.fundoModal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.cartao}>
          <Text style={styles.titulo}>Meu perfil</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Escolher foto do perfil" onPress={escolherFoto} style={styles.areaFoto}>
            {foto ? <Image source={{ uri: foto }} style={styles.foto} /> : <Text style={styles.iniciais}>{(nome.trim()[0] || '?').toLocaleUpperCase('pt-BR')}</Text>}
            <Text style={styles.linkFoto}>Alterar foto</Text>
          </Pressable>
          <Text style={styles.rotulo}>Nome</Text>
          <TextInput accessibilityLabel="Nome do usuário" value={nome} onChangeText={setNome} style={styles.campo} maxLength={100} />
          <Text style={styles.rotulo}>E-mail</Text>
          <Text style={styles.email}>{usuario.email}</Text>
          <View style={styles.acoes}>
            <Pressable accessibilityRole="button" onPress={aoFechar} disabled={carregando} style={styles.botaoCancelar}><Text style={styles.textoCancelar}>Cancelar</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={salvarPerfil} disabled={carregando} style={({ pressed }) => [styles.botaoSalvar, pressed && styles.pressionado]}>
              {carregando ? <ActivityIndicator color={cores.branco} /> : <Text style={styles.textoSalvar}>Salvar</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundoModal: { backgroundColor: cores.fundoModal, flex: 1, justifyContent: 'center', padding: 20 },
  cartao: { backgroundColor: cores.branco, borderRadius: 18, padding: 22 },
  titulo: { color: cores.azulEscuro, fontSize: 23, fontWeight: '700' },
  areaFoto: { alignItems: 'center', marginVertical: 20 },
  foto: { borderRadius: 42, height: 84, width: 84 },
  iniciais: { alignItems: 'center', backgroundColor: cores.azulClaro, borderRadius: 42, color: cores.azulEscuro, fontSize: 34, fontWeight: '700', height: 84, overflow: 'hidden', paddingTop: 20, textAlign: 'center', width: 84 },
  linkFoto: { color: cores.azulPiscina, fontSize: 14, fontWeight: '600', marginTop: 8 },
  rotulo: { color: cores.textoSecundario, fontSize: 13, fontWeight: '600', marginBottom: 5, marginTop: 12 },
  campo: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, color: cores.texto, fontSize: 16, paddingHorizontal: 12, paddingVertical: 11 },
  email: { color: cores.texto, fontSize: 15, paddingVertical: 10 },
  acoes: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 24 },
  botaoCancelar: { borderColor: cores.borda, borderRadius: 8, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 11 },
  textoCancelar: { color: cores.textoSecundario, fontSize: 14, fontWeight: '600' },
  botaoSalvar: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 8, justifyContent: 'center', minWidth: 92, paddingHorizontal: 18, paddingVertical: 11 },
  textoSalvar: { color: cores.branco, fontSize: 14, fontWeight: '700' },
  pressionado: { opacity: 0.78 },
});
