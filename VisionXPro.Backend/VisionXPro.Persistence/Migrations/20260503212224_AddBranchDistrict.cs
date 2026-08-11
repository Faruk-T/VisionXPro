using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VisionXPro.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchDistrict : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "District",
                table: "Branches",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "District",
                table: "Branches");
        }
    }
}
