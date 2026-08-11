using System;
using System.Collections.Generic;
using System.Linq;

namespace VisionXPro.Application.Authorization
{
    public static class StaffPermissions
    {
        public const string Pos = "POS";
        public const string Stock = "Stok";
        public const string Reports = "Raporlar";
        public const string Returns = "İade";
        public const string OpticOrder = "Optik Sipariş";
        public const string Prescription = "Reçete";
        public const string Finance = "Kasa İşlemleri";
        public const string Appointments = "Randevu";

        public static readonly string[] AllShop =
        {
            Pos, Stock, Reports, Returns, OpticOrder, Prescription, Finance, Appointments
        };

        private static readonly Dictionary<string, string[]> JobTitleMap =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ["Mağaza Müdürü"] = AllShop,
                ["Satış Danışmanı"] = new[] { Pos, Stock },
                ["Optisyen"] = new[] { OpticOrder, Stock, Prescription, Appointments },
                ["Kasiyer"] = new[] { Pos, Finance },
                ["Stok Sorumlusu"] = new[] { Stock },
            };

        public static IReadOnlyList<string> Resolve(string role, string? jobTitle)
        {
            if (role is "ShopOwner" or "SuperAdmin" or "CorporateOwner")
                return AllShop;

            if (role != "ShopStaff")
                return Array.Empty<string>();

            if (!string.IsNullOrWhiteSpace(jobTitle) &&
                JobTitleMap.TryGetValue(jobTitle.Trim(), out var mapped))
                return mapped;

            return new[] { Pos, Stock };
        }

        public static string ToClaimValue(IEnumerable<string> permissions) =>
            string.Join(',', permissions.Distinct(StringComparer.OrdinalIgnoreCase));

        public static bool HasPermission(IEnumerable<string> permissions, string required) =>
            permissions.Any(p => string.Equals(p, required, StringComparison.OrdinalIgnoreCase));
    }
}
