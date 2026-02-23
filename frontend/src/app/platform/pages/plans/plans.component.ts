import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Plan, CreatePlanFormData, PlanLimits, PlanFeatures } from '../../../core/models/platform.models';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Subscription Plans</h1>
          <p class="text-sm text-slate-500 mt-1">Manage the pricing plans available for tenants</p>
        </div>
        <button (click)="openForm()"
           class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
          + Create Plan
        </button>
      </div>

      <!-- Form Modal -->
      @if (showForm()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="showForm.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 class="text-xl font-bold text-slate-800">{{ editId() ? 'Edit' : 'Create' }} Plan</h2>
              <button (click)="showForm.set(false)" class="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div class="p-6 space-y-5">
              <!-- Basic Info -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div class="md:col-span-3">
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Plan Name <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.name" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" placeholder="e.g. Pro Plan" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Monthly Price (EGP)</label>
                  <input type="number" [(ngModel)]="form.priceMonthly" min="0" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
                  <p class="text-xs text-slate-400 mt-1">Set to 0 for free/trial plan</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Activation Fee (EGP)</label>
                  <input type="number" [(ngModel)]="form.activationFee" min="0" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
                  <p class="text-xs text-slate-400 mt-1">One-time setup fee</p>
                </div>

                <div class="flex items-center">
                  <div class="bg-slate-50 rounded-lg p-4 w-full text-center">
                    <p class="text-xs text-slate-500 mb-1">Annual Price</p>
                    <p class="text-lg font-bold text-indigo-600">{{ (form.priceMonthly * 12) + form.activationFee | number:'1.0-0' }} EGP</p>
                    <p class="text-xs text-slate-400">12 mo + activation</p>
                  </div>
                </div>
              </div>

              <!-- Limits -->
              <div class="border-t border-slate-200 pt-5">
                <h3 class="font-semibold text-slate-700 mb-3">Plan Limits</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Max Items</label>
                    <input type="number" [(ngModel)]="form.limits.maxItems" min="0" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Max Employees</label>
                    <input type="number" [(ngModel)]="form.limits.maxEmployees" min="0" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Max Images</label>
                    <input type="number" [(ngModel)]="form.limits.maxImages" min="0" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Storage (MB)</label>
                    <input type="number" [(ngModel)]="form.limits.maxStorageMB" min="0" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              <!-- Features -->
              <div class="border-t border-slate-200 pt-5">
                <h3 class="font-semibold text-slate-700 mb-3">Plan Features</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  @for (feat of featureItems; track feat.key) {
                    <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <input type="checkbox" [(ngModel)]="form.features[feat.key]" class="w-4 h-4 rounded accent-indigo-600" />
                      <div>
                        <span class="text-sm font-medium text-slate-700">{{ feat.label }}</span>
                        <p class="text-xs text-slate-400">{{ feat.desc }}</p>
                      </div>
                    </label>
                  }
                </div>
              </div>
            </div>
            <div class="p-6 border-t border-slate-200 flex gap-3 justify-end bg-slate-50">
              <button (click)="showForm.set(false)" class="px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button (click)="save()" [disabled]="saving()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {{ saving() ? 'Saving...' : editId() ? 'Update Plan' : 'Create Plan' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Plans Grid -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (plan of plans(); track plan.id) {
            <div class="bg-white rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all"
              [class]="plan.isActive ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-70'">
              <!-- Header -->
              <div class="p-5 pb-0">
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h3 class="font-bold text-lg text-slate-800">{{ plan.name }}</h3>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                        [class]="plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                        {{ plan.isActive ? 'Active' : 'Inactive' }}
                      </span>
                      @if (plan.priceMonthly === 0) {
                        <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Free</span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Price -->
                <div class="text-center py-4 border-y border-slate-100">
                  @if (plan.priceMonthly === 0) {
                    <span class="text-3xl font-bold text-slate-800">Free</span>
                  } @else {
                    <span class="text-3xl font-bold text-slate-800">{{ plan.priceMonthly | number:'1.0-0' }}</span>
                    <span class="text-slate-500 text-sm"> EGP/month</span>
                  }
                  @if (plan.activationFee > 0) {
                    <p class="text-xs text-slate-400 mt-1">+ {{ plan.activationFee | number:'1.0-0' }} EGP one-time activation</p>
                  }
                </div>
              </div>

              <!-- Limits -->
              <div class="p-5 space-y-2.5 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-slate-600">Items</span>
                  <span class="font-medium text-slate-800">{{ plan.limits.maxItems | number }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-600">Employees</span>
                  <span class="font-medium text-slate-800">{{ plan.limits.maxEmployees | number }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-600">Images</span>
                  <span class="font-medium text-slate-800">{{ plan.limits.maxImages | number }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-600">Storage</span>
                  <span class="font-medium text-slate-800">{{ plan.limits.maxStorageMB | number }} MB</span>
                </div>
              </div>

              <!-- Features -->
              <div class="px-5 pb-4 text-sm space-y-1.5 border-t border-slate-100 pt-4">
                @for (feat of featureItems; track feat.key) {
                  <div class="flex items-center gap-2">
                    @if (plan.features[feat.key]) {
                      <span class="text-emerald-500 text-xs">✓</span>
                      <span class="text-slate-700">{{ feat.label }}</span>
                    } @else {
                      <span class="text-slate-300 text-xs">✗</span>
                      <span class="text-slate-400 line-through">{{ feat.label }}</span>
                    }
                  </div>
                }
              </div>

              <!-- Actions -->
              <div class="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div class="flex gap-3">
                  <button (click)="edit(plan)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors">Edit</button>
                  <button (click)="deletePlan(plan)" class="text-red-500 hover:text-red-700 text-sm font-medium transition-colors">Delete</button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="col-span-full text-center py-16">
              <p class="text-slate-400 text-lg">No plans created yet</p>
              <p class="text-slate-400 text-sm mt-1">Click "Create Plan" to add your first subscription plan</p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PlansComponent implements OnInit {
  private readonly api = inject(PlatformApiService);
  private readonly toast = inject(ToastService);

  readonly plans = signal<Plan[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editId = signal<string | null>(null);

  form: CreatePlanFormData = this.defaultForm();

  readonly featureItems: { key: keyof PlanFeatures; label: string; desc: string }[] = [
    { key: 'canRemovePoweredBy', label: 'Remove Branding', desc: 'Hide "Powered by" footer' },
    { key: 'advancedReports', label: 'Advanced Reports', desc: 'Analytics & export' },
    { key: 'customDomain', label: 'Custom Domain', desc: 'Use own domain' },
    { key: 'apiAccess', label: 'API Access', desc: 'External integrations' },
    { key: 'prioritySupport', label: 'Priority Support', desc: 'Fast-track tickets' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getPlans().subscribe({
      next: data => {
        // Sort: active first, then by price
        const sorted = (data || []).sort((a, b) => {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
          return a.priceMonthly - b.priceMonthly;
        });
        this.plans.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.plans.set([]);
        this.loading.set(false);
      },
    });
  }

  openForm(): void {
    this.form = this.defaultForm();
    this.editId.set(null);
    this.showForm.set(true);
  }

  edit(plan: Plan): void {
    this.form = {
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      activationFee: plan.activationFee,
      limits: { ...plan.limits },
      features: { ...plan.features },
    };
    this.editId.set(plan.id);
    this.showForm.set(true);
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.toast.error('Plan name is required');
      return;
    }

    this.saving.set(true);
    const req$ = this.editId()
      ? this.api.updatePlan(this.editId()!, this.form)
      : this.api.createPlan(this.form);

    req$.subscribe({
      next: () => {
        this.toast.success(this.editId() ? 'Plan updated successfully' : 'Plan created successfully');
        this.saving.set(false);
        this.showForm.set(false);
        this.load();
      },
      error: (err: any) => {
        this.toast.error(err?.message || 'Failed to save plan');
        this.saving.set(false);
      },
    });
  }

  deletePlan(plan: Plan): void {
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    this.api.deletePlan(plan.id).subscribe({
      next: () => {
        this.toast.success('Plan deleted');
        this.load();
      },
      error: (err: any) => this.toast.error(err?.message || 'Failed to delete plan'),
    });
  }

  private defaultForm(): CreatePlanFormData {
    return {
      name: '',
      priceMonthly: 0,
      activationFee: 0,
      limits: {
        maxItems: 100,
        maxEmployees: 5,
        maxImages: 500,
        maxStorageMB: 1024,
      },
      features: {
        canRemovePoweredBy: false,
        advancedReports: false,
        customDomain: false,
        apiAccess: false,
        prioritySupport: false,
      },
    };
  }
}
