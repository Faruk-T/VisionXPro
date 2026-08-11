using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VisionXPro.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddShopSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShopSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StoreName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TaxOffice = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TaxNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MedulaFacilityCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MedulaPassword = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MedulaRegistryNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtsToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtsGlnCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SmsProvider = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SmsApiToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SmsSenderHeader = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SmsReadyNotification = table.Column<bool>(type: "bit", nullable: false),
                    SmsBirthdayCampaign = table.Column<bool>(type: "bit", nullable: false),
                    ReceiptFooter = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ShowPriceOnLabel = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BranchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShopSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShopSettings");
        }
    }
}
