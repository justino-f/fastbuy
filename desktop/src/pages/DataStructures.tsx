import { useState } from 'react';

type Tab = 'queue' | 'stack' | 'linkedList';

interface LinkedNode {
  id: number;
  value: string;
}

let nodeIdCounter = 0;

export default function DataStructures() {
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [queue, setQueue] = useState<string[]>([]);
  const [stack, setStack] = useState<string[]>([]);
  const [linkedList, setLinkedList] = useState<LinkedNode[]>([]);
  const [queueInput, setQueueInput] = useState('');
  const [stackInput, setStackInput] = useState('');
  const [listInput, setListInput] = useState('');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'queue', label: 'Fila (Queue)' },
    { key: 'stack', label: 'Pilha (Stack)' },
    { key: 'linkedList', label: 'Lista Encadeada' },
  ];

  function enqueue() {
    if (!queueInput.trim()) return;
    setQueue((prev) => [...prev, queueInput.trim()]);
    setQueueInput('');
  }

  function dequeue() {
    setQueue((prev) => prev.slice(1));
  }

  function push() {
    if (!stackInput.trim()) return;
    setStack((prev) => [stackInput.trim(), ...prev]);
    setStackInput('');
  }

  function pop() {
    setStack((prev) => prev.slice(1));
  }

  function addNode() {
    if (!listInput.trim()) return;
    setLinkedList((prev) => [...prev, { id: ++nodeIdCounter, value: listInput.trim() }]);
    setListInput('');
  }

  function removeNode(id: number) {
    setLinkedList((prev) => prev.filter((n) => n.id !== id));
  }

  const styles = {
    container: { padding: 32, maxWidth: 960, margin: '0 auto' } as React.CSSProperties,
    title: { fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#1a1a2e' } as React.CSSProperties,
    tabBar: { display: 'flex', gap: 8, marginBottom: 24 } as React.CSSProperties,
    tab: (active: boolean) => ({
      padding: '10px 20px',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: active ? 700 : 500,
      fontSize: 14,
      background: active ? '#1a1a2e' : '#e0e0e0',
      color: active ? '#fff' : '#333',
      transition: 'all 0.2s',
    }) as React.CSSProperties,
    card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } as React.CSSProperties,
    description: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 1.5 } as React.CSSProperties,
    inputRow: { display: 'flex', gap: 8, marginBottom: 20 } as React.CSSProperties,
    input: { flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none' } as React.CSSProperties,
    btn: (bg: string) => ({
      padding: '10px 18px',
      border: 'none',
      borderRadius: 6,
      background: bg,
      color: '#fff',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: 14,
    }) as React.CSSProperties,
    btnDisabled: { opacity: 0.5, cursor: 'not-allowed' } as React.CSSProperties,
    elementsRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const, minHeight: 50 } as React.CSSProperties,
    queueBox: { padding: '12px 18px', background: '#2196F3', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: 14, minWidth: 50, textAlign: 'center' as const } as React.CSSProperties,
    stackBox: { padding: '12px 18px', background: '#4CAF50', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: 14, textAlign: 'center' as const } as React.CSSProperties,
    stackCol: { display: 'flex', flexDirection: 'column' as const, gap: 4, minHeight: 50 } as React.CSSProperties,
    nodeContainer: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const, gap: 4, minHeight: 50 } as React.CSSProperties,
    node: { display: 'flex', alignItems: 'center', gap: 4 } as React.CSSProperties,
    nodeBox: { padding: '12px 18px', background: '#FF9800', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: 'pointer', position: 'relative' as const } as React.CSSProperties,
    arrow: { fontSize: 20, color: '#FF9800', fontWeight: 700 } as React.CSSProperties,
    nullBox: { padding: '8px 12px', background: '#eee', borderRadius: 6, fontSize: 12, color: '#999', fontWeight: 600 } as React.CSSProperties,
    label: { fontSize: 12, color: '#999', marginBottom: 8, fontWeight: 600 } as React.CSSProperties,
    empty: { color: '#bbb', fontSize: 14, fontStyle: 'italic' as const } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Estruturas de Dados</h1>
      <div style={styles.tabBar}>
        {tabs.map((t) => (
          <button key={t.key} style={styles.tab(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'queue' && (
        <div style={styles.card}>
          <p style={styles.description}>
            <strong>Fila (Queue)</strong> segue o princípio FIFO (First In, First Out). O primeiro elemento inserido é o primeiro a ser removido.
          </p>
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              value={queueInput}
              onChange={(e) => setQueueInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enqueue()}
              placeholder="Valor do elemento"
            />
            <button style={styles.btn('#2196F3')} onClick={enqueue}>Enqueue</button>
            <button
              style={{ ...styles.btn('#f44336'), ...(queue.length === 0 ? styles.btnDisabled : {}) }}
              onClick={dequeue}
              disabled={queue.length === 0}
            >
              Dequeue
            </button>
          </div>
          <div style={styles.label}>
            {queue.length > 0 && <span>FRENTE ← elementos → FINAL</span>}
          </div>
          <div style={styles.elementsRow}>
            {queue.length === 0 && <span style={styles.empty}>Fila vazia</span>}
            {queue.map((item, i) => (
              <div key={i} style={styles.queueBox}>{item}</div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'stack' && (
        <div style={styles.card}>
          <p style={styles.description}>
            <strong>Pilha (Stack)</strong> segue o princípio LIFO (Last In, First Out). O último elemento inserido é o primeiro a ser removido.
          </p>
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              value={stackInput}
              onChange={(e) => setStackInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && push()}
              placeholder="Valor do elemento"
            />
            <button style={styles.btn('#4CAF50')} onClick={push}>Push</button>
            <button
              style={{ ...styles.btn('#f44336'), ...(stack.length === 0 ? styles.btnDisabled : {}) }}
              onClick={pop}
              disabled={stack.length === 0}
            >
              Pop
            </button>
          </div>
          <div style={styles.stackCol}>
            {stack.length === 0 && <span style={styles.empty}>Pilha vazia</span>}
            {stack.map((item, i) => (
              <div key={i} style={{ ...styles.stackBox, ...(i === 0 ? { border: '2px solid #2e7d32' } : {}) }}>
                {i === 0 ? `→ ${item} (topo)` : item}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'linkedList' && (
        <div style={styles.card}>
          <p style={styles.description}>
            <strong>Lista Encadeada (Linked List)</strong> é uma estrutura onde cada nó aponta para o próximo. Clique em um nó para removê-lo.
          </p>
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              value={listInput}
              onChange={(e) => setListInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNode()}
              placeholder="Valor do nó"
            />
            <button style={styles.btn('#FF9800')} onClick={addNode}>Adicionar</button>
          </div>
          <div style={styles.nodeContainer}>
            {linkedList.length === 0 && <span style={styles.empty}>Lista vazia</span>}
            {linkedList.map((node, i) => (
              <div key={node.id} style={styles.node}>
                <div style={styles.nodeBox} onClick={() => removeNode(node.id)} title="Clique para remover">
                  {node.value}
                </div>
                <span style={styles.arrow}>{i < linkedList.length - 1 ? '→' : ''}</span>
              </div>
            ))}
            {linkedList.length > 0 && <div style={styles.nullBox}>NULL</div>}
          </div>
        </div>
      )}
    </div>
  );
}
