import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import DespesasRecentes from './screens/DespesasRecentes';
import TodasDepesas from './screens/TodasDespesas';
import GerenciarDespesas from './screens/GerenciarDespesas';
import IconButton from './components/IconButton';

export default function App() {
  const Tab = createBottomTabNavigator();

  function BottonTabScreen() {
    return (
      <Tab.Navigator
        screenOptions={({ navigation }) => ({
          headerRight: () => (
            <IconButton
              icon="add"
              size={24}
              color="black"
              onPress={() => {
                navigation.navigate('Gerenciar Despesa'); // Mesmo nome do Stack.Screen
              }}
            />
          ),
        })}
      >
        <Tab.Screen
          name="Despesa Recentes"
          component={DespesasRecentes}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="hourglass" size={size} color={color} />
            ),
            tabBarLabel: 'Recentes',
            title: 'Despesas Recentes',
            tabBarLabelStyle: { fontSize: 12 },
          }}
        />

        <Tab.Screen
          name="Todas Despesas"
          component={TodasDepesas}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Todas',
            title: 'Todas as Despesas',
            tabBarLabelStyle: { fontSize: 12 },
          }}
        />
      </Tab.Navigator>
    );
  }

  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Despesas"
          component={BottonTabScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Gerenciar Despesa" component={GerenciarDespesas} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});