import { useLayoutEffect, useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpenses } from '../store/expenses-context';
import { CATEGORIES, themes } from '../constants/theme';
import { getDataFormatada, validate } from '../utils/expenses';

export default function GerenciarDespesa({ route, navigation }) {
  const expenseId = route.params?.expenseId;
  const isEditing = !!expenseId;
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const selected = expenses.find(item => item.id === expenseId);
  const colors = themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [form, setForm] = useState({
    description: selected?.description || '',
    amount: selected ? selected.amount.toFixed(2) : '',
    date: selected?.date || new Date(),
    category: selected?.category || '',
  });
  const [errors, setErrors] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar despesa' : 'Nova despesa' });
  }, [navigation, isEditing]);

  function handleChange(field, value) {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    if (errors[field]) {
      const nextErrors = validate(nextForm);
      setErrors(current => ({ ...current, [field]: nextErrors[field] }));
    }
  }

  function handleAmount(text) {
    const amount = text.replace(',', '.');
    if (/^\d*\.?\d{0,2}$/.test(amount)) handleChange('amount', amount);
  }

  function handleDate(event, date) {
    setShowPicker(Platform.OS === 'ios');
    handleChange('date', date);
  }

  function handleSubmit() {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const data = { ...form, description: form.description.trim(), amount: parseFloat(form.amount.replace(',', '.')) };
    if (isEditing) updateExpense(expenseId, data);
    else addExpense(data);
    navigation.goBack();
  }

  function confirmDelete() {
    Alert.alert('Excluir despesa', 'Deseja excluir esta despesa?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => {
        deleteExpense(expenseId);
        navigation.goBack();
      } },
    ]);
  }

  function inputStyle(field) {
    return [styles.input, { color: colors.text, backgroundColor: colors.surface,
      borderColor: errors[field] ? colors.error : colors.border }];
  }

  return <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
      <TextInput style={inputStyle('description')} value={form.description} onChangeText={text => handleChange('description', text)}
        placeholder="Ex.: Almoço" placeholderTextColor={colors.secondary} />
      {!!errors.description && <Text style={{ color: colors.error }}>{errors.description}</Text>}
      <Text style={[styles.label, { color: colors.text }]}>Valor (R$)</Text>
      <TextInput style={inputStyle('amount')} value={form.amount} onChangeText={handleAmount}
        keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.secondary} />
      {!!errors.amount && <Text style={{ color: colors.error }}>{errors.amount}</Text>}
      <Text style={[styles.label, { color: colors.text }]}>Data</Text>
      <Pressable style={inputStyle('date')} onPress={() => setShowPicker(true)} accessibilityRole="button">
        <Text style={{ color: colors.text }}>{getDataFormatada(form.date)}</Text>
      </Pressable>
      {!!errors.date && <Text style={{ color: colors.error }}>{errors.date}</Text>}
      {showPicker && <DateTimePicker value={form.date} mode="date" onValueChange={handleDate} onDismiss={() => setShowPicker(false)}
        themeVariant={colors === themes.dark ? 'dark' : 'light'} />}
      {showPicker && Platform.OS === 'ios' && <Button title="Concluir data" onPress={() => setShowPicker(false)} color={colors.primary} />}
      <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
      <Pressable style={inputStyle('category')} onPress={() => setShowCategories(true)} accessibilityRole="button">
        <Text style={{ color: colors.text }}>{form.category || 'Selecione uma categoria'}</Text>
      </Pressable>
      {!!errors.category && <Text style={{ color: colors.error }}>{errors.category}</Text>}
      <View style={styles.button}><Button title="Salvar" color={colors.primary} onPress={handleSubmit} /></View>
      <View style={styles.button}><Button title="Cancelar" color={colors.secondary} onPress={() => navigation.goBack()} /></View>
      {isEditing && <View style={styles.button}><Button title="Excluir" color={colors.error} onPress={confirmDelete} /></View>}
    </ScrollView>
    <Modal visible={showCategories} transparent animationType="slide" onRequestClose={() => setShowCategories(false)}>
      <View style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Categoria</Text>
          {CATEGORIES.map(category => <Pressable key={category} style={[styles.option, { borderColor: colors.border }]}
            onPress={() => { handleChange('category', category); setShowCategories(false); }}>
            <Text style={{ color: form.category === category ? colors.primary : colors.text }}>{category}</Text>
          </Pressable>)}
          <Button title="Cancelar" color={colors.primary} onPress={() => setShowCategories(false)} />
        </View>
      </View>
    </Modal>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 4 },
  button: { marginTop: 16 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { padding: 24, paddingBottom: 40, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  option: { paddingVertical: 16, borderBottomWidth: 1, marginBottom: 8 },
});
