using FastBuy.API.Models;

namespace FastBuy.API.DataStructures;

// Fila de atendimento de clientes - demonstra estrutura de dados FIFO (First In, First Out)
public class ClientQueue
{
    private readonly Queue<Client> _queue = new();

    public void EnqueueClient(Client client) => _queue.Enqueue(client);

    public Client DequeueClient() => _queue.Dequeue();

    public Client PeekClient() => _queue.Peek();

    public List<Client> GetQueue() => _queue.ToList();

    public int Count => _queue.Count;
}
