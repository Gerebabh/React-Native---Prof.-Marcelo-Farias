import { cores } from '../styles/colors';
import { Alert, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { baixarFotoVisita } from '../services/fotosVisita';
import { normalizarPh } from '../services/calculadoraProdutos';

const statusDisponiveis = ['Executada', 'Frustrada', 'Não realizada'];

export default function VisitasLista({ visitas, tokenFotos, fotoEnviando, onAddPhoto, onCheckIn, onRegisterDeparture, onChangeStatus, onConfirmConclusion, onChangeJustificativa, onSalvarPh = async () => false }) {
  const [visitaAbertaId, setVisitaAbertaId] = useState(null);
  const visitasOrdenadas = ordenarVisitasPorData(visitas || [], 'desc');

  if (visitasOrdenadas.length === 0) {
    return <Text style={styles.vazio}>Nenhuma visita programada.</Text>;
  }

  const visitasEmAberto = ordenarVisitasPorData(
    visitasOrdenadas.filter((item) => item.status !== 'Executada'),
    'asc'
  );
  const visitasConcluidas = visitasOrdenadas.filter((item) => item.status === 'Executada');

  function renderizarVisita(item) {
    return (
      <VisitaCartao
        item={item}
        expandida={visitaAbertaId === item.id}
        onAlternar={() => setVisitaAbertaId((atual) => atual === item.id ? null : item.id)}
        tokenFotos={tokenFotos}
        fotoEnviando={fotoEnviando}
        onAddPhoto={onAddPhoto}
        onCheckIn={onCheckIn}
        onRegisterDeparture={onRegisterDeparture}
        onChangeStatus={onChangeStatus}
        onConfirmConclusion={onConfirmConclusion}
        onChangeJustificativa={onChangeJustificativa}
        onSalvarPh={onSalvarPh}
      />
    );
  }

  return (
    <View>
      {visitasEmAberto.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma visita programada.</Text>
      ) : (
        <FlatList
          data={visitasEmAberto}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => renderizarVisita(item)}
        />
      )}
      {visitasConcluidas.length > 0 && (
        <>
          <Text style={styles.tituloConcluidas}>Visitas concluídas</Text>
          <FlatList
            data={visitasConcluidas}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => renderizarVisita(item)}
          />
        </>
      )}
    </View>
  );
}

function ordenarVisitasPorData(visitas, ordem = 'desc') {
  return [...visitas].sort((a, b) => {
    const dataA = converterDataParaOrdenacao(a.data);
    const dataB = converterDataParaOrdenacao(b.data);
    if (dataA === null && dataB !== null) return 1;
    if (dataB === null && dataA !== null) return -1;
    return ordem === 'asc' ? (dataA || 0) - (dataB || 0) : (dataB || 0) - (dataA || 0);
  });
}

function converterDataParaOrdenacao(valor) {
  const partes = String(valor || '').split('/').map(Number);
  if (partes.length !== 3 || partes.some((parte) => !parte)) return null;
  const [dia, mes, ano] = partes;
  const data = new Date(ano, mes - 1, dia);
  if (data.getDate() !== dia || data.getMonth() !== mes - 1 || data.getFullYear() !== ano) return null;
  return data.getTime();
}

