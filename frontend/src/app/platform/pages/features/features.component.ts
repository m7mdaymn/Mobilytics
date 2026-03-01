import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Tenant, TenantFeatures, Plan } from '../../../core/models/platform.models';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-slate-800">Tenant Feature Toggles</h1>

      <!-- Tenant Selector -->
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div class="flex flex-col md:flex-row gap-4 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Select Tenant</label>
            <select [(ngModel)]="selectedTenantId" (ngModelChange)="onTenantSelect($event)"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400">
              <option value="">-- Choose a tenant --</option>
              @for (tenant of tenants(); track tenant.id) {
                <option [value]="tenant.id">{{ tenant.name }} ({{ tenant.slug }}) — {{ tenant.status }}</option>
              }
            </select>
          </div>
          @if (selectedTenant()?.subscription) {
            <div class="text-sm">
              <span class="text-slate-500">Plan:</span>
              <span class="font-semibold text-indigo-600 ml-1">{{ selectedTenant()!.subscription!.planName }}</span>
            </div>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      } @else if (selectedTenantId && features()) {
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 class="font-semibold text-slate-800">Feature Flags</h2>
              <p class="text-sm text-slate-500 mt-0.5">Toggle features for this tenant. These override plan defaults.</p>
            </div>
            @if (planFeatures()) {
              <button (click)="resetToDefaults()" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                Reset to Plan Defaults
              </button>
            }
          </div>

          <div class="divide-y divide-slate-100">
            @for (feat of featureItems; track feat.key) {
              <div class="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <p class="font-medium text-slate-800">{{ feat.label }}</p>
                    @if (planFeatures() && getFeatureValue(feat.key) !== getPlanFeatureValue(feat.key)) {
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">OVERRIDDEN</span>
                    }
                  </div>
                  <p class="text-sm text-slate-500">{{ feat.desc }}</p>
                  @if (planFeatures()) {
                    <p class="text-xs text-slate-400 mt-0.5">Plan default: {{ getPlanFeatureValue(feat.key) ? 'ON' : 'OFF' }}</p>
                  }
                </div>
                <button (click)="toggleFeature(feat.key)"
                  class="relative w-14 h-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2"
                  [class]="getFeatureValue(feat.key) ? 'bg-indigo-600' : 'bg-slate-300'">
                  <span class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform"
                    [class]="getFeatureValue(feat.key) ? 'translate-x-6' : 'translate-x-0'"></span>
                </button>
              </div>
            }
          </div>

          <div class="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            @if (isDirty()) {
              <span class="text-xs text-amber-600 font-medium">Unsaved changes</span>
            } @else {
              <span></span>
            }
            <button (click)="save()" [disabled]="saving() || !isDirty()"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {{ saving() ? 'Saving...' : 'Save Features' }}
            </button>
          </div>
        </div>
      } @else if (selectedTenantId) {
        <div class="text-center py-12 text-slate-400">
          Could not load features for this tenant
        </div>
      }
    </div>
  `,
})
export class FeaturesComponent implements OnInit {
  private readonly api = inject(PlatformApiService);
  private readonly toast = inject(ToastService);

  readonly tenants = signal<Tenant[]>([]);
  readonly selectedTenant = signal<Tenant | null>(null);
  readonly features = signal<TenantFeatures | null>(null);
  readonly originalFeatures = signal<TenantFeatures | null>(null);
  readonly planFeatures = signal<TenantFeatures | null>(null);
  readonly plans = signal<Plan[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  selectedTenantId = '';

  readonly featureItems: { key: keyof TenantFeatures; label: string; desc: string }[] = [
    { key: 'canRemovePoweredBy', label: 'Remove "Powered by Mobilytics"', desc: 'Allow tenant to hide branding in their store footer' },
    { key: 'advancedReports', label: 'Advanced Reports', desc: 'Access to detailed analytics, charts, and CSV/PDF export' },
    { key: 'customDomain', label: 'Custom Domain', desc: 'Use a custom domain instead of the default subdomain' },
    { key: 'apiAccess', label: 'API Access', desc: 'Allow external API integrations and webhooks' },
    { key: 'prioritySupport', label: 'Priority Support', desc: 'Fast-track support tickets with guaranteed SLA' },
  ];

  ngOnInit(): void {
    this.loadTenants();
    this.loadPlans();
  }

  loadTenants(): void {
    this.api.getTenants().subscribe({
      next: data => this.tenants.set(data || []),
      error: () => this.tenants.set([]),
    });
  }

  loadPlans(): void {
    this.api.getPlans().subscribe({
      next: data => this.plans.set(data || []),
      error: () => this.plans.set([]),
    });
  }

  onTenantSelect(tenantId: string): void {
    if (!tenantId) {
      this.features.set(null);
      this.selectedTenant.set(null);
      this.planFeatures.set(null);
      return;
    }
    this.loading.set(true);

    // Load tenant details to get plan info
    this.api.getTenant(tenantId).subscribe({
      next: tenant => {
        this.selectedTenant.set(tenant);
        // Find plan defaults
        if (tenant.subscription) {
          this.planFeatures.set(null);
        } else {
          this.planFeatures.set(null);
        }
      },
      error: () => this.selectedTenant.set(null),
    });

    this.api.getTenantFeatures(tenantId).subscribe({
      next: data => {
        const feat = data || this.defaultFeatures();
        this.features.set({ ...feat });
        this.originalFeatures.set({ ...feat });
        this.loading.set(false);
      },
      error: () => {
        const feat = this.defaultFeatures();
        this.features.set({ ...feat });
        this.originalFeatures.set({ ...feat });
        this.loading.set(false);
      },
    });
  }

  getFeatureValue(key: keyof TenantFeatures): boolean {
    return this.features()?.[key] ?? false;
  }

  getPlanFeatureValue(key: keyof TenantFeatures): boolean {
    return this.planFeatures()?.[key] ?? false;
  }

  toggleFeature(key: keyof TenantFeatures): void {
    const feat = this.features();
    if (!feat) return;
    this.features.set({ ...feat, [key]: !feat[key] });
  }

  isDirty(): boolean {
    const curr = this.features();
    const orig = this.originalFeatures();
    if (!curr || !orig) return false;
    return this.featureItems.some(f => curr[f.key] !== orig[f.key]);
  }

  resetToDefaults(): void {
    const planFeat = this.planFeatures();
    if (planFeat) {
      this.features.set({ ...planFeat });
    }
  }

  save(): void {
    if (!this.selectedTenantId || !this.features()) return;
    this.saving.set(true);
    this.api.updateTenantFeatures(this.selectedTenantId, this.features()!).subscribe({
      next: () => {
        this.toast.success('Features updated successfully');
        this.originalFeatures.set({ ...this.features()! });
        this.saving.set(false);
      },
      error: (err: any) => {
        this.toast.error(err?.message || 'Failed to update features');
        this.saving.set(false);
      },
    });
  }

  private defaultFeatures(): TenantFeatures {
    return {
      canRemovePoweredBy: false,
      advancedReports: false,
      customDomain: false,
      apiAccess: false,
      prioritySupport: false,
    };
  }
}
