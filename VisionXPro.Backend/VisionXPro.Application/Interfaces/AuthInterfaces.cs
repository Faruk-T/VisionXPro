using System;
using VisionXPro.Domain.Entities;

namespace VisionXPro.Application.Interfaces
{
    public interface IJwtProvider
    {
        string GenerateToken(User user);
    }
    
    public interface ITenantService
    {
        Guid GetOrganizationId();
        Guid? GetBranchId();
        void SetTenant(Guid organizationId, Guid? branchId);
    }
}
