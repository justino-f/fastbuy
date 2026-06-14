using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FastBuy.API.Models;
using FastBuy.API.Services;

namespace FastBuy.API.Controllers;

[ApiController]
[Route("api/suppliers")]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;

    public SuppliersController(ISupplierService supplierService) => _supplierService = supplierService;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _supplierService.GetAll());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Supplier supplier)
    {
        var created = await _supplierService.Create(supplier);
        return Created($"api/suppliers/{created.Id}", created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Supplier supplier)
    {
        var updated = await _supplierService.Update(id, supplier);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _supplierService.Delete(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
