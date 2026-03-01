using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaNode.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MergeItemTypeIntoCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomFieldDefinitions_ItemTypes_ItemTypeId",
                table: "CustomFieldDefinitions");

            migrationBuilder.DropForeignKey(
                name: "FK_Items_Categories_CategoryId",
                table: "Items");

            migrationBuilder.DropForeignKey(
                name: "FK_Items_ItemTypes_ItemTypeId",
                table: "Items");

            migrationBuilder.AlterColumn<Guid>(
                name: "ItemTypeId",
                table: "Items",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "CustomFieldDefinitions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDevice",
                table: "Categories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsStockItem",
                table: "Categories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsBatteryHealth",
                table: "Categories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsIMEI",
                table: "Categories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsSerial",
                table: "Categories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsWarranty",
                table: "Categories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            // Backfill capability flags from ItemTypes to matching Categories (by name/tenant)
            migrationBuilder.Sql(@"
                UPDATE c SET
                    c.IsDevice = ISNULL(it.IsDevice, 0),
                    c.IsStockItem = ISNULL(it.IsStockItem, 0),
                    c.SupportsIMEI = ISNULL(it.SupportsIMEI, 0),
                    c.SupportsSerial = ISNULL(it.SupportsSerial, 0),
                    c.SupportsBatteryHealth = ISNULL(it.SupportsBatteryHealth, 0),
                    c.SupportsWarranty = ISNULL(it.SupportsWarranty, 0)
                FROM Categories c
                INNER JOIN ItemTypes it ON it.TenantId = c.TenantId AND it.Name = c.Name;
            ");

            // Data migration: For any items missing a CategoryId, assign from existing category
            migrationBuilder.Sql(@"
                -- Assign first available category for items with NULL CategoryId
                UPDATE i SET i.CategoryId = (
                    SELECT TOP 1 c.Id FROM Categories c WHERE c.TenantId = i.TenantId ORDER BY c.Name
                )
                FROM Items i
                WHERE i.CategoryId IS NULL
                  AND EXISTS (SELECT 1 FROM Categories c2 WHERE c2.TenantId = i.TenantId);

                -- For tenants with no categories, create a fallback
                INSERT INTO Categories (Id, TenantId, Name, Slug, IsDevice, IsStockItem, SupportsIMEI, SupportsSerial, SupportsBatteryHealth, SupportsWarranty)
                SELECT NEWID(), i.TenantId, 'Uncategorized', 'uncategorized', 0, 0, 0, 0, 0, 0
                FROM Items i
                WHERE i.CategoryId IS NULL
                GROUP BY i.TenantId;

                -- Assign the uncategorized category
                UPDATE i SET i.CategoryId = (
                    SELECT TOP 1 c.Id FROM Categories c WHERE c.TenantId = i.TenantId AND c.Slug = 'uncategorized'
                )
                FROM Items i
                WHERE i.CategoryId IS NULL;
            ");

            migrationBuilder.AlterColumn<Guid>(
                name: "CategoryId",
                table: "Items",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomFieldDefinitions_CategoryId",
                table: "CustomFieldDefinitions",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomFieldDefinitions_Categories_CategoryId",
                table: "CustomFieldDefinitions",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_CustomFieldDefinitions_ItemTypes_ItemTypeId",
                table: "CustomFieldDefinitions",
                column: "ItemTypeId",
                principalTable: "ItemTypes",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Items_Categories_CategoryId",
                table: "Items",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Items_ItemTypes_ItemTypeId",
                table: "Items",
                column: "ItemTypeId",
                principalTable: "ItemTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomFieldDefinitions_Categories_CategoryId",
                table: "CustomFieldDefinitions");

            migrationBuilder.DropForeignKey(
                name: "FK_CustomFieldDefinitions_ItemTypes_ItemTypeId",
                table: "CustomFieldDefinitions");

            migrationBuilder.DropForeignKey(
                name: "FK_Items_Categories_CategoryId",
                table: "Items");

            migrationBuilder.DropForeignKey(
                name: "FK_Items_ItemTypes_ItemTypeId",
                table: "Items");

            migrationBuilder.DropIndex(
                name: "IX_CustomFieldDefinitions_CategoryId",
                table: "CustomFieldDefinitions");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "CustomFieldDefinitions");

            migrationBuilder.DropColumn(
                name: "IsDevice",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "IsStockItem",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "SupportsBatteryHealth",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "SupportsIMEI",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "SupportsSerial",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "SupportsWarranty",
                table: "Categories");

            migrationBuilder.AlterColumn<Guid>(
                name: "ItemTypeId",
                table: "Items",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "CategoryId",
                table: "Items",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomFieldDefinitions_ItemTypes_ItemTypeId",
                table: "CustomFieldDefinitions",
                column: "ItemTypeId",
                principalTable: "ItemTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Items_Categories_CategoryId",
                table: "Items",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Items_ItemTypes_ItemTypeId",
                table: "Items",
                column: "ItemTypeId",
                principalTable: "ItemTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
