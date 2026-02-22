import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Tenant, Plan, ExpiringSubscription, StartTrialRequest, ActivateSubscriptionRequest, RenewSubscriptionRequest } from '../../../core/models/platform.models';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-slate-800">Subscription Management</h1>

      <!-- Expiring Subscriptions Alert -->
      @if (expiring().length > 0) {
        <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h3 class="font-semibold text-orange-800 mb-2">⚠️ Expiring Soon ({{ daysFilter }} days)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (sub of expiring(); track sub.tenantId) {
              <div class="bg-white rounded-lg p-3 border border-orange-100 flex items-center justify-between">
                <div>
                  <p class="font-medium text-slate-800">{{ sub.tenantName }}</p>
                  <p class="text-xs text-slate-500">{{ sub.planName }} • {{ sub.daysRemaining }} days left</p>
                </div>
                <button (click)="selectTenant(sub.tenantId)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  Renew
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Tenant Selector -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 class="font-semibold text-slate-800 mb-4">Select Tenant</h2>
        <div class="flex flex-wrap gap-4">
          <select [(ngModel)]="selectedTenantId" (ngModelChange)="onTenantSelect($event)" class="flex-1 min-w-[200px] px-4 py-2.5 border border-slate-300 rounded-lg">
            <option value="">-- Select a tenant --</option>
            @for (tenant of tenants(); track tenant.id) {
              <option [value]="tenant.id">{{ tenant.name }} ({{ tenant.slug }})</option>
            }
          </select>
          <div class="flex gap-2">
            <input type="number" [(ngModel)]="daysFilter" min="1" max="90" class="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Days" />
            <button (click)="loadExpiring()" class="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium">
              Show Expiring
            </button>
          </div>
        </div>
      </div>

      @if (selectedTenant()) {
        <!-- Current Status -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 class="font-bold text-lg text-slate-800">{{ selectedTenant()!.name }}</h2>
              <p class="text-slate-500 text-sm">{{ selectedTenant()!.slug }}</p>
            </div>
            <span class="text-sm px-3 py-1 rounded-full font-medium"
              [class]="selectedTenant()!.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
              {{ selectedTenant()!.status }}
            </span>
          </div>

          @if (selectedTenant()!.subscription) {
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 bg-slate-50 rounded-lg p-4">
              <div>
                <p class="text-xs text-slate-500 uppercase">Plan</p>
                <p class="font-medium text-slate-800">{{ selectedTenant()!.subscription!.planName }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase">Status</p>
                <span class="text-sm font-medium"
                  [class]="selectedTenant()!.subscription!.status === 'Active' ? 'text-emerald-600' :
                           selectedTenant()!.subscription!.status === 'Trial' ? 'text-blue-600' :
                           selectedTenant()!.subscription!.status === 'Grace' ? 'text-orange-600' :
                           'text-red-600'">
                  {{ selectedTenant()!.subscription!.status }}
                </span>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase">Start Date</p>
                <p class="text-slate-800 text-sm">{{ selectedTenant()!.subscription!.startDate | date:'mediumDate' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase">End Date</p>
                <p class="text-slate-800 text-sm">{{ selectedTenant()!.subscription!.endDate | date:'mediumDate' }}</p>
              </div>
              @if (selectedTenant()!.subscription!.trialEndsAt) {
                <div>
                  <p class="text-xs text-slate-500 uppercase">Trial Ends</p>
                  <p class="text-blue-600 text-sm">{{ selectedTenant()!.subscription!.trialEndsAt | date:'mediumDate' }}</p>
                </div>
              }
              @if (selectedTenant()!.subscription!.graceEndsAt) {
                <div>
                  <p class="text-xs text-slate-500 uppercase">Grace Ends</p>
                  <p class="text-orange-600 text-sm">{{ selectedTenant()!.subscription!.graceEndsAt | date:'mediumDate' }}</p>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-6 text-slate-400">
              No active subscription
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Start Trial -->
          <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 class="font-semibold text-slate-800">Start Trial</h3>
            <div>
              <label class="block text-sm text-slate-600 mb-1">Duration (days)</label>
              <input type="number" [(ngModel)]="trialForm.durationDays" min="1" max="90" class="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm text-slate-600 mb-1">Notes</label>
              <input [(ngModel)]="trialForm.notes" class="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <button (click)="startTrial()" [disabled]="processing()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              Start Trial
            </button>
          </div>

          <!-- Activate -->
          <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 class="font-semibold text-slate-800">Activate Subscription</h3>
            <div>
              <label class="block text-sm text-slate-600 mb-1">Plan</label>
              <select [(ngModel)]="activateForm.planId" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="">Select plan</option>
                @for (plan of plans(); track plan.id) {
                  <option [value]="plan.id">{{ plan.name }} ({{ plan.monthlyPrice | number:'1.0-0' }} EGP/mo)</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm text-slate-600 mb-1">Months</label>
              <input type="number" [(ngModel)]="activateForm.months" min="1" max="24" class="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm text-slate-600 mb-1">Payment Amount (EGP)</label>
              <input type="number" [(ngModel)]="activateForm.paymentAmount" class="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <button (click)="activate()" [disabled]="processing()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              Activate
            </button>
          </div>

          <!-- Renew -->
          <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 class="font-semibold text-slate-800">Renew Subscription</h3>
            <div>
              <label class="block text-sm text-slate-600 mb-1">Months</label>
              <input type="number" [(ngModel)]="renewForm.months" min="1" max="24" class="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm text-slate-600 mb-1">Payment Amount (EGP)</label>
              <input type="number" [(ngModel)]="renewForm.paymentAmount" class="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm text-slate-600 mb-1">Notes</label>
              <input [(ngModel)]="renewForm.notes" class="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <button (click)="renew()" [disabled]="processing()" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              Renew
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class SubscriptionsComponent implements OnInit {
  private readonly api = inject(PlatformApiService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly tenants = signal<Tenant[]>([]);
  readonly plans = signal<Plan[]>([]);
  readonly expiring = signal<ExpiringSubscription[]>([]);
  readonly selectedTenant = signal<Tenant | null>(null);
  readonly processing = signal(false);

  selectedTenantId = '';
  daysFilter = 7;

  trialForm: StartTrialRequest = { durationDays: 14, notes: '' };
  activateForm: ActivateSubscriptionRequest = { planId: '', months: 1, paymentAmount: 0, notes: '' };
  renewForm: RenewSubscriptionRequest = { months: 1, paymentAmount: 0, notes: '' };

  ngOnInit(): void {
    this.loadTenants();
    this.loadPlans();
    this.loadExpiring();

    // Check for tenantId in query params
    const tenantId = this.route.snapshot.queryParamMap.get('tenantId');
    if (tenantId) {
      this.selectedTenantId = tenantId;
      this.onTenantSelect(tenantId);
    }
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

  loadExpiring(): void {
    this.api.getExpiringSubscriptions(this.daysFilter).subscribe({
      next: data => this.expiring.set(data || []),
      error: () => this.expiring.set([]),
    });
  }

  selectTenant(tenantId: string): void {
    this.selectedTenantId = tenantId;
    this.onTenantSelect(tenantId);
  }

  onTenantSelect(tenantId: string): void {
    if (!tenantId) {
      this.selectedTenant.set(null);
      return;
    }
    this.api.getTenant(tenantId).subscribe({
      next: data => this.selectedTenant.set(data),
      error: () => this.selectedTenant.set(null),
    });
  }

  startTrial(): void {
    if (!this.selectedTenant()) return;
    this.processing.set(true);
    this.api.startTrial(this.selectedTenant()!.id, this.trialForm).subscribe({
      next: () => {
        this.toast.success('Trial started');
        this.processing.set(false);
        this.onTenantSelect(this.selectedTenant()!.id);
      },
      error: (err: any) => {
        this.toast.error(err?.message || 'Failed to start trial');
        this.processing.set(false);
      },
    });
  }

  activate(): void {
    if (!this.selectedTenant() || !this.activateForm.planId) return;
    this.processing.set(true);
    this.api.activateSubscription(this.selectedTenant()!.id, this.activateForm).subscribe({
      next: () => {
        this.toast.success('Subscription activated');
        this.processing.set(false);
        this.onTenantSelect(this.selectedTenant()!.id);
      },
      error: (err: any) => {
        this.toast.error(err?.message || 'Failed to activate');
        this.processing.set(false);
      },
    });
  }

  renew(): void {
    if (!this.selectedTenant()) return;
    this.processing.set(true);
    this.api.renewSubscription(this.selectedTenant()!.id, this.renewForm).subscribe({
      next: () => {
        this.toast.success('Subscription renewed');
        this.processing.set(false);
        this.onTenantSelect(this.selectedTenant()!.id);
        this.loadExpiring();
      },
      error: (err: any) => {
        this.toast.error(err?.message || 'Failed to renew');
        this.processing.set(false);
      },
    });
  }
}
