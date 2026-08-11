using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VisionXPro.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesRepresentativeToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Origin",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PriceUpdateDate",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SalesChannel",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SalesRepresentative",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Origin",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PriceUpdateDate",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SalesChannel",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SalesRepresentative",
                table: "Orders");
        }
    }
}
