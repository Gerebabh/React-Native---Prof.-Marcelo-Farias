import DespesaLista from './DespesaLista';
import DespesaSumario from './DespesaSumario';

export default function DespesaSaida({ despesas, periodo }) {
  return <DespesaLista despesas={despesas} header={<DespesaSumario despesas={despesas} periodo={periodo} />} />;
}
