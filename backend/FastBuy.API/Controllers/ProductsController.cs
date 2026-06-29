using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FastBuy.API.Data;
using FastBuy.API.DTOs;
using FastBuy.API.Models;
using FastBuy.API.Services;

namespace FastBuy.API.Controllers;

[ApiController]
[Route("api/products")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly AppDbContext _db;

    public ProductsController(IProductService productService, AppDbContext db)
    {
        _productService = productService;
        _db = db;
    }

    // Listagem com filtros e ordenação manual por algoritmo acadêmico
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int? categoryId,
        [FromQuery] string? sortBy, [FromQuery] string? sortAlgorithm)
    {
        var products = await _productService.GetAll(search, categoryId);

        if (!string.IsNullOrEmpty(sortBy) && !string.IsNullOrEmpty(sortAlgorithm))
            products = ApplySort(products, sortBy, sortAlgorithm);

        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _productService.GetById(id);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpGet("barcode/{barcode}")]
    public async Task<IActionResult> GetByBarcode(string barcode)
    {
        var product = await _productService.GetByBarcode(barcode);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProductDto dto)
    {
        var product = await _productService.Create(dto);
        return Created($"api/products/{product.Id}", product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductDto dto)
    {
        var product = await _productService.Update(id, dto);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _productService.Delete(id);
        if (!result) return NotFound();
        return NoContent();
    }

    // ==========================================
    // MATRIZ DE PRODUTOS (Matriz Bidimensional)
    // Estrutura de dados acadêmica: string[,]
    // Representa produtos em formato tabular (linhas x colunas)
    // ==========================================

    // Gera matriz bidimensional com dados dos produtos via LINQ
    [HttpGet("matrix")]
    public async Task<IActionResult> GetMatrix()
    {
        var products = await _db.Products.Include(p => p.Category).Where(p => p.Active).ToListAsync();

        var headers = new[] { "Nome", "Código", "Categoria", "Quantidade", "Preço Custo", "Preço Venda" };
        var data = new List<string[]> { headers };
        data.AddRange(products.Select(p => new[] {
            p.Name, p.Barcode, p.Category?.Name ?? "", p.CurrentStock.ToString(),
            p.CostPrice.ToString("F2"), p.SalePrice.ToString("F2")
        }));

        return Ok(new { rows = data.Count, cols = headers.Length, data });
    }

    // ==========================================
    // ALGORITMOS DE ORDENAÇÃO MANUAL
    // Estrutura de dados acadêmica: implementação manual
    // Cada algoritmo ordena sem usar .Sort() ou LINQ OrderBy
    // Critérios: name, price, stock
    // ==========================================

    // Endpoint que recebe algoritmo e critério, ordena manualmente
    [HttpPost("sort")]
    public async Task<IActionResult> Sort([FromBody] SortRequest request)
    {
        var products = await _db.Products.Include(p => p.Category).Where(p => p.Active).ToListAsync();
        return Ok(ApplySort(products, request.Criteria, request.Algorithm));
    }

    // Seleciona algoritmo de ordenação manual conforme parâmetro
    private static List<Product> ApplySort(List<Product> products, string criteria, string algorithm)
    {
        return algorithm.ToLower() switch
        {
            "bubble" => BubbleSort(products, criteria),
            "insertion" => InsertionSort(products, criteria),
            "quick" => QuickSort(products, criteria),
            "merge" => MergeSort(products, criteria),
            _ => products
        };
    }

    // Compara dois produtos pelo critério escolhido (name, price ou stock)
    private static int Compare(Product a, Product b, string criteria)
    {
        return criteria.ToLower() switch
        {
            "name" => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase),
            "price" => a.SalePrice.CompareTo(b.SalePrice),
            "stock" => a.CurrentStock.CompareTo(b.CurrentStock),
            _ => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase)
        };
    }

    // BubbleSort — O(n²): percorre pares adjacentes, trocando quando fora de ordem
    // Repete até nenhuma troca ser necessária
    private static List<Product> BubbleSort(List<Product> products, string criteria)
    {
        var list = new List<Product>(products);
        for (int i = 0; i < list.Count - 1; i++)
            for (int j = 0; j < list.Count - i - 1; j++)
                if (Compare(list[j], list[j + 1], criteria) > 0)
                    (list[j], list[j + 1]) = (list[j + 1], list[j]);
        return list;
    }

    // InsertionSort — O(n²): insere cada elemento na posição correta da sublista ordenada
    // Eficiente para listas quase ordenadas
    private static List<Product> InsertionSort(List<Product> products, string criteria)
    {
        var list = new List<Product>(products);
        for (int i = 1; i < list.Count; i++)
        {
            var key = list[i];
            int j = i - 1;
            // Desloca elementos maiores para a direita
            while (j >= 0 && Compare(list[j], key, criteria) > 0)
            {
                list[j + 1] = list[j];
                j--;
            }
            list[j + 1] = key;
        }
        return list;
    }

    // QuickSort — O(n log n) médio: particiona a lista em torno de um pivô
    // Elementos menores à esquerda, maiores à direita, recursivo
    private static List<Product> QuickSort(List<Product> products, string criteria)
    {
        var list = new List<Product>(products);
        QuickSortRecursive(list, 0, list.Count - 1, criteria);
        return list;
    }

    // Chamada recursiva do QuickSort: divide em sublistas e ordena cada metade
    private static void QuickSortRecursive(List<Product> list, int low, int high, string criteria)
    {
        if (low < high)
        {
            int pi = Partition(list, low, high, criteria);
            QuickSortRecursive(list, low, pi - 1, criteria);
            QuickSortRecursive(list, pi + 1, high, criteria);
        }
    }

    // Particiona a lista: último elemento como pivô, reorganiza menores à esquerda
    private static int Partition(List<Product> list, int low, int high, string criteria)
    {
        var pivot = list[high];
        int i = low - 1;
        for (int j = low; j < high; j++)
        {
            if (Compare(list[j], pivot, criteria) <= 0)
            {
                i++;
                (list[i], list[j]) = (list[j], list[i]);
            }
        }
        (list[i + 1], list[high]) = (list[high], list[i + 1]);
        return i + 1;
    }

    // MergeSort — O(n log n): divide a lista ao meio recursivamente, depois intercala
    // Sempre O(n log n) independente da entrada
    private static List<Product> MergeSort(List<Product> products, string criteria)
    {
        var list = new List<Product>(products);
        if (list.Count <= 1) return list;
        return MergeSortRecursive(list, criteria);
    }

    // Divide a lista ao meio e ordena cada metade recursivamente
    private static List<Product> MergeSortRecursive(List<Product> list, string criteria)
    {
        if (list.Count <= 1) return list;

        int mid = list.Count / 2;
        var left = MergeSortRecursive(list.GetRange(0, mid), criteria);
        var right = MergeSortRecursive(list.GetRange(mid, list.Count - mid), criteria);

        return Merge(left, right, criteria);
    }

    // Intercala duas listas ordenadas em uma única lista ordenada
    private static List<Product> Merge(List<Product> left, List<Product> right, string criteria)
    {
        var result = new List<Product>();
        int i = 0, j = 0;

        // Compara elemento a elemento, inserindo o menor primeiro
        while (i < left.Count && j < right.Count)
        {
            if (Compare(left[i], right[j], criteria) <= 0)
                result.Add(left[i++]);
            else
                result.Add(right[j++]);
        }

        // Adiciona elementos restantes de cada metade
        while (i < left.Count) result.Add(left[i++]);
        while (j < right.Count) result.Add(right[j++]);

        return result;
    }
}

// DTO para requisição de ordenação
public class SortRequest
{
    public string Algorithm { get; set; } = "bubble";
    public string Criteria { get; set; } = "name";
}
