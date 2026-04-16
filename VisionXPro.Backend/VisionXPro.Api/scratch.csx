using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using VisionXPro.Persistence;
using VisionXPro.Domain.Entities;

var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
optionsBuilder.UseSqlServer("Server=.;Database=VisionXProDb;Trusted_Connection=True;MultipleActiveResultSets=true;Encrypt=False");

using (var db = new AppDbContext(optionsBuilder.Options))
{
    var apts = db.Appointments.Include(a => a.Customer).ToList();
    var orgs = db.Organizations.ToList();
    Console.WriteLine("-------------------------------------------------");
    Console.WriteLine($"Total appointments: {apts.Count}");
    
    foreach(var a in apts)
    {
        var orgName = orgs.FirstOrDefault(o => o.Id == a.OrganizationId)?.Name;
        Console.WriteLine($"Apt Id: {a.Id}");
        Console.WriteLine($"Org: {orgName}");
        Console.WriteLine($"Customer: {a.Customer?.FirstName} {a.Customer?.LastName}");
        Console.WriteLine($"Date: {a.AppointmentDate.ToString("yyyy-MM-dd HH:mm")}");
        Console.WriteLine("-------------------------------------------------");
    }
}
