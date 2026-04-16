using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace VisionXPro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly string _configFilePath = "system_config.json";

        public class SystemConfig
        {
            public bool MaintenanceMode { get; set; }
        }

        [HttpGet("maintenance")]
        public async Task<IActionResult> GetMaintenanceStatus()
        {
            if (!System.IO.File.Exists(_configFilePath))
                return Ok(new { maintenanceMode = false });

            var json = await System.IO.File.ReadAllTextAsync(_configFilePath);
            var config = JsonSerializer.Deserialize<SystemConfig>(json);
            return Ok(new { maintenanceMode = config?.MaintenanceMode ?? false });
        }

        [HttpPost("maintenance")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> ToggleMaintenance([FromBody] SystemConfig request)
        {
            var config = new SystemConfig { MaintenanceMode = request.MaintenanceMode };
            var json = JsonSerializer.Serialize(config);
            await System.IO.File.WriteAllTextAsync(_configFilePath, json);
            
            return Ok(new { success = true, maintenanceMode = config.MaintenanceMode });
        }
    }
}
