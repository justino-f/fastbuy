using FastBuy.API.Models;

namespace FastBuy.API.DataStructures;

// Algoritmos de ordenação implementados manualmente para fins acadêmicos
public static class ProductSorter
{
    // Bubble Sort - O(n²): compara pares adjacentes e troca se necessário
    public static List<Product> BubbleSort(List<Product> products, string criteria)
    {
        var list = new List<Product>(products);
        for (int i = 0; i < list.Count - 1; i++)
        {
            for (int j = 0; j < list.Count - i - 1; j++)
            {
                if (Compare(list[j], list[j + 1], criteria) > 0)
                {
                    (list[j], list[j + 1]) = (list[j + 1], list[j]);
                }
            }
        }
        return list;
    }

    // Insertion Sort - O(n²): insere cada elemento na posição correta da sublista ordenada
    public static List<Product> InsertionSort(List<Product> products, string criteria)
    {
        var list = new List<Product>(products);
        for (int i = 1; i < list.Count; i++)
        {
            var key = list[i];
            int j = i - 1;
            while (j >= 0 && Compare(list[j], key, criteria) > 0)
            {
                list[j + 1] = list[j];
                j--;
            }
            list[j + 1] = key;
        }
        return list;
    }

    // Quick Sort - O(n log n) médio: particiona em torno de um pivô
    public static List<Product> QuickSort(List<Product> products, string criteria)
    {
        var list = new List<Product>(products);
        QuickSortRecursive(list, 0, list.Count - 1, criteria);
        return list;
    }

    private static void QuickSortRecursive(List<Product> list, int low, int high, string criteria)
    {
        if (low < high)
        {
            int pi = Partition(list, low, high, criteria);
            QuickSortRecursive(list, low, pi - 1, criteria);
            QuickSortRecursive(list, pi + 1, high, criteria);
        }
    }

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

    // Merge Sort - O(n log n): divide ao meio, ordena recursivamente e intercala
    public static List<Product> MergeSort(List<Product> products, string criteria)
    {
        var list = new List<Product>(products);
        if (list.Count <= 1) return list;
        return MergeSortRecursive(list, criteria);
    }

    private static List<Product> MergeSortRecursive(List<Product> list, string criteria)
    {
        if (list.Count <= 1) return list;

        int mid = list.Count / 2;
        var left = MergeSortRecursive(list.GetRange(0, mid), criteria);
        var right = MergeSortRecursive(list.GetRange(mid, list.Count - mid), criteria);

        return Merge(left, right, criteria);
    }

    private static List<Product> Merge(List<Product> left, List<Product> right, string criteria)
    {
        var result = new List<Product>();
        int i = 0, j = 0;

        while (i < left.Count && j < right.Count)
        {
            if (Compare(left[i], right[j], criteria) <= 0)
                result.Add(left[i++]);
            else
                result.Add(right[j++]);
        }

        while (i < left.Count) result.Add(left[i++]);
        while (j < right.Count) result.Add(right[j++]);

        return result;
    }

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
}
