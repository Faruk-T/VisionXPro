using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VisionXPro.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentStaffType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AppointmentType",
                table: "Appointments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssignedStaffName",
                table: "Appointments",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AppointmentType",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "AssignedStaffName",
                table: "Appointments");
        }
    }
}
