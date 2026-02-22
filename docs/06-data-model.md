# Nova Node — Data Model

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Tenant    │───1:N─│ Subscription │───N:1─│    Plan     │
│             │       │              │       │             │
│  Name       │       │  Status      │       │  Name       │
│  Slug       │       │  StartDate   │       │  PriceMo    │
│  IsActive   │       │  EndDate     │       │  ActFee     │
└─────┬───────┘       └──────────────┘       └─────────────┘
      │
      ├───1:1── TenantFeatureToggle
      ├───1:1── StoreSettings
      ├───1:N── Employee ──1:N── Permission
      ├───1:N── Brand
      ├───1:N── Category (self-referencing: ParentId)
      ├───1:N── ItemType ──1:N── CustomFieldDefinition
      ├───1:N── Item ──1:N── InvoiceItem
      ├───1:N── Invoice ──1:N── InvoiceItem
      ├───1:N── ExpenseCategory ──1:N── Expense
      ├───1:N── Lead
      ├───1:N── HomeSection ──1:N── HomeSectionItem
      └───1:N── AuditLog
```

## Entities

### Tenant (Platform)
| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| Name | string | Required |
| Slug | string | Unique, URL-safe |
| IsActive | bool | Default: true |
| SupportPhone | string? | |
| SupportWhatsApp | string? | |
| Address | string? | |
| MapUrl | string? | |
| CreatedAt | DateTime | Auto-set |
| UpdatedAt | DateTime? | Auto-set |

### Plan (Platform)
| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| Name | string | Required |
| PriceMonthly | decimal | |
| ActivationFee | decimal | |
| LimitsJson | string? | JSON: item/employee limits |
| FeaturesJson | string? | JSON: feature flags |
| IsActive | bool | Default: true |

### Subscription (Platform)
| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| TenantId | Guid | FK → Tenant |
| PlanId | Guid | FK → Plan |
| Status | SubscriptionStatus | Enum |
| TrialStart | DateTime? | |
| TrialEnd | DateTime? | |
| StartDate | DateTime? | |
| EndDate | DateTime? | |
| GraceEnd | DateTime? | |
| LastPaymentAmount | decimal? | |
| Notes | string? | |

### Employee (Tenant-Scoped)
| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| TenantId | Guid | FK → Tenant |
| Name | string | Required |
| Phone | string? | |
| Email | string | Unique per tenant |
| PasswordHash | string | BCrypt |
| Role | string | "Owner" / "Manager" |
| SalaryMonthly | decimal? | |
| IsActive | bool | Default: true |

### Item (Tenant-Scoped)
| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| TenantId | Guid | FK → Tenant |
| ItemTypeId | Guid | FK → ItemType |
| BrandId | Guid? | FK → Brand |
| CategoryId | Guid? | FK → Category |
| Title | string | Required |
| Slug | string | Unique per tenant |
| Description | string? | |
| Price | decimal | |
| OldPrice | decimal? | For "was/now" display |
| TaxStatus | TaxStatus | Enum: Taxable/Exempt |
| VatPercent | decimal | Default: 14% |
| Condition | ItemCondition | Enum |
| BatteryHealth | int? | 0-100% |
| IMEI | string? | |
| SerialNumber | string? | |
| WarrantyType | WarrantyType | Enum |
| WarrantyMonths | int? | |
| Quantity | int | Default: 1 |
| Status | ItemStatus | Enum |
| MainImageUrl | string? | |
| GalleryImagesJson | string? | JSON array |
| ChecklistJson | string? | JSON object |
| CustomFieldsJson | string? | JSON object |
| IsFeatured | bool | Default: false |

### Invoice (Tenant-Scoped)
| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| TenantId | Guid | FK → Tenant |
| InvoiceNumber | string | Auto-generated |
| CustomerName | string? | |
| CustomerPhone | string? | |
| Subtotal | decimal | |
| Discount | decimal | |
| VatAmount | decimal | |
| Total | decimal | |
| PaymentMethod | string | |
| Notes | string? | |
| CreatedByUserId | Guid | |
| IsRefund | bool | |
| OriginalInvoiceId | Guid? | FK → Invoice (self) |

### Lead (Tenant-Scoped)
| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| TenantId | Guid | FK → Tenant |
| Source | LeadSource | Enum |
| CustomerName | string? | |
| CustomerPhone | string? | |
| TargetItemId | Guid? | FK → Item |
| TargetTitleSnapshot | string? | Denormalized |
| TargetPriceSnapshot | decimal? | Denormalized |
| PageUrl | string? | |
| ButtonLocation | string? | |
| Status | LeadStatus | Enum |

## Enumerations

### SubscriptionStatus
`Trial` · `Active` · `Grace` · `Expired` · `Suspended`

### ItemCondition
`New` · `Used` · `Refurbished`

### ItemStatus
`Available` · `Reserved` · `Sold` · `Hidden`

### TaxStatus
`Taxable` · `Exempt`

### WarrantyType
`Manufacturer` · `Store` · `Extended` · `None`

### LeadSource
`WhatsAppClick` · `FollowUpRequest` · `Inquiry`

### LeadStatus
`New` · `Interested` · `NoResponse` · `Sold`

### HomeSectionType
`BannerSlider` · `FeaturedItems` · `NewArrivals` · `CategoriesShowcase` · `BrandsCarousel` · `Testimonials` · `CustomHtml`

### CustomFieldType
`Text` · `Number` · `Boolean` · `Select`
