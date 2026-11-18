import { cores } from '../styles/colors';
import { Alert, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { baixarFotoVisita } from '../services/fotosVisita';

const statusDisponiveis = ['Executada', 'Frustrada', 'Não realizada'];

export default function VisitasLista({ visitas, tokenFotos, fotoEnviando, onAddPhoto, onCheckIn, onRegisterDeparture, onChangeStatus, onConfirmConclusion, onChangeJustificativa }) {
  if (visitas.length === 0) {
    return <Text style={styles.vazio}>Nenhuma visita programada.</Text>;
  }

  const visitasEmAberto = visitas.filter((item) => item.status !== 'Executada');
  const visitasConcluidas = visitas.filter((item) => item.status === 'Executada');

  return (
    <View>
      {visitasEmAberto.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma visita programada.</Text>
      ) : (
        <FlatList
          data={visitasEmAberto}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => <VisitaCartao item={item} tokenFotos={tokenFotos} fotoEnviando={fotoEnviando} onAddPhoto={onAddPhoto} onCheckIn={onCheckIn} onRegisterDeparture={onRegisterDeparture} onChangeStatus={onChangeStatus} onConfirmConclusion={onConfirmConclusion} onChangeJustificativa={onChangeJustificativa} />}
        />
      )}
      {visitasConcluidas.length > 0 && (
        <>
          <Text style={styles.tituloConcluidas}>Visitas concluídas</Text>
          <FlatList
            data={visitasConcluidas}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => <VisitaCartao item={item} tokenFotos={tokenFotos} fotoEnviando={fotoEnviando} onAddPhoto={onAddPhoto} onCheckIn={onCheckIn} onRegisterDeparture={onRegisterDeparture} onChangeStatus={onChangeStatus} onConfirmConclusion={onConfirmConclusion} onChangeJustificativa={onChangeJustificativa} />}
          />
        </>
      )}
    </View>
  );
}

