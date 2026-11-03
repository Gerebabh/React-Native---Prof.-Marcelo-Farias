import { ActivityIndicator, FlatList, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { themes } from '../../constants/theme';
import { useNotices } from '../../hooks/useNotices';
import ActionButton from '../../components/ActionButton';
import FadeIn from '../../components/FadeIn';

export default function Home() {
  const { notices, isLoading, error, reload } = useNotices();
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <Text style={[styles.title, { color: colors.text }]}>Mural de avisos</Text>
    {!!error ? <View style={styles.message}>
      <Text style={{ color: colors.error }}>{error}</Text>
      <ActionButton title="Tentar novamente" onPress={reload} />
    </View> : isLoading && notices.length === 0 ? <View style={styles.message}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.secondary }}>Carregando avisos...</Text>
    </View> : <FlatList
      data={notices}
      keyExtractor={item => String(item.id)}
      refreshing={isLoading}
      onRefresh={reload}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={{ color: colors.secondary }}>Nenhum aviso por aqui.</Text>}
      renderItem={({ item }) => <FadeIn>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noticeTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.body, { color: colors.secondary }]}>{item.body}</Text>
        </View>
      </FadeIn>}
    />}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '600', marginVertical: 20 },
  message: { paddingVertical: 24, gap: 16 },
  list: { paddingBottom: 20, flexGrow: 1 },
  card: { borderWidth: 1, padding: 16, borderRadius: 8, marginBottom: 12 },
  noticeTitle: { fontSize: 17, fontWeight: '600', marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 22 },
});
