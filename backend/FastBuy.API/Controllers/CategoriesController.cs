using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FastBuy.API.Services;

namespace FastBuy.API.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService) => _categoryService = categoryService;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _categoryService.GetAll());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CategoryRequest request)
    {
        var category = await _categoryService.Create(request.Name);
        return Created($"api/categories/{category.Id}", category);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryRequest request)
    {
        var category = await _categoryService.Update(id, request.Name);
        if (category == null) return NotFound();
        return Ok(category);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _categoryService.Delete(id);
        if (!result) return NotFound();
        return NoContent();
    }
}

public class CategoryRequest
{
    public string Name { get; set; } = string.Empty;
}
