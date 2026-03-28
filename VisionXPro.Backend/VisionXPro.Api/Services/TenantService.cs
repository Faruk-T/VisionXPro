using Microsoft.AspNetCore.Http;
using System;
using VisionXPro.Application.Interfaces;

namespace VisionXPro.Api.Services
{
    public class TenantService : ITenantService
    {
        private Guid _organizationId;
        private Guid? _branchId;

        public Guid GetOrganizationId() => _organizationId;
        public Guid? GetBranchId() => _branchId;

        public void SetTenant(Guid organizationId, Guid? branchId)
        {
            _organizationId = organizationId;
            _branchId = branchId;
        }
    }
}
