import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { cores } from '../styles/colors';
import VisitasLista from './VisitasLista';

export default function TelaVisitas({
  responsavel, possuiLocalAtivo, temClientes, responsavelUid, responsavelNome, piscinas, tratadores, visitas, localVisitaId, tratadorUid, dataVisita, mostrarCalendario, mostrarFormulario, servico, orientacao,
  onLocal, onTratador, onAbrirCalendario, onSelecionarData, onFecharCalendario, onServico, onOrientacao, onAdicionarVisita,
  onAbrirFormulario, onCancelarFormulario, onCadastrarCliente, onAddPhoto, onCheckIn, onRegisterDeparture, onChangeStatus, onConfirmConclusion, onChangeJustificativa,
}) {
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.secaoVisitas}>
        <Text style={styles.tituloSecao}>{responsavel ? 'Próximas visitas' : 'Minhas visitas'}</Text>
        {responsavel && !possuiLocalAtivo && (
          <View style={styles.avisoPreRequisito}>
            <Text style={styles.textoAviso}>{temClientes ? 'Não há cliente ativo para agendar. Ative um cliente existente ou cadastre um novo.' : 'Cadastre um cliente e uma piscina antes de agendar um serviço.'}</Text>
            <Pressable accessibilityRole="button" onPress={onCadastrarCliente} style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}>
              <Text style={styles.textoBotao}>{temClientes ? 'Ver clientes' : 'Cadastrar cliente'}</Text>
            </Pressable>
          </View>
        )}
        {responsavel && possuiLocalAtivo && !mostrarFormulario && (
          <Pressable accessibilityRole="button" onPress={onAbrirFormulario} style={({ pressed }) => [styles.botao, pressed && styles.pressionado]} android_ripple={{ color: cores.azulPiscinaPressionado }}>
            <Text style={styles.textoBotao}>Adicionar serviço</Text>
          </Pressable>
        )}
        {responsavel && possuiLocalAtivo && mostrarFormulario && (
          <>
            <Text style={styles.subtituloFormulario}>Novo serviço</Text>
            <Text style={styles.rotulo}>Local / piscina</Text>
            <View style={styles.seletor}>
              <Picker selectedValue={localVisitaId} onValueChange={onLocal}>
                <Picker.Item label={piscinas.length ? 'Selecione o local' : 'Cadastre um local primeiro'} value="" />
                {piscinas.map((item) => <Picker.Item key={item.id} label={`${item.cliente} — ${item.endereco}`} value={item.id} />)}
              </Picker>
            </View>
            <Text style={styles.rotulo}>Tratador responsável</Text>
            <View style={styles.seletor}>
              <Picker selectedValue={tratadorUid} onValueChange={onTratador}>
                <Picker.Item label="Selecione quem fará o serviço" value="" />
                <Picker.Item label={`${responsavelNome} (eu)`} value={responsavelUid} />
                {tratadores.map((item) => <Picker.Item key={item.id} label={item.nome || item.email} value={item.id} />)}
              </Picker>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Selecionar data da visita" onPress={onAbrirCalendario} style={styles.campoData}>
              <Text style={dataVisita ? styles.textoData : styles.placeholderData}>{dataVisita ? formatarData(dataVisita) : 'Data da visita'}</Text>
            </Pressable>
            {mostrarCalendario && (
              <DateTimePicker
                value={dataVisita || new Date()}
                minimumDate={inicioDoDia(new Date())}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onValueChange={(_evento, dataSelecionada) => onSelecionarData(dataSelecionada)}
                onDismiss={onFecharCalendario}
              />
            )}
            <Text style={styles.rotulo}>Tipo de serviço</Text>
            <View style={styles.seletor}>
              <Picker selectedValue={servico} onValueChange={onServico}>
                <Picker.Item label="Selecione o serviço" value="" />
                <Picker.Item label="Aplicar produtos" value="Aplicar produtos" />
                <Picker.Item label="Aspiração - Liberar o uso" value="Aspiração - Liberar o uso" />
                <Picker.Item label="Inspeção" value="Inspeção" />
              </Picker>
            </View>
            {servico === 'Aplicar produtos' && <TextInput accessibilityLabel="Orientação de produtos" style={styles.campo} placeholder="Orientação de produtos" value={orientacao} onChangeText={onOrientacao} />}
            <Pressable accessibilityRole="button" onPress={onAdicionarVisita} style={({ pressed }) => [styles.botao, pressed && styles.pressionado]} android_ripple={{ color: cores.azulPiscinaPressionado }}>
              <Text style={styles.textoBotao}>Adicionar visita</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onCancelarFormulario} style={styles.botaoCancelar}>
              <Text style={styles.textoCancelar}>Cancelar</Text>
            </Pressable>
          </>
        )}
        <VisitasLista
          visitas={visitas}
          onAddPhoto={onAddPhoto}
          onCheckIn={onCheckIn}
          onRegisterDeparture={onRegisterDeparture}
          onChangeStatus={onChangeStatus}
          onConfirmConclusion={onConfirmConclusion}
          onChangeJustificativa={onChangeJustificativa}
        />
      </View>
    </ScrollView>
  );
}

function formatarData(data) {
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}

function inicioDoDia(data) {
  const dia = new Date(data);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: cores.fundoTela, padding: 20, paddingTop: 16 },
  secaoVisitas: { backgroundColor: cores.branco, borderRadius: 14, padding: 18 },
  tituloSecao: { color: cores.azulEscuro, fontSize: 19, fontWeight: '600', marginBottom: 12 },
  subtituloFormulario: { color: cores.texto, fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 14 },
  avisoPreRequisito: { backgroundColor: cores.fundoCartao, borderRadius: 8, marginBottom: 14, padding: 12 },
  textoAviso: { color: cores.textoSecundario, fontSize: 15, lineHeight: 21 },
  rotulo: { color: cores.textoSecundario, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  seletor: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  campoData: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, justifyContent: 'center', marginBottom: 12, minHeight: 46, paddingHorizontal: 12 },
  placeholderData: { color: cores.cinza, fontSize: 16 },
  textoData: { color: cores.texto, fontSize: 16 },
  campo: { backgroundColor: cores.fundoCartao, borderColor: cores.borda, borderRadius: 8, borderWidth: 1, fontSize: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 11 },
  botao: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 8, marginTop: 4, overflow: 'hidden', padding: 14 },
  pressionado: { opacity: 0.85 },
  textoBotao: { color: cores.branco, fontSize: 16, fontWeight: '600' },
  botaoCancelar: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  textoCancelar: { color: cores.textoSecundario, fontSize: 15, fontWeight: '600' },
});