function VisitaCartao({ item, tokenFotos, fotoEnviando, onAddPhoto, onCheckIn, onRegisterDeparture, onChangeStatus, onConfirmConclusion, onChangeJustificativa }) {
  const [motivo, setMotivo] = useState(item.justificativa || '');
  const [motivoSalvo, setMotivoSalvo] = useState(Boolean(item.justificativa));
  const statusAtual = item.status || 'Pendente';
  const precisaJustificativa = statusAtual === 'Frustrada' || statusAtual === 'Não realizada';

  function salvarJustificativa() {
    if (!motivo.trim()) {
      Alert.alert('Motivo necessário', 'Escreva o motivo antes de salvar a justificativa.');
      return;
    }

    onChangeJustificativa(item.id, motivo.trim());
    setMotivoSalvo(true);
  }

  return (
    <View style={styles.cartao}>
      <Text style={styles.data}>{item.data}</Text>
      <Text style={styles.orientacao}>{item.local}</Text>
      <Text style={styles.servico}>{item.servico}</Text>
      {item.tratadorNome ? <Text style={styles.tratador}>Tratador: {item.tratadorNome}</Text> : null}
      {item.orientacao ? <Text style={styles.orientacao}>{item.orientacao}</Text> : null}
      {item.horarioChegada ? (
        <>
          <Text style={styles.registroChegada}>Horário de chegada: {new Date(item.horarioChegada).toLocaleString('pt-BR')}</Text>
          <Text style={styles.registroChegada}>Endereço da chegada: {item.enderecoChegada || `${item.latitude.toFixed(2)}, ${item.longitude.toFixed(2)}`}</Text>
        </>
      ) : statusAtual !== 'Executada' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Estou aqui"
          onPress={() => onCheckIn(item.id)}
          style={({ pressed }) => [styles.botaoChegada, pressed && styles.pressionado]}
        >
          <Text style={styles.textoBotaoChegada}>Estou aqui</Text>
        </Pressable>
      ) : null}
      <View style={styles.secaoFotos}>
        <Text style={styles.tituloFotos}>Fotos do atendimento</Text>
        <FotoEtapa
          titulo="Antes do atendimento"
          textoVazio="Nenhuma foto antes anexada."
          acessibilidade="Foto antes do atendimento"
          foto={item.fotoAntes}
          visitaId={item.id}
          campoFoto="fotoAntes"
          token={tokenFotos}
          enviando={fotoEnviando === `${item.id}-fotoAntes`}
          bloqueada={statusAtual === 'Executada'}
          onPress={() => onAddPhoto(item.id, 'fotoAntes')}
        />
        <FotoEtapa
          titulo="Depois do atendimento"
          textoVazio="Nenhuma foto depois anexada."
          acessibilidade="Foto depois do atendimento"
          observacao={item.servico === 'Aspiração - Liberar o uso' ? 'Obrigatória para registrar a saída.' : 'Opcional para este serviço.'}
          foto={item.fotoDepois}
          visitaId={item.id}
          campoFoto="fotoDepois"
          token={tokenFotos}
          enviando={fotoEnviando === `${item.id}-fotoDepois`}
          bloqueada={statusAtual === 'Executada'}
          onPress={() => onAddPhoto(item.id, 'fotoDepois')}
        />
      </View>
      {item.horarioChegada && (
        item.horarioSaida ? (
          <Text style={styles.registroSaida}>Horário de saída: {new Date(item.horarioSaida).toLocaleString('pt-BR')}</Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Registrar saída"
            onPress={() => onRegisterDeparture(item.id)}
            style={({ pressed }) => [styles.botaoSaida, pressed && styles.pressionado]}
          >
            <Text style={styles.textoBotaoChegada}>Registrar saída</Text>
          </Pressable>
        )
      )}
      <Text style={styles.status}>Status: {statusAtual}</Text>
      {statusAtual === 'Executada' && Number(item.custoTotalProdutos) > 0 && (
        <Text style={styles.custoProdutos}>Gasto com produtos: {formatarMoeda(item.custoTotalProdutos)}</Text>
      )}
      {precisaJustificativa && (
        <>
          <TextInput
            accessibilityLabel="Motivo da visita"
            style={styles.campoMotivo}
            placeholder="Explique por que a visita não foi realizada"
            value={motivo}
            onChangeText={(texto) => { setMotivo(texto); setMotivoSalvo(false); }}
            multiline
          />
          <Pressable
            accessibilityRole="button"
            onPress={salvarJustificativa}
            style={({ pressed }) => [styles.botaoSalvar, pressed && styles.pressionado]}
          >
            <Text style={styles.textoBotaoSalvar}>Salvar justificativa</Text>
          </Pressable>
          {motivoSalvo && <Text style={styles.confirmacao}>Justificativa registrada.</Text>}
        </>
      )}
      {statusAtual === 'Executada' ? (
        <Text style={styles.confirmacaoConcluida}>✓ Visita concluída</Text>
      ) : (
        <View style={styles.acoesStatus}>
          {statusDisponiveis.map((status) => (
            <Pressable
              key={status}
              accessibilityRole="button"
              accessibilityLabel={`Marcar visita como ${status}`}
              accessibilityState={{ selected: item.status === status }}
              onPress={() => status === 'Executada' ? onConfirmConclusion(item.id) : onChangeStatus(item.id, status)}
              style={({ pressed }) => [
                styles.botaoStatus,
                item.status === status && styles.statusSelecionado,
                pressed && styles.pressionado,
              ]}
            >
              <Text style={[
                styles.textoStatus,
                item.status === status && styles.textoStatusSelecionado,
              ]}>{status}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function FotoEtapa({ titulo, textoVazio, acessibilidade, observacao, foto, visitaId, campoFoto, token, enviando, bloqueada, onPress }) {
  const [erroImagem, setErroImagem] = useState(false);
  const [uriImagem, setUriImagem] = useState('');
  const [mostrarFotoAmpliada, setMostrarFotoAmpliada] = useState(false);
  const etapa = titulo.startsWith('Antes') ? 'antes' : 'depois';
  const temFoto = Boolean(foto?.arquivoId);
  const endereco = foto?.endereco || (foto ? `${foto.latitude}, ${foto.longitude}` : '');

  useEffect(() => {
    let ativo = true;
    setErroImagem(false);
    setUriImagem('');
    if (!temFoto || !token) return () => { ativo = false; };

    baixarFotoVisita(visitaId, campoFoto, foto.arquivoId, token)
      .then((uri) => { if (ativo) setUriImagem(uri); })
      .catch((erro) => {
        if (!ativo) return;
        setErroImagem(true);
        if (__DEV__) console.warn('Falha ao carregar foto protegida da visita:', erro?.message || 'sem-detalhe');
      });

    return () => { ativo = false; };
  }, [campoFoto, foto?.arquivoId, temFoto, token, visitaId]);

  return (
    <View style={styles.itemFoto}>
      <Text style={styles.tituloEtapaFoto}>{titulo}</Text>
      {temFoto && token ? (
        erroImagem ? (
          <Text style={styles.fotoVazia}>Não foi possível carregar a foto. Confira a conexão e recarregue a tela.</Text>
        ) : uriImagem ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ampliar ${acessibilidade}`}
              onPress={() => setMostrarFotoAmpliada(true)}
              style={styles.toqueImagem}
            >
              <Image
                accessibilityLabel={acessibilidade}
                source={{ uri: uriImagem }}
                resizeMode="contain"
                style={styles.imagemFoto}
                onLoad={() => setErroImagem(false)}
                onError={(evento) => {
                  setErroImagem(true);
                  if (__DEV__) console.warn('Falha ao carregar foto protegida da visita:', evento?.nativeEvent?.error || 'sem-detalhe');
                }}
              />
            </Pressable>
            <Modal
              visible={mostrarFotoAmpliada}
              transparent
              animationType="fade"
              onRequestClose={() => setMostrarFotoAmpliada(false)}
            >
              <View style={styles.fotoAmpliadaFundo}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fechar foto ampliada"
                  onPress={() => setMostrarFotoAmpliada(false)}
                  style={styles.botaoFecharFoto}
                >
                  <Text style={styles.textoFecharFoto}>Fechar</Text>
                </Pressable>
                <Image
                  accessibilityLabel={`${acessibilidade} ampliada`}
                  source={{ uri: uriImagem }}
                  resizeMode="contain"
                  style={styles.imagemAmpliada}
                />
              </View>
            </Modal>
          </>
        ) : <Text style={styles.fotoVazia}>Carregando foto…</Text>
      ) : (
        <Text style={styles.fotoVazia}>{temFoto ? 'Carregando acesso à foto…' : textoVazio}</Text>
      )}
      {foto?.capturadaEm ? <Text style={styles.metadadoFoto}>Registro do aparelho: {new Date(foto.capturadaEm).toLocaleString('pt-BR')}</Text> : null}
      {foto?.enviadaEm ? <Text style={styles.metadadoFoto}>Recebida pelo servidor: {new Date(foto.enviadaEm).toLocaleString('pt-BR')}</Text> : null}
      {endereco ? <Text style={styles.metadadoFoto}>Local registrado pelo aparelho: {endereco}</Text> : null}
      {observacao && <Text style={styles.observacaoFoto}>{observacao}</Text>}
      {!bloqueada && <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${temFoto ? 'Alterar' : 'Adicionar'} foto ${etapa}`}
          accessibilityState={{ disabled: enviando }}
          disabled={enviando}
          onPress={onPress}
          style={({ pressed }) => [styles.botaoFoto, (pressed || enviando) && styles.pressionado]}
        >
          <Text style={styles.textoBotaoFoto}>{enviando ? 'Enviando foto…' : temFoto ? `Alterar foto ${etapa}` : `Adicionar foto ${etapa}`}</Text>
        </Pressable>}
    </View>
  );
}

function formatarMoeda(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

const styles = StyleSheet.create({
  vazio: { color: cores.textoSecundario, fontSize: 15, marginTop: 8 },
  cartao: { backgroundColor: cores.branco, borderRadius: 10, marginTop: 10, padding: 16 },
  data: { color: cores.textoSecundario, fontSize: 14 },
  servico: { color: cores.azulEscuro, fontSize: 17, fontWeight: '600', marginTop: 4 },
  tratador: { color: cores.textoSecundario, fontSize: 14, marginTop: 5 },
  orientacao: { color: cores.textoSecundario, fontSize: 15, marginTop: 6 },
  status: { color: cores.texto, fontSize: 15, fontWeight: '600', marginTop: 12 },
  acoesStatus: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  botaoStatus: { borderColor: cores.borda, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  statusSelecionado: { backgroundColor: cores.azulEscuro, borderColor: cores.azulEscuro },
  textoStatus: { color: cores.azulEscuro, fontSize: 13, fontWeight: '600' },
  textoStatusSelecionado: { color: cores.branco },
  pressionado: { opacity: 0.75 },
  campoMotivo: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, fontSize: 15, marginTop: 10, minHeight: 68, padding: 10, textAlignVertical: 'top' },
  tituloConcluidas: { color: cores.azulEscuro, fontSize: 17, fontWeight: '600', marginTop: 20 },
  botaoSalvar: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 8, marginTop: 8, padding: 11 },
  textoBotaoSalvar: { color: cores.branco, fontSize: 14, fontWeight: '600' },
  confirmacao: { color: cores.verde, fontSize: 14, fontWeight: '600', marginTop: 8 },
  confirmacaoConcluida: { color: cores.verde, fontSize: 15, fontWeight: '700', marginTop: 12 },
  botaoChegada: { alignItems: 'center', backgroundColor: cores.azulEscuro, borderRadius: 8, marginTop: 12, padding: 11 },
  textoBotaoChegada: { color: cores.branco, fontSize: 15, fontWeight: '600' },
  registroChegada: { color: cores.verde, fontSize: 14, fontWeight: '600', marginTop: 8 },
  custoProdutos: { color: cores.azulEscuro, fontSize: 14, fontWeight: '600', marginTop: 6 },
  secaoFotos: { backgroundColor: cores.fundoCartao, borderRadius: 8, marginTop: 12, padding: 12 },
  tituloFotos: { color: cores.azulEscuro, fontSize: 16, fontWeight: '600', marginBottom: 8 },
  itemFoto: { borderTopColor: cores.borda, borderTopWidth: 1, marginTop: 8, paddingTop: 8 },
  tituloEtapaFoto: { color: cores.texto, fontSize: 14, fontWeight: '600' },
  fotoVazia: { color: cores.textoSecundario, fontSize: 13, marginTop: 6 },
  metadadoFoto: { color: cores.textoSecundario, fontSize: 12, marginTop: 5 },
  toqueImagem: { backgroundColor: cores.fundoCartao, borderRadius: 8, height: 170, marginTop: 8, overflow: 'hidden', width: '100%' },
  imagemFoto: { height: '100%', width: '100%' },
  fotoAmpliadaFundo: { backgroundColor: 'rgba(0, 0, 0, 0.94)', flex: 1, justifyContent: 'center' },
  botaoFecharFoto: { alignSelf: 'flex-end', marginRight: 20, marginTop: 38, padding: 12 },
  textoFecharFoto: { color: cores.branco, fontSize: 16, fontWeight: '600' },
  imagemAmpliada: { flex: 1, marginBottom: 24, width: '100%' },
  botaoFoto: { alignItems: 'center', backgroundColor: cores.azulEscuro, borderRadius: 8, marginTop: 8, padding: 10 },
  textoBotaoFoto: { color: cores.branco, fontSize: 14, fontWeight: '600' },
  observacaoFoto: { color: cores.textoSecundario, fontSize: 12, marginTop: 4 },
  botaoSaida: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 8, marginTop: 12, padding: 11 },
  registroSaida: { color: cores.verde, fontSize: 14, fontWeight: '600', marginTop: 12 },
});
