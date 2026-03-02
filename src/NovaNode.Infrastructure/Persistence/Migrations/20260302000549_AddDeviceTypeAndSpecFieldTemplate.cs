using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaNode.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceTypeAndSpecFieldTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeviceType",
                table: "Items",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SpecFieldTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DeviceType = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    OptionsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecFieldTemplates", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SpecFieldTemplates_TenantId_Label_DeviceType",
                table: "SpecFieldTemplates",
                columns: new[] { "TenantId", "Label", "DeviceType" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SpecFieldTemplates");

            migrationBuilder.DropColumn(
                name: "DeviceType",
                table: "Items");
        }
    }
}
