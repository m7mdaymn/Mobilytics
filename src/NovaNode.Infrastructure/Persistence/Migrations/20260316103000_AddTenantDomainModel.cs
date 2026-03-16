using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaNode.Infrastructure.Persistence.Migrations
{
    public partial class AddTenantDomainModel : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomDomain",
                table: "Tenants",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CustomDomainIsActive",
                table: "Tenants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "CustomDomainVerifiedAt",
                table: "Tenants",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CustomDomainVerificationStatus",
                table: "Tenants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "FallbackSubdomain",
                table: "Tenants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PrimaryDomain",
                table: "Tenants",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "RedirectFallbackToPrimary",
                table: "Tenants",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.Sql("UPDATE Tenants SET FallbackSubdomain = Slug WHERE FallbackSubdomain = '' OR FallbackSubdomain IS NULL");
            migrationBuilder.Sql("UPDATE Tenants SET PrimaryDomain = LOWER(FallbackSubdomain) + '.mobilytics.app' WHERE PrimaryDomain = '' OR PrimaryDomain IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_CustomDomain",
                table: "Tenants",
                column: "CustomDomain",
                unique: true,
                filter: "[CustomDomain] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_FallbackSubdomain",
                table: "Tenants",
                column: "FallbackSubdomain",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_PrimaryDomain",
                table: "Tenants",
                column: "PrimaryDomain");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Tenants_CustomDomain", table: "Tenants");
            migrationBuilder.DropIndex(name: "IX_Tenants_FallbackSubdomain", table: "Tenants");
            migrationBuilder.DropIndex(name: "IX_Tenants_PrimaryDomain", table: "Tenants");

            migrationBuilder.DropColumn(name: "CustomDomain", table: "Tenants");
            migrationBuilder.DropColumn(name: "CustomDomainIsActive", table: "Tenants");
            migrationBuilder.DropColumn(name: "CustomDomainVerifiedAt", table: "Tenants");
            migrationBuilder.DropColumn(name: "CustomDomainVerificationStatus", table: "Tenants");
            migrationBuilder.DropColumn(name: "FallbackSubdomain", table: "Tenants");
            migrationBuilder.DropColumn(name: "PrimaryDomain", table: "Tenants");
            migrationBuilder.DropColumn(name: "RedirectFallbackToPrimary", table: "Tenants");
        }
    }
}
