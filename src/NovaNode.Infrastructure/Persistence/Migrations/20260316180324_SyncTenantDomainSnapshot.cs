using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaNode.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SyncTenantDomainSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('Tenants', 'CustomDomain') IS NULL
    ALTER TABLE [Tenants] ADD [CustomDomain] nvarchar(255) NULL;

IF COL_LENGTH('Tenants', 'CustomDomainIsActive') IS NULL
    ALTER TABLE [Tenants] ADD [CustomDomainIsActive] bit NOT NULL CONSTRAINT [DF_Tenants_CustomDomainIsActive] DEFAULT(0);

IF COL_LENGTH('Tenants', 'CustomDomainVerificationStatus') IS NULL
    ALTER TABLE [Tenants] ADD [CustomDomainVerificationStatus] int NOT NULL CONSTRAINT [DF_Tenants_CustomDomainVerificationStatus] DEFAULT(0);

IF COL_LENGTH('Tenants', 'CustomDomainVerifiedAt') IS NULL
    ALTER TABLE [Tenants] ADD [CustomDomainVerifiedAt] datetime2 NULL;

IF COL_LENGTH('Tenants', 'FallbackSubdomain') IS NULL
    ALTER TABLE [Tenants] ADD [FallbackSubdomain] nvarchar(100) NOT NULL CONSTRAINT [DF_Tenants_FallbackSubdomain] DEFAULT('');

IF COL_LENGTH('Tenants', 'PrimaryDomain') IS NULL
    ALTER TABLE [Tenants] ADD [PrimaryDomain] nvarchar(255) NOT NULL CONSTRAINT [DF_Tenants_PrimaryDomain] DEFAULT('');

IF COL_LENGTH('Tenants', 'RedirectFallbackToPrimary') IS NULL
    ALTER TABLE [Tenants] ADD [RedirectFallbackToPrimary] bit NOT NULL CONSTRAINT [DF_Tenants_RedirectFallbackToPrimary] DEFAULT(1);

IF COL_LENGTH('Tenants', 'FallbackSubdomain') IS NOT NULL
    EXEC('UPDATE [Tenants] SET [FallbackSubdomain] = [Slug] WHERE ([FallbackSubdomain] IS NULL OR [FallbackSubdomain] = '''') AND [Slug] IS NOT NULL;');

IF COL_LENGTH('Tenants', 'PrimaryDomain') IS NOT NULL AND COL_LENGTH('Tenants', 'FallbackSubdomain') IS NOT NULL
    EXEC('UPDATE [Tenants] SET [PrimaryDomain] = LOWER([FallbackSubdomain]) + ''.mobilytics.app'' WHERE ([PrimaryDomain] IS NULL OR [PrimaryDomain] = '''') AND [FallbackSubdomain] IS NOT NULL AND [FallbackSubdomain] <> '''';');

IF COL_LENGTH('Tenants', 'CustomDomain') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tenants_CustomDomain' AND object_id = OBJECT_ID('Tenants'))
    EXEC('CREATE UNIQUE INDEX [IX_Tenants_CustomDomain] ON [Tenants]([CustomDomain]) WHERE [CustomDomain] IS NOT NULL;');

IF COL_LENGTH('Tenants', 'FallbackSubdomain') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tenants_FallbackSubdomain' AND object_id = OBJECT_ID('Tenants'))
    EXEC('CREATE UNIQUE INDEX [IX_Tenants_FallbackSubdomain] ON [Tenants]([FallbackSubdomain]);');

IF COL_LENGTH('Tenants', 'PrimaryDomain') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tenants_PrimaryDomain' AND object_id = OBJECT_ID('Tenants'))
    EXEC('CREATE INDEX [IX_Tenants_PrimaryDomain] ON [Tenants]([PrimaryDomain]);');
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op migration.
        }
    }
}
