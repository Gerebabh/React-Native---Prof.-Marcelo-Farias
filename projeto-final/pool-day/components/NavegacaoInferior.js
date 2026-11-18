import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { cores } from '../styles/colors';

const Abas = createBottomTabNavigator();
const Pilha = createNativeStackNavigator();

const iconesDasAbas = {
  inicio: 'home-outline',
  clientes: 'people-outline',
  visitas: 'calendar-outline',
  equipe: 'person-add-outline',
  produtos: 'flask-outline',
};

export default function NavegacaoInferior({ abas, referenciaNavegacao, aoSelecionar, renderizarTela, renderizarFormularioVisita }) {
  return (
    <NavigationContainer ref={referenciaNavegacao}>
      <Pilha.Navigator>
        <Pilha.Screen name="Principal" options={{ headerShown: false }}>
          {() => (
            <Abas.Navigator
              initialRouteName="inicio"
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: cores.azulEscuro,
                tabBarInactiveTintColor: cores.textoSecundario,
                tabBarActiveBackgroundColor: cores.azulClaro,
                tabBarStyle: {
                  backgroundColor: cores.branco,
                  borderTopColor: cores.borda,
                  height: 64,
                  paddingBottom: 5,
                  paddingTop: 5,
                },
                tabBarItemStyle: { borderRadius: 8, marginHorizontal: 3, marginVertical: 4 },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarButton: (props) => <Pressable {...props} accessibilityRole="tab" role="tab" />,
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name={iconesDasAbas[route.name] || 'ellipse-outline'} size={size} color={color} />
                ),
              })}
            >
              {abas.map((aba) => (
                <Abas.Screen
                  key={aba.id}
                  name={aba.id}
                  options={{ tabBarLabel: aba.titulo, tabBarAccessibilityLabel: aba.titulo }}
                  listeners={{ focus: () => aoSelecionar(aba.id) }}
                >
                  {() => renderizarTela(aba.id)}
                </Abas.Screen>
              ))}
            </Abas.Navigator>
          )}
        </Pilha.Screen>
        {renderizarFormularioVisita ? (
          <Pilha.Screen name="NovoServico" options={{ title: 'Adicionar serviço' }}>
            {renderizarFormularioVisita}
          </Pilha.Screen>
        ) : null}
      </Pilha.Navigator>
    </NavigationContainer>
  );
}
