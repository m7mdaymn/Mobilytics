using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaNode.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ThemePresets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccentColor",
                table: "StoreSettings");

            migrationBuilder.DropColumn(
                name: "PrimaryColor",
                table: "StoreSettings");

            migrationBuilder.DropColumn(
                name: "SecondaryColor",
                table: "StoreSettings");

            migrationBuilder.RenameColumn(
                name: "ThemeId",
                table: "StoreSettings",
                newName: "ThemePresetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ThemePresetId",
                table: "StoreSettings",
                newName: "ThemeId");

            migrationBuilder.AddColumn<string>(
                name: "AccentColor",
                table: "StoreSettings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrimaryColor",
                table: "StoreSettings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondaryColor",
                table: "StoreSettings",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
