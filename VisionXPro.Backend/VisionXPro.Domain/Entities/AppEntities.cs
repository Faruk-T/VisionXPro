using System;
using System.Collections.Generic;

namespace VisionXPro.Domain.Entities
{
    public abstract class BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; }
    }

    public abstract class TenantEntity : BaseEntity
    {
        public Guid OrganizationId { get; set; }
    }

    public abstract class BranchTenantEntity : TenantEntity
    {
        public Guid BranchId { get; set; }
    }

    public class Organization : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? TaxNumber { get; set; }
        public string? SubscriptionPlan { get; set; }
        public bool IsActive { get; set; } = true;

        public DateTime? LicenseStartDate { get; set; }
        public DateTime? LicenseEndDate { get; set; }
        public bool IsTrial { get; set; } = false;
    }

    public class Branch : BaseEntity
    {
        public Guid OrganizationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? GlNCode { get; set; }
        public string? City { get; set; }
    }

    public class User : BranchTenantEntity
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public Guid? RoleId { get; set; }
        public string Role { get; set; } = "Customer"; // SuperAdmin, ShopOwner, Customer
        public bool IsActive { get; set; } = true;
    }

    public class Role : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Permissions { get; set; } = string.Empty;
    }

    public class Customer : BranchTenantEntity
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string NationalId { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateTime? BirthDate { get; set; }
        public decimal CreditBalance { get; set; }
    }

    public class Appointment : BranchTenantEntity
    {
        public Guid CustomerId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class Product : TenantEntity
    {
        public string Barcode { get; set; } = string.Empty;
        public string? UtsCode { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public decimal PurchasePrice { get; set; }
        public decimal SalePrice { get; set; }
    }

    public class InventoryItem : BranchTenantEntity
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
        public string? SerialNumber { get; set; }
    }

    public class Transfer : TenantEntity
    {
        public Guid FromBranchId { get; set; }
        public Guid ToBranchId { get; set; }
        public string Status { get; set; } = string.Empty;
        public Guid RequestedBy { get; set; }
        public Guid? ApprovedBy { get; set; }
        public DateTime TransferDate { get; set; }
    }

    public class Prescription : BaseEntity
    {
        public Guid CustomerId { get; set; }
        public string? DoctorName { get; set; }
        public string? HospitalName { get; set; }
        public DateTime PrescriptionDate { get; set; }
        
        public decimal? RightSph { get; set; }
        public decimal? RightCyl { get; set; }
        public int? RightAxis { get; set; }
        public int? RightPD { get; set; }

        public decimal? LeftSph { get; set; }
        public decimal? LeftCyl { get; set; }
        public int? LeftAxis { get; set; }
        public int? LeftPD { get; set; }

        public decimal? Addition { get; set; }
    }

    public class Order : BranchTenantEntity
    {
        public Guid CustomerId { get; set; }
        public Guid? PrescriptionId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public Guid CreatedBy { get; set; }
        
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }

    public class OrderItem : BaseEntity
    {
        public Guid OrderId { get; set; }
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? LensDetails { get; set; }
    }

    public class Transaction : BranchTenantEntity
    {
        public Guid? OrderId { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; }
        public Guid CreatedBy { get; set; }
    }

    public class AuditLog : BaseEntity
    {
        public Guid? UserId { get; set; }
        public string TableName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
