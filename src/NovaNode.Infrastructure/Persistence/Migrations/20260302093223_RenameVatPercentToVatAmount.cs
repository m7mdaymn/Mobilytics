using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaNode.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameVatPercentToVatAmount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "VatPercent",
                table: "Items",
                newName: "VatAmount");

            migrationBuilder.RenameColumn(
                name: "VatPercentSnapshot",
                table: "InvoiceItems",
                newName: "VatAmountSnapshot");

            migrationBuilder.AlterColumn<decimal>(
                name: "VatAmount",
                table: "Items",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "VatAmountSnapshot",
                table: "InvoiceItems",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "VatAmountSnapshot",
                table: "InvoiceItems",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "VatAmount",
                table: "Items",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.RenameColumn(
                name: "VatAmount",
                table: "Items",
                newName: "VatPercent");

            migrationBuilder.RenameColumn(
                name: "VatAmountSnapshot",
                table: "InvoiceItems",
                newName: "VatPercentSnapshot");
        }
    }
}
