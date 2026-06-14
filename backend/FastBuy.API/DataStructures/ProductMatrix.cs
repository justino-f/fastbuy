using FastBuy.API.Models;

namespace FastBuy.API.DataStructures;

// Matriz de produtos - demonstra uso de array bidimensional (Vetor/Matriz)
public static class ProductMatrix
{
    // Converte lista de produtos em matriz string[,]
    // Colunas: Nome, Código, Categoria, Quantidade, Preço Custo, Preço Venda
    public static string[,] ToMatrix(List<Product> products)
    {
        int rows = products.Count + 1;
        int cols = 6;
        var matrix = new string[rows, cols];

        matrix[0, 0] = "Nome";
        matrix[0, 1] = "Código";
        matrix[0, 2] = "Categoria";
        matrix[0, 3] = "Quantidade";
        matrix[0, 4] = "Preço Custo";
        matrix[0, 5] = "Preço Venda";

        for (int i = 0; i < products.Count; i++)
        {
            var p = products[i];
            matrix[i + 1, 0] = p.Name;
            matrix[i + 1, 1] = p.Barcode;
            matrix[i + 1, 2] = p.Category?.Name ?? "";
            matrix[i + 1, 3] = p.CurrentStock.ToString();
            matrix[i + 1, 4] = p.CostPrice.ToString("F2");
            matrix[i + 1, 5] = p.SalePrice.ToString("F2");
        }

        return matrix;
    }

    // Converte matriz para lista de arrays para serialização JSON
    public static List<string[]> ToList(string[,] matrix)
    {
        var result = new List<string[]>();
        int rows = matrix.GetLength(0);
        int cols = matrix.GetLength(1);

        for (int i = 0; i < rows; i++)
        {
            var row = new string[cols];
            for (int j = 0; j < cols; j++)
            {
                row[j] = matrix[i, j];
            }
            result.Add(row);
        }

        return result;
    }
}
