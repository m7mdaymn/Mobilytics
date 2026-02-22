# Nova Node — Subscription & Billing

## Overview

Nova Node implements a subscription-based access control system. Tenants must have an active subscription to use the platform. SuperAdmins manage subscriptions through platform endpoints.

## Subscription Lifecycle

```
[No Subscription] → Trial → Active → Grace → Expired
                                ↑         ↓
                                └─ Renew ←─┘
                                
Suspended (manual by SuperAdmin)
```

### Status Descriptions

| Status | Description | Access Level |
|--------|-------------|-------------|
| `Trial` | Free trial period | Full access |
| `Active` | Paid and current | Full access |
| `Grace` | Subscription ended, grace period | Read-only (GET only) |
| `Expired` | Grace period ended | Blocked (403) |
| `Suspended` | Manually suspended by SuperAdmin | Blocked (403) |

## Platform Endpoints

### Start Trial
```
POST /api/v1/platform/subscriptions/{tenantId}/trial
```
```json
{
  "planId": "guid",
  "trialDays": 14
}
```

### Activate Subscription
```
POST /api/v1/platform/subscriptions/{tenantId}/activate
```
```json
{
  "planId": "guid",
  "months": 12,
  "paymentAmount": 6000.00,
  "notes": "Annual payment"
}
```

### Renew Subscription
```
POST /api/v1/platform/subscriptions/{tenantId}/renew
```
```json
{
  "months": 1,
  "paymentAmount": 500.00,
  "notes": "Monthly renewal"
}
```

### List Expiring Subscriptions
```
GET /api/v1/platform/subscriptions/expiring?days=7
```

Returns subscriptions ending within the specified number of days.

## Plans

Plans define pricing and limits for tenants.

### Default Plan (Seeded)

| Field | Value |
|-------|-------|
| Name | Standard |
| Monthly Price | 500 EGP |
| Activation Fee | 1500 EGP |

### Plan Fields

| Field | Type | Description |
|-------|------|-------------|
| Name | string | Plan display name |
| PriceMonthly | decimal | Monthly subscription price |
| ActivationFee | decimal | One-time setup fee |
| LimitsJson | string? | JSON with item/employee limits |
| FeaturesJson | string? | JSON with feature flags |
| IsActive | bool | Can be assigned to tenants |

## Feature Toggles

Per-tenant feature flags stored in `TenantFeatureToggle`:

| Feature | Type | Default |
|---------|------|---------|
| CanRemovePoweredBy | bool | false |
| AdvancedReports | bool | false |

Managed via:
```
GET  /api/v1/platform/tenants/{id}/features
PUT  /api/v1/platform/tenants/{id}/features
```

## Enforcement Middleware

The `SubscriptionEnforcementMiddleware` runs on every request and enforces access based on subscription status:

1. Loads the tenant's latest subscription
2. Checks the status
3. Returns 403 for Expired/Suspended
4. Allows only GET requests during Grace period
5. Full access for Trial/Active

### Exempt Paths

Platform, auth, public, swagger, and uploads paths are always exempt from subscription checks.
