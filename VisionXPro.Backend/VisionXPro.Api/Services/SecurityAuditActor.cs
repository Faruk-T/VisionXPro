using VisionXPro.Domain.Entities;

namespace VisionXPro.Api.Services
{
    internal static class SecurityAuditActor
    {
        public static string BuildSummary(User? user, Organization? org, Branch? branch)
        {
            if (user == null)
                return "Kimliği bağlanmamış işlem";

            var optikAdi = org?.Name;
            var subeEk = BranchSuffix(branch);
            var kisi = user.FullName ?? "İsimsiz Kullanıcı";
            var roleSuffix = "";

            if (user.Role == "SuperAdmin")
                roleSuffix = " (Sistem Yöneticisi)";
            else if (user.Role == "CorporateOwner")
                roleSuffix = " (Kurumsal Hesap)";
            else if (user.Role == "Customer")
                roleSuffix = " (Müşteri)";

            if (!string.IsNullOrWhiteSpace(optikAdi))
            {
                if (string.IsNullOrWhiteSpace(subeEk))
                    return $"{optikAdi} — {kisi}{roleSuffix}";
                else
                    return $"{optikAdi} · {subeEk} — {kisi}{roleSuffix}";
            }

            return user.Role == "SuperAdmin" && string.IsNullOrWhiteSpace(user.FullName) 
                ? "Sistem yöneticisi" 
                : $"{kisi}{roleSuffix}";
        }

        public static string BranchSuffix(Branch? branch)
        {
            if (branch == null || string.IsNullOrWhiteSpace(branch.Name))
                return string.Empty;
            if (branch.Name.Equals("Merkez Şube", System.StringComparison.OrdinalIgnoreCase))
                return string.Empty;
            return $"Şube: {branch.Name}";
        }
    }
}
