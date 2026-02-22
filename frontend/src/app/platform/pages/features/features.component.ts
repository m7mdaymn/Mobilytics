import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Tenant, TenantFeatures } from '../../../core/models/platform.models';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-slate-800">Tenant Feature Toggles</h1>

      <!-- Tenant Selector -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 class="font-semibold text-slate-800 mb-4">Select Tenant</h2>
        <select [(ngModel)]="selectedTenantId" (ngModelChange)="onTenantSelect($event)" class="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-lg">
          <option value="">-- Select a tenant --</option>
          @for (tenant of tenants(); track tenant.id) {
            <option [value]="tenant.id">{{ tenant.name }} ({{ tenant.slug }})</option>
          }
        </select>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      } @else if (selectedTenantId && features()) {
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-200">
            <h2 class="font-semibold text-slate-800">Feature Flags</h2>
            <p class="text-sm text-slate-500 mt-1">Toggle features for this tenant. These override plan defaults.</p>
          </div>

          <div class="divide-y divide-slate-100">
            <!-- Can Remove "Powered By" -->
            <label class="flex items-center justify-between p-6 hover:bg-slate-50 cursor-pointer">
              <div>
                <p class="font-medium text-slate-800">Remove "Powered by Mobilytics"</p>
                <p class="text-sm text-slate-500">Allow tenant to hide branding in footer</p>
              </div>
              <div class="relative">
                <input type="checkbox" [(ngModel)]="features()!.canRemovePoweredBy" class="sr-only" />
                <div class="w-14 h-8 rounded-full transition-colors"
                  [class]="features()!.canRemovePoweredBy ? 'bg-indigo-600' : 'bg-slate-300'"
                  (click)="features()!.canRemovePoweredBy = !features()!.canRemovePoweredBy">
                  <div class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform"
                    [class]="features()!.canRemovePoweredBy ? 'translate-x-6' : ''"></div>
                </div>
              </div>
            </label>

            <!-- Advanced Reports -->
            <label class="flex items-center justify-between p-6 hover:bg-slate-50 cursor-pointer">
              <div>
                <p class="font-medium text-slate-800">Advanced Reports</p>
                <p class="text-sm text-slate-500">Access to detailed analytics and export features</p>
              </div>
              <div class="relative">
                <input type="checkbox" [(ngModel)]="features()!.advancedReports" class="sr-only" />
                <div class="w-14 h-8 rounded-full transition-colors"
                  [class]="features()!.advancedReports ? 'bg-indigo-600' : 'bg-slate-300'"
                  (click)="features()!.advancedReports = !features()!.advancedReports">
                  <div class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform"
                    [class]="features()!.advancedReports ? 'translate-x-6' : ''"></div>
                </div>
              </div>
            </label>

            <!-- Custom Domain -->
            <label class="flex items-center justify-between p-6 hover:bg-slate-50 cursor-pointer">
              <div>
                <p class="font-medium text-slate-800">Custom Domain</p>
                <p class="text-sm text-slate-500">Use own domain instead of subdomain</p>
              </div>
              <div class="relative">
                <input type="checkbox" [(ngModel)]="features()!.customDomain" class="sr-only" />
                <div class="w-14 h-8 rounded-full transition-colors"
                  [class]="features()!.customDomain ? 'bg-indigo-600' : 'bg-slate-300'"
                  (click)="features()!.customDomain = !features()!.customDomain">
                  <div class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform"
                    [class]="features()!.customDomain ? 'translate-x-6' : ''"></div>
                </div>
              </div>
            </label>

            <!-- API Access -->
            <label class="flex items-center justify-between p-6 hover:bg-slate-50 cursor-pointer">
              <div>
                <p class="font-medium text-slate-800">API Access</p>
                <p class="text-sm text-slate-500">Allow external API integrations</p>
              </div>
              <div class="relative">
                <input type="checkbox" [(ngModel)]="features()!.apiAccess" class="sr-only" />
                <div class="w-14 h-8 rounded-full transition-colors"
                  [class]="features()!.apiAccess ? 'bg-indigo-600' : 'bg-slate-300'"
                  (click)="features()!.apiAccess = !features()!.apiAccess">
                  <div class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform"
                    [class]="features()!.apiAccess ? 'translate-x-6' : ''"></div>
                </div>
              </div>
            </label>

            <!-- Priority Support -->
            <label class="flex items-center justify-between p-6 hover:bg-slate-50 cursor-pointer">
              <div>
                <p class="font-medium text-slate-800">Priority Support</p>
                <p class="text-sm text-slate-500">Fast-track support tickets</p>
              </div>
              <div class="relative">
                <input type="checkbox" [(ngModel)]="features()!.prioritySupport" class="sr-only" />
                <div class="w-14 h-8 rounded-full transition-colors"
                  [class]="features()!.prioritySupport ? 'bg-indigo-600' : 'bg-slate-300'"
                  (click)="features()!.prioritySupport = !features()!.prioritySupport">
                  <div class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform"
                    [class]="features()!.prioritySupport ? 'translate-x-6' : ''"></div>
                </div>
              </div>
            </label>
          </div>

          <div class="p-6 border-t border-slate-200 bg-slate-50">
            <button (click)="save()" [disabled]="saving()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
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
  readonly features = signal<TenantFeatures | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  selectedTenantId = '';

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.api.getTenants().subscribe({
      next: data => this.tenants.set(data || []),
      error: () => this.tenants.set([]),
    });
  }

  onTenantSelect(tenantId: string): void {
    if (!tenantId) {
      this.features.set(null);
      return;
    }
    this.loading.set(true);
    this.api.getTenantFeatures(tenantId).subscribe({
      next: data => {
        this.features.set(data || {
          canRemovePoweredBy: false,
          advancedReports: false,
          customDomain: false,
          apiAccess: false,
          prioritySupport: false,
        });
        this.loading.set(false);
      },
      error: () => {
        // Default features if not found
        this.features.set({
          canRemovePoweredBy: false,
          advancedReports: false,
          customDomain: false,
          apiAccess: false,
          prioritySupport: false,
        });
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (!this.selectedTenantId || !this.features()) return;
    this.saving.set(true);
    this.api.updateTenantFeatures(this.selectedTenantId, this.features()!).subscribe({
      next: () => {
        this.toast.success('Features updated');
        this.saving.set(false);
      },
      error: (err: any) => {
        this.toast.error(err?.message || 'Failed to update features');
        this.saving.set(false);
      },
    });
  }
}
