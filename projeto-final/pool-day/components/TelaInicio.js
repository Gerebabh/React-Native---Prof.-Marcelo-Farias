import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cores } from '../styles/colors';
import CalculadoraProdutos from './CalculadoraProdutos';

export default function TelaInicio({ nome, empresa, responsavel, clientesAtivos, agendamentosHoje, visitasAtrasadas, funcionarios, produtos = [], aoAbrirLocais, aoAbrirVisitas, aoAbrirEquipe, aoAdicionarServico }) {
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.conteudo}>
      <Text style={styles.titulo}>Olá, {nome}</Text>
      <Text style={styles.subtitulo}>{empresa}</Text>
      <Text style={styles.introducao}>Acompanhe seus atendimentos e organize a rotina da piscina.</Text>

      {responsavel ? (
        <View style={styles.listaResumo}>
          <CartaoResumo titulo="Clientes ativos" valor={clientesAtivos} onPress={aoAbrirLocais} />
          <CartaoResumo titulo="Agendamentos de hoje" valor={agendamentosHoje} onPress={aoAbrirVisitas} />
          <CartaoResumo titulo="Visitas em atraso" valor={visitasAtrasadas} onPress={aoAbrirVisitas} />
          {funcionarios > 0 && <CartaoResumo titulo="Funcionários" valor={funcionarios} onPress={aoAbrirEquipe} />}
        </View>
      ) : (
        <View style={styles.listaResumo}>
          <CartaoResumo titulo="Atendimentos de hoje" valor={agendamentosHoje} onPress={aoAbrirVisitas} />
          <CartaoResumo titulo="Visitas em atraso" valor={visitasAtrasadas} onPress={aoAbrirVisitas} />
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={responsavel ? aoAdicionarServico : aoAbrirVisitas}
        android_ripple={{ color: cores.azulPiscinaPressionado }}
        style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
      >
        <Text style={styles.textoBotao}>{responsavel ? 'Adicionar serviço' : 'Ver minhas visitas'}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: mostrarCalculadora }}
        onPress={() => setMostrarCalculadora((aberta) => !aberta)}
        android_ripple={{ color: cores.azulClaro }}
        style={({ pressed }) => [styles.botaoCalculadora, pressed && styles.pressionado]}
      >
        <Text style={styles.textoBotaoCalculadora}>{mostrarCalculadora ? 'Fechar calculadora' : 'Calculadora de produtos'}</Text>
      </Pressable>
      {mostrarCalculadora && <CalculadoraProdutos produtos={produtos} />}
    </ScrollView>
  );
}

function CartaoResumo({ titulo, valor, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}: ${valor}`}
      onPress={onPress}
      android_ripple={{ color: cores.azulClaro }}
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
    >
      <Text style={styles.tituloCartao}>{titulo}</Text>
      <Text style={styles.valorCartao}>{valor}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteudo: { flexGrow: 1, padding: 20, paddingTop: 22 },
  titulo: { color: cores.azulEscuro, fontSize: 24, fontWeight: '700' },
  subtitulo: { color: cores.textoSecundario, fontSize: 15, marginTop: 5 },
  introducao: { color: cores.textoSecundario, fontSize: 15, lineHeight: 22, marginTop: 18 },
  listaResumo: { gap: 10, marginTop: 18 },
  cartao: { alignItems: 'center', backgroundColor: cores.branco, borderColor: cores.borda, borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 70, overflow: 'hidden', paddingHorizontal: 16, paddingVertical: 12 },
  tituloCartao: { color: cores.texto, flex: 1, fontSize: 16, fontWeight: '600' },
  valorCartao: { color: cores.azulPiscina, fontSize: 25, fontWeight: '700', marginLeft: 12 },
  botao: { alignItems: 'center', backgroundColor: cores.azulPiscina, borderRadius: 8, marginTop: 18, overflow: 'hidden', padding: 14 },
  pressionado: { opacity: 0.85 },
  textoBotao: { color: cores.branco, fontSize: 15, fontWeight: '600' },
  botaoCalculadora: { alignItems: 'center', backgroundColor: cores.branco, borderColor: cores.azulPiscina, borderRadius: 8, borderWidth: 1, marginTop: 10, overflow: 'hidden', padding: 14 },
  textoBotaoCalculadora: { color: cores.azulPiscina, fontSize: 15, fontWeight: '600' },
});
