using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaNode.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemThemeId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OfferBannerText",
                table: "StoreSettings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfferBannerUrl",
                table: "StoreSettings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SystemThemeId",
                table: "StoreSettings",
                type: "int",
                nullable: false,
                defaultValue: 4);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OfferBannerText",
                table: "StoreSettings");

            migrationBuilder.DropColumn(
                name: "OfferBannerUrl",
                table: "StoreSettings");

            migrationBuilder.DropColumn(
                name: "SystemThemeId",
                table: "StoreSettings");
        }
    }
}
