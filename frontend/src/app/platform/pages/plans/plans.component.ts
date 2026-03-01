import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Plan, CreatePlanFormData, planAnnualPrice } from '../../../core/models/platform.models';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Subscription Plans</h1>
          <p class="text-sm text-slate-500 mt-1">Manage pricing plans — monthly & annual (20% discount)</p>
        </div>
        <button (click)="openForm()"
           class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
          + Create Plan
        </button>
      </div>

      <!-- Form Modal -->
      @if (showForm()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="showForm.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 class="text-xl font-bold text-slate-800">{{ editId() ? 'Edit' : 'Create' }} Plan</h2>
              <button (click)="showForm.set(false)" class="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div class="p-6 space-y-5">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Plan Name <span class="text-red-500">*</span></label>
                <input [(ngModel)]="form.name" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" placeholder="e.g. Pro Plan" />
              </div>
              <div class="grid grid-cols-2 gap-5">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Monthly Price (EGP)</label>
                  <input type="number" [(ngModel)]="form.priceMonthly" min="0" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Activation Fee (EGP)</label>
                  <input type="number" [(ngModel)]="form.activationFee" min="0" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
                </div>
              </div>
              <!-- Auto-computed annual -->
              <div class="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Annual Price (20% off)</p>
                  <p class="text-2xl font-bold text-indigo-700 mt-1">{{ getAnnual(form.priceMonthly) | number:'1.0-0' }} EGP</p>
                </div>
                <div class="text-right text-xs text-indigo-500">
                  <p>{{ form.priceMonthly | number:'1.0-0' }} &times; 12 = {{ form.priceMonthly * 12 | number:'1.0-0' }}</p>
                  <p class="font-bold">- 20% discount</p>
                </div>
              </div>
            </div>
            <div class="p-6 border-t border-slate-200 flex gap-3 justify-end bg-slate-50">
              <button (click)="showForm.set(false)" class="px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
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
              <div class="p-6">
                <div class="flex items-start justify-between mb-5">
                  <div>
                    <h3 class="font-bold text-lg text-slate-800">{{ plan.name }}</h3>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                      [class]="plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                      {{ plan.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>

                <!-- Monthly -->
                <div class="text-center py-4 border-y border-slate-100">
                  @if (plan.priceMonthly === 0) {
                    <span class="text-3xl font-bold text-slate-800">Free</span>
                  } @else {
                    <div class="mb-3">
                      <span class="text-3xl font-bold text-slate-800">{{ plan.priceMonthly | number:'1.0-0' }}</span>
                      <span class="text-slate-500 text-sm"> EGP/month</span>
                    </div>
                    <div class="bg-indigo-50 rounded-lg py-2 px-3 inline-block">
                      <span class="text-lg font-bold text-indigo-600">{{ getAnnual(plan.priceMonthly) | number:'1.0-0' }}</span>
                      <span class="text-indigo-400 text-xs"> EGP/year</span>
                      <span class="text-xs bg-indigo-100 text-indigo-700 font-bold rounded px-1.5 py-0.5 ms-1.5">-20%</span>
                    </div>
                  }
                  @if (plan.activationFee > 0) {
                    <p class="text-xs text-slate-400 mt-2">+ {{ plan.activationFee | number:'1.0-0' }} EGP one-time activation</p>
                  }
                </div>

                <!-- All features included -->
                <div class="mt-4 space-y-2 text-sm">
                  @for (f of allFeatures; track f) {
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                      <span class="text-slate-600">{{ f }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div class="flex gap-3">
                  <button (click)="edit(plan)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                  <button (click)="deletePlan(plan)" class="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
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

  readonly allFeatures = [
    'Unlimited Items',
    'Unlimited Employees',
    'Online Storefront',
    'Invoicing & Stock',
    'Lead Tracking',
    'Reports & Analytics',
  ];

  ngOnInit(): void {
    this.load();
  }

  getAnnual(monthly: number): number {
    return planAnnualPrice(monthly);
  }

  load(): void {
    this.loading.set(true);
    this.api.getPlans().subscribe({
      next: data => {
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
    return { name: '', priceMonthly: 0, activationFee: 0 };
  }
}
