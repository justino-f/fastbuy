import { useState, useEffect } from 'react';
import { Client, CancelledCoupon, Product } from '../types';
import { dataStructures } from '../services/api';

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: 20,
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  marginBottom: 20,
};

const btnStyle: React.CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  color: '#fff',
  marginRight: 8,
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: 12,
};

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  backgroundColor: '#1976d2',
  color: '#fff',
  fontSize: 12,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
  fontSize: 12,
};

export default function DataStructures() {
  const [queue, setQueue] = useState<Client[]>([]);
  const [stack, setStack] = useState<CancelledCoupon[]>([]);
  const [matrix, setMatrix] = useState<any[][]>([]);
  const [matrixHeaders, setMatrixHeaders] = useState<string[]>([]);
  const [sortResult, setSortResult] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState('name');
  const [algorithm, setAlgorithm] = useState('bubble');
  const [peekQueue, setPeekQueue] = useState<Client | null>(null);
  const [peekStackItem, setPeekStackItem] = useState<CancelledCoupon | null>(null);
  const [clientId, setClientId] = useState(0);
  const [msg, setMsg] = useState('');

  const loadQueue = () => dataStructures.getQueue().then((r) => setQueue(r.data)).catch(() => {});
  const loadStack = () => dataStructures.getStack().then((r) => setStack(r.data)).catch(() => {});
  const loadMatrix = () =>
    dataStructures.getMatrix().then((r) => {
      const d = r.data;
      if (d.headers) setMatrixHeaders(d.headers);
      if (d.data) setMatrix(d.data);
      else if (Array.isArray(d)) setMatrix(d);
    }).catch(() => {});

  useEffect(() => {
    loadQueue();
    loadStack();
    loadMatrix();
  }, []);

  const handleEnqueue = async () => {
    if (!clientId) return;
    await dataStructures.enqueueClient(clientId);
    setClientId(0);
    loadQueue();
    showMsg('Cliente adicionado à fila');
  };

  const handleDequeue = async () => {
    await dataStructures.dequeueClient();
    loadQueue();
    showMsg('Próximo cliente atendido');
  };

  const handlePeekQueue = async () => {
    const res = await dataStructures.peekQueue();
    setPeekQueue(res.data);
  };

  const handlePeekStack = async () => {
    const res = await dataStructures.peekStack();
    setPeekStackItem(res.data);
  };

  const handlePopStack = async () => {
    await dataStructures.popStack();
    loadStack();
    showMsg('Último cupom recuperado');
  };

  const handleSort = async () => {
    const res = await dataStructures.sort({ sortBy, algorithm });
    setSortResult(res.data);
  };

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Estruturas de Dados</h2>
      {msg && (
        <div style={{ padding: '8px 16px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: 4, marginBottom: 16, fontSize: 13 }}>
          {msg}
        </div>
      )}

      <div style={sectionStyle}>
        <h3 style={{ marginBottom: 12, color: '#1976d2' }}>Fila de Clientes (Queue - FIFO)</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="number"
            placeholder="ID do Cliente"
            value={clientId || ''}
            onChange={(e) => setClientId(Number(e.target.value))}
            style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, width: 140 }}
          />
          <button onClick={handleEnqueue} style={{ ...btnStyle, backgroundColor: '#1976d2' }}>
            Enfileirar
          </button>
          <button onClick={handleDequeue} style={{ ...btnStyle, backgroundColor: '#43a047' }}>
            Atender Próximo
          </button>
          <button onClick={handlePeekQueue} style={{ ...btnStyle, backgroundColor: '#fb8c00' }}>
            Peek
          </button>
        </div>
        {peekQueue && (
          <div style={{ fontSize: 13, marginBottom: 8, padding: 8, backgroundColor: '#fff3e0', borderRadius: 4 }}>
            Próximo: {peekQueue.name} ({peekQueue.cpf})
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {queue.map((c, i) => (
            <div
              key={i}
              style={{
                padding: '8px 16px',
                backgroundColor: i === 0 ? '#e8f5e9' : '#e3f2fd',
                borderRadius: 4,
                fontSize: 12,
                border: i === 0 ? '2px solid #43a047' : '1px solid #90caf9',
              }}
            >
              {i === 0 && <strong>PRÓXIMO </strong>}
              {c.name || `Cliente #${c.id}`}
            </div>
          ))}
          {queue.length === 0 && <span style={{ color: '#999', fontSize: 13 }}>Fila vazia</span>}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={{ marginBottom: 12, color: '#1976d2' }}>Cupons Cancelados (Stack - LIFO)</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={handlePopStack} style={{ ...btnStyle, backgroundColor: '#e53935' }}>
            Pop (Recuperar Último)
          </button>
          <button onClick={handlePeekStack} style={{ ...btnStyle, backgroundColor: '#fb8c00' }}>
            Peek
          </button>
        </div>
        {peekStackItem && (
          <div style={{ fontSize: 13, marginBottom: 8, padding: 8, backgroundColor: '#fff3e0', borderRadius: 4 }}>
            Topo: Venda #{peekStackItem.saleId} - R$ {peekStackItem.total.toFixed(2)} ({peekStackItem.reason})
          </div>
        )}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Posição</th>
              <th style={thStyle}>Venda</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Motivo</th>
              <th style={thStyle}>Data</th>
            </tr>
          </thead>
          <tbody>
            {stack.map((c, i) => (
              <tr key={i} style={{ backgroundColor: i === 0 ? '#ffebee' : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={tdStyle}>{i === 0 ? 'TOPO' : i + 1}</td>
                <td style={tdStyle}>#{c.saleId}</td>
                <td style={tdStyle}>R$ {c.total.toFixed(2)}</td>
                <td style={tdStyle}>{c.reason}</td>
                <td style={tdStyle}>{new Date(c.cancelledAt).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
            {stack.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#999' }}>Pilha vazia</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={{ marginBottom: 12, color: '#1976d2' }}>Matriz de Produtos</h3>
        {matrix.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              {matrixHeaders.length > 0 && (
                <thead>
                  <tr>
                    {matrixHeaders.map((h, i) => (
                      <th key={i} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {matrix.map((row, ri) => (
                  <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
                    {(Array.isArray(row) ? row : Object.values(row)).map((cell: any, ci: number) => (
                      <td key={ci} style={tdStyle}>{String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <span style={{ color: '#999', fontSize: 13 }}>Nenhum dado disponível</span>
        )}
      </div>

      <div style={sectionStyle}>
        <h3 style={{ marginBottom: 12, color: '#1976d2' }}>Ordenação</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 }}
          >
            <option value="bubble">Bubble Sort</option>
            <option value="insertion">Insertion Sort</option>
            <option value="quick">Quick Sort</option>
            <option value="merge">Merge Sort</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 }}
          >
            <option value="name">Nome</option>
            <option value="price">Preço</option>
            <option value="stock">Estoque</option>
          </select>
          <button onClick={handleSort} style={{ ...btnStyle, backgroundColor: '#1976d2' }}>
            Ordenar
          </button>
        </div>
        {sortResult.length > 0 && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Nome</th>
                <th style={thStyle}>Preço</th>
                <th style={thStyle}>Estoque</th>
              </tr>
            </thead>
            <tbody>
              {sortResult.map((p, i) => (
                <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={tdStyle}>{p.name}</td>
                  <td style={tdStyle}>R$ {p.salePrice.toFixed(2)}</td>
                  <td style={tdStyle}>{p.currentStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
