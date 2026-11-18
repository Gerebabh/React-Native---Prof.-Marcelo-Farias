import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { cores } from '../styles/colors';
import TelaPerfil from './TelaPerfil';

function iniciaisDoNome(nome) {
  return (nome || '?').trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toLocaleUpperCase('pt-BR');
}

export default function CabecalhoApp({ usuario, perfil, aoSair, aoAtualizarPerfil }) {
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const nome = perfil.nome || usuario.email;

  useEffect(() => {
    let ativo = true;
    AsyncStorage.getItem(`@pool_day/foto_perfil/${usuario.uid}`)
      .then((foto) => { if (ativo) setFotoPerfil(foto); })
      .catch(() => setFotoPerfil(null));
    return () => { ativo = false; };
  }, [usuario.uid]);

  function atualizarPerfil(perfilAtualizado) {
    aoAtualizarPerfil(perfilAtualizado);
  }

  return (
    <>
      <ImageBackground source={require('../assets/login-poolday-fundo.jpg')} resizeMode="cover" style={styles.fundo}>
        <View pointerEvents="none" style={styles.sobreposicao} />
        <View style={styles.conteudo}>
          <View style={styles.textos}>
            <Text style={styles.titulo}>Pool Day</Text>
            <Text style={styles.subtitulo}>Tratamento e visitas programadas</Text>
            <Text style={styles.infoConta} numberOfLines={1}>{perfil.nomeEmpresa} • {nome}</Text>
          </View>
          <View style={styles.acoes}>
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir meu perfil" onPress={() => setPerfilAberto(true)} style={({ pressed }) => [styles.botaoPerfil, pressed && styles.pressionado]}>
              {fotoPerfil ? <Image source={{ uri: fotoPerfil }} style={styles.fotoPerfil} /> : <Text style={styles.iniciais}>{iniciaisDoNome(nome)}</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={aoSair} style={({ pressed }) => [styles.botaoSair, pressed && styles.pressionado]}>
              <Text style={styles.textoSair}>Sair</Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
      <TelaPerfil
        visivel={perfilAberto}
        usuario={usuario}
        perfil={perfil}
        aoFechar={() => setPerfilAberto(false)}
        aoAtualizarPerfil={atualizarPerfil}
        aoAtualizarFoto={setFotoPerfil}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fundo: { justifyContent: 'center', minHeight: 126, width: '100%' },
  sobreposicao: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.18)' },
  conteudo: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16 },
  textos: { flex: 1, marginRight: 8 },
  titulo: { color: cores.branco, fontSize: 27, fontWeight: '700', textShadowColor: cores.azulEscuro, textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 6 },
  subtitulo: { color: cores.branco, fontSize: 13, marginTop: 1, textShadowColor: cores.azulEscuro, textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5 },
  infoConta: { color: cores.branco, fontSize: 11, marginTop: 7, textShadowColor: cores.azulEscuro, textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5 },
  acoes: { alignItems: 'center', flexDirection: 'column', gap: 9 },
  botaoPerfil: { alignItems: 'center', backgroundColor: cores.branco, borderColor: cores.branco, borderRadius: 24, borderWidth: 2, height: 46, justifyContent: 'center', overflow: 'hidden', width: 46 },
  fotoPerfil: { height: 42, width: 42 },
  iniciais: { color: cores.azulEscuro, fontSize: 14, fontWeight: '700' },
  botaoSair: { alignItems: 'center', backgroundColor: 'rgba(3, 30, 42, 0.72)', borderColor: 'rgba(255,255,255,0.9)', borderRadius: 12, borderWidth: 1, height: 40, justifyContent: 'center', paddingHorizontal: 14 },
  textoSair: { color: cores.branco, fontSize: 13, fontWeight: '700' },
  pressionado: { opacity: 0.75 },
});