function VisitaCartao({ item, expandida, onAlternar, tokenFotos, fotoEnviando, onAddPhoto, onCheckIn, onRegisterDeparture, onChangeStatus, onConfirmConclusion, onChangeJustificativa, onSalvarPh }) {
  const [motivo, setMotivo] = useState(item.justificativa || '');
  const [motivoSalvo, setMotivoSalvo] = useState(Boolean(item.justificativa));
  const [phTexto, setPhTexto] = useState(item.phMedido == null ? '' : String(item.phMedido).replace('.', ','));
  const [phSalvo, setPhSalvo] = useState(item.phMedido != null);
  const statusAtual = item.status || 'Pendente';
  const precisaJustificativa = statusAtual === 'Frustrada' || statusAtual === 'Não realizada';

  useEffect(() => {
    setPhTexto(item.phMedido == null ? '' : String(item.phMedido).replace('.', ','));
    setPhSalvo(item.phMedido != null);
  }, [item.phMedido]);

  function salvarJustificativa() {
    if (!motivo.trim()) {
      Alert.alert('Motivo necessário', 'Escreva o motivo antes de salvar a justificativa.');
      return;
    }

    onChangeJustificativa(item.id, motivo.trim());
    setMotivoSalvo(true);
  }

  async function salvarPhMedido() {
    const ph = normalizarPh(phTexto);
    if (ph === null) {
      Alert.alert('Medição inválida', 'Informe um pH entre 0 e 14.');
      return;
    }
    const salvo = await onSalvarPh(item.id, ph);
    setPhSalvo(salvo);
  }

  return (
    <View style={styles.cartao}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expandida ? 'Recolher' : 'Expandir'} visita: ${item.local}, ${item.data}`}
        accessibilityState={{ expanded: expandida }}
        onPress={onAlternar}
        android_ripple={{ color: cores.azulClaro }}
        style={styles.cabecalhoVisita}
      >
        <View style={styles.resumoVisita}>
          <Text style={styles.servico}>{item.servico || 'Visita'}</Text>
          <Text style={styles.localResumo} numberOfLines={1}>{item.local}</Text>
          <View style={styles.linhaResumo}>
            <Text style={styles.data}>{item.data}</Text>
            <Text style={styles.statusResumo}>{item.status || 'Pendente'}</Text>
          </View>
          {item.tratadorNome ? <Text style={styles.tratador}>Tratador: {item.tratadorNome}</Text> : null}
        </View>
        <Text style={styles.indicadorExpandir}>{expandida ? '−' : '+'}</Text>
      </Pressable>
      {expandida && (
        <View style={styles.detalhesVisita}>
      {item.orientacao ? <Text style={styles.orientacao}>{item.orientacao}</Text> : null}
      {(item.horarioChegada || item.phMedido != null) && (
        <View style={styles.secaoPh}>
          <Text style={styles.tituloPh}>Medição de pH</Text>
          {statusAtual === 'Executada' ? (
            <Text style={styles.textoPh}>{item.phMedido == null ? 'Sem medição registrada.' : `pH registrado: ${formatarPh(item.phMedido)}`}</Text>
          ) : (
            <>
              <TextInput
                accessibilityLabel="pH medido na visita"
                keyboardType="decimal-pad"
                style={styles.campoPh}
                placeholder="Informe o pH (0 a 14)"
                value={phTexto}
                onChangeText={(valor) => { setPhTexto(valor); setPhSalvo(false); }}
              />
              <Pressable accessibilityRole="button" onPress={salvarPhMedido} style={({ pressed }) => [styles.botaoPh, pressed && styles.pressionado]} android_ripple={{ color: cores.azulPiscinaPressionado }}>
                <Text style={styles.textoBotaoPh}>{phSalvo ? 'Atualizar pH' : 'Registrar pH'}</Text>
              </Pressable>
              {phSalvo && <Text style={styles.confirmacao}>Medição registrada: pH {formatarPh(item.phMedido ?? phTexto)}.</Text>}
            </>
          )}
        </View>
      )}
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

function formatarPh(valor) {
  return String(valor).replace('.', ',');
}

const styles = StyleSheet.create({
  vazio: { color: cores.textoSecundario, fontSize: 15, marginTop: 8 },
  cartao: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 10, borderWidth: 1, marginTop: 10, overflow: 'hidden' },
  cabecalhoVisita: { alignItems: 'center', flexDirection: 'row', minHeight: 82, paddingHorizontal: 14, paddingVertical: 12 },
  resumoVisita: { flex: 1, minWidth: 0 },
  localResumo: { color: cores.texto, fontSize: 14, marginTop: 3 },
  linhaResumo: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 5 },
  data: { color: cores.textoSecundario, fontSize: 13 },
  statusResumo: { color: cores.azulEscuro, fontSize: 12, fontWeight: '600' },
  indicadorExpandir: { color: cores.azulPiscina, fontSize: 26, fontWeight: '400', marginLeft: 10, paddingHorizontal: 4 },
  detalhesVisita: { borderTopColor: cores.borda, borderTopWidth: 1, padding: 14 },
  servico: { color: cores.azulEscuro, fontSize: 16, fontWeight: '700' },
  tratador: { color: cores.textoSecundario, fontSize: 14, marginTop: 5 },
  orientacao: { color: cores.textoSecundario, fontSize: 15, marginTop: 6 },
  secaoPh: { backgroundColor: cores.fundoTela, borderRadius: 8, marginTop: 12, padding: 12 },
  tituloPh: { color: cores.azulEscuro, fontSize: 15, fontWeight: '700', marginBottom: 5 },
  textoPh: { color: cores.textoSecundario, fontSize: 14, marginTop: 3 },
  campoPh: { backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 7, borderWidth: 1, color: cores.texto, fontSize: 15, marginTop: 4, paddingHorizontal: 10, paddingVertical: 9 },
  botaoPh: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 7, justifyContent: 'center', marginTop: 8, minHeight: 42, overflow: 'hidden', padding: 9 },
  textoBotaoPh: { color: cores.branco, fontSize: 14, fontWeight: '700' },
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
