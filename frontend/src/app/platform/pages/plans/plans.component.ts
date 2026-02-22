import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Plan, CreatePlanRequest, PlanLimits, PlanFeatures } from '../../../core/models/platform.models';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-slate-800">Subscription Plans</h1>
        <button (click)="openForm()"
           class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
          <span>+ Create Plan</span>
        </button>
      </div>

      <!-- Form Modal -->
      @if (showForm()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="showForm.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-slate-200">
              <h2 class="text-xl font-bold text-slate-800">{{ editId() ? 'Edit' : 'Create' }} Plan</h2>
            </div>
            <div class="p-6 space-y-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Plan Name <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="form.name" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="Pro Plan" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Monthly Price (EGP)</label>
                  <input type="number" [(ngModel)]="form.monthlyPrice" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Activation Fee (EGP)</label>
                  <input type="number" [(ngModel)]="form.activationFee" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
                </div>
              </div>

              <!-- Limits -->
              <div class="border-t border-slate-200 pt-5">
                <h3 class="font-semibold text-slate-700 mb-3">Plan Limits</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">Max Items</label>
                    <input type="number" [(ngModel)]="form.limits.maxItems" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">Max Employees</label>
                    <input type="number" [(ngModel)]="form.limits.maxEmployees" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">Max Images</label>
                    <input type="number" [(ngModel)]="form.limits.maxImages" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">Storage (MB)</label>
                    <input type="number" [(ngModel)]="form.limits.maxStorageMB" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              <!-- Features -->
              <div class="border-t border-slate-200 pt-5">
                <h3 class="font-semibold text-slate-700 mb-3">Plan Features</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="form.features.canRemovePoweredBy" class="w-4 h-4 rounded" />
                    <span class="text-sm">Can Remove "Powered By"</span>
                  </label>
                  <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="form.features.advancedReports" class="w-4 h-4 rounded" />
                    <span class="text-sm">Advanced Reports</span>
                  </label>
                  <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="form.features.customDomain" class="w-4 h-4 rounded" />
                    <span class="text-sm">Custom Domain</span>
                  </label>
                  <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="form.features.apiAccess" class="w-4 h-4 rounded" />
                    <span class="text-sm">API Access</span>
                  </label>
                  <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="form.features.prioritySupport" class="w-4 h-4 rounded" />
                    <span class="text-sm">Priority Support</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button (click)="showForm.set(false)" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button (click)="save()" [disabled]="saving()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {{ saving() ? 'Saving...' : 'Save Plan' }}
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
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div class="p-6 space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-bold text-lg text-slate-800">{{ plan.name }}</h3>
                  <span class="text-xs px-2 py-1 rounded-full"
                    [class]="plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                    {{ plan.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>

                <div class="text-center py-4 border-y border-slate-100">
                  <span class="text-3xl font-bold text-slate-800">{{ plan.monthlyPrice | number:'1.0-0' }}</span>
                  <span class="text-slate-500 text-sm"> EGP/month</span>
                  @if (plan.activationFee > 0) {
                    <p class="text-xs text-slate-400 mt-1">+ {{ plan.activationFee | number:'1.0-0' }} EGP activation</p>
                  }
                </div>

                <!-- Limits -->
                <div class="text-sm space-y-2">
                  <p class="text-slate-600">📦 {{ plan.limits.maxItems }} items</p>
                  <p class="text-slate-600">👥 {{ plan.limits.maxEmployees }} employees</p>
                  <p class="text-slate-600">🖼️ {{ plan.limits.maxImages }} images</p>
                  <p class="text-slate-600">💾 {{ plan.limits.maxStorageMB }} MB storage</p>
                </div>

                <!-- Features -->
                <div class="text-sm space-y-1 border-t border-slate-100 pt-4">
                  @if (plan.features.canRemovePoweredBy) { <p class="text-emerald-600">✓ Remove branding</p> }
                  @if (plan.features.advancedReports) { <p class="text-emerald-600">✓ Advanced reports</p> }
                  @if (plan.features.customDomain) { <p class="text-emerald-600">✓ Custom domain</p> }
                  @if (plan.features.apiAccess) { <p class="text-emerald-600">✓ API access</p> }
                  @if (plan.features.prioritySupport) { <p class="text-emerald-600">✓ Priority support</p> }
                </div>
              </div>
              <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-2">
                <button (click)="edit(plan)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                <button (click)="deletePlan(plan)" class="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
              </div>
            </div>
          } @empty {
            <div class="col-span-full text-center py-12 text-slate-400">
              No plans created yet. Click "Create Plan" to add one.
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

  form: CreatePlanRequest = this.defaultForm();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getPlans().subscribe({
      next: data => {
        this.plans.set(data || []);
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
      monthlyPrice: plan.monthlyPrice,
      activationFee: plan.activationFee,
      limits: { ...plan.limits },
      features: { ...plan.features },
    };
    this.editId.set(plan.id);
    this.showForm.set(true);
  }

  save(): void {
    if (!this.form.name) {
      this.toast.error('Plan name is required');
      return;
    }

    this.saving.set(true);
    const req$ = this.editId()
      ? this.api.updatePlan(this.editId()!, this.form)
      : this.api.createPlan(this.form);

    req$.subscribe({
      next: () => {
        this.toast.success(this.editId() ? 'Plan updated' : 'Plan created');
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
    if (!confirm(`Delete "${plan.name}"?`)) return;
    this.api.deletePlan(plan.id).subscribe({
      next: () => {
        this.toast.success('Plan deleted');
        this.load();
      },
      error: () => this.toast.error('Failed to delete'),
    });
  }

  private defaultForm(): CreatePlanRequest {
    return {
      name: '',
      monthlyPrice: 0,
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
