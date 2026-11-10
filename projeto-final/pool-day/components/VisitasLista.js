import { Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

const statusDisponiveis = ['Executada', 'Frustrada', 'Não realizada'];

export default function VisitasLista({ visitas, onAddPhoto, onCheckIn, onRegisterDeparture, onChangeStatus, onConfirmConclusion, onChangeJustificativa }) {
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
          renderItem={({ item }) => <VisitaCartao item={item} onAddPhoto={onAddPhoto} onCheckIn={onCheckIn} onRegisterDeparture={onRegisterDeparture} onChangeStatus={onChangeStatus} onConfirmConclusion={onConfirmConclusion} onChangeJustificativa={onChangeJustificativa} />}
        />
      )}
      {visitasConcluidas.length > 0 && (
        <>
          <Text style={styles.tituloConcluidas}>Visitas concluídas</Text>
          <FlatList
            data={visitasConcluidas}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => <VisitaCartao item={item} onAddPhoto={onAddPhoto} onCheckIn={onCheckIn} onRegisterDeparture={onRegisterDeparture} onChangeStatus={onChangeStatus} onConfirmConclusion={onConfirmConclusion} onChangeJustificativa={onChangeJustificativa} />}
          />
        </>
      )}
    </View>
  );
}

function VisitaCartao({ item, onAddPhoto, onCheckIn, onRegisterDeparture, onChangeStatus, onConfirmConclusion, onChangeJustificativa }) {
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
          uri={item.fotoAntes}
          onPress={() => onAddPhoto(item.id, 'fotoAntes')}
        />
        <FotoEtapa
          titulo="Depois do atendimento"
          textoVazio="Nenhuma foto depois anexada."
          acessibilidade="Foto depois do atendimento"
          observacao={item.servico === 'Aspiração - Liberar o uso' ? 'Obrigatória para registrar a saída.' : 'Opcional para este serviço.'}
          uri={item.fotoDepois}
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

function FotoEtapa({ titulo, textoVazio, acessibilidade, observacao, uri, onPress }) {
  const etapa = titulo.startsWith('Antes') ? 'antes' : 'depois';

  return (
    <View style={styles.itemFoto}>
      <Text style={styles.tituloEtapaFoto}>{titulo}</Text>
      {uri ? (
        <Image accessibilityLabel={acessibilidade} source={{ uri }} style={styles.imagemFoto} />
      ) : (
        <Text style={styles.fotoVazia}>{textoVazio}</Text>
      )}
      {observacao && <Text style={styles.observacaoFoto}>{observacao}</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${uri ? 'Alterar' : 'Adicionar'} foto ${etapa}`}
        onPress={onPress}
        style={({ pressed }) => [styles.botaoFoto, pressed && styles.pressionado]}
      >
        <Text style={styles.textoBotaoFoto}>{uri ? `Alterar foto ${etapa}` : `Adicionar foto ${etapa}`}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  vazio: { color: '#526168', fontSize: 15, marginTop: 8 },
  cartao: { backgroundColor: '#fff', borderRadius: 10, marginTop: 10, padding: 16 },
  data: { color: '#526168', fontSize: 14 },
  servico: { color: '#123b4a', fontSize: 17, fontWeight: '600', marginTop: 4 },
  orientacao: { color: '#526168', fontSize: 15, marginTop: 6 },
  status: { color: '#252d31', fontSize: 15, fontWeight: '600', marginTop: 12 },
  acoesStatus: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  botaoStatus: { borderColor: '#d5dfe2', borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  statusSelecionado: { backgroundColor: '#123b4a', borderColor: '#123b4a' },
  textoStatus: { color: '#123b4a', fontSize: 13, fontWeight: '600' },
  textoStatusSelecionado: { color: '#fff' },
  pressionado: { opacity: 0.75 },
  campoMotivo: { backgroundColor: '#f7f9fa', borderColor: '#d5dfe2', borderRadius: 8, borderWidth: 1, fontSize: 15, marginTop: 10, minHeight: 68, padding: 10, textAlignVertical: 'top' },
  tituloConcluidas: { color: '#123b4a', fontSize: 17, fontWeight: '600', marginTop: 20 },
  botaoSalvar: { alignItems: 'center', backgroundColor: '#e8703a', borderRadius: 8, marginTop: 8, padding: 11 },
  textoBotaoSalvar: { color: '#fff', fontSize: 14, fontWeight: '600' },
  confirmacao: { color: '#276749', fontSize: 14, fontWeight: '600', marginTop: 8 },
  confirmacaoConcluida: { color: '#276749', fontSize: 15, fontWeight: '700', marginTop: 12 },
  botaoChegada: { alignItems: 'center', backgroundColor: '#123b4a', borderRadius: 8, marginTop: 12, padding: 11 },
  textoBotaoChegada: { color: '#fff', fontSize: 15, fontWeight: '600' },
  registroChegada: { color: '#276749', fontSize: 14, fontWeight: '600', marginTop: 8 },
  secaoFotos: { backgroundColor: '#f7f9fa', borderRadius: 8, marginTop: 12, padding: 12 },
  tituloFotos: { color: '#123b4a', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  itemFoto: { borderTopColor: '#d5dfe2', borderTopWidth: 1, marginTop: 8, paddingTop: 8 },
  tituloEtapaFoto: { color: '#252d31', fontSize: 14, fontWeight: '600' },
  fotoVazia: { color: '#526168', fontSize: 13, marginTop: 6 },
  imagemFoto: { borderRadius: 8, height: 150, marginTop: 8, width: '100%' },
  botaoFoto: { alignItems: 'center', backgroundColor: '#123b4a', borderRadius: 8, marginTop: 8, padding: 10 },
  textoBotaoFoto: { color: '#fff', fontSize: 14, fontWeight: '600' },
  observacaoFoto: { color: '#526168', fontSize: 12, marginTop: 4 },
  botaoSaida: { alignItems: 'center', backgroundColor: '#e8703a', borderRadius: 8, marginTop: 12, padding: 11 },
  registroSaida: { color: '#276749', fontSize: 14, fontWeight: '600', marginTop: 12 },
});
