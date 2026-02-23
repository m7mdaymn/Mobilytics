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

      <!-- Top Bar: Tenant Selector + Expiring Days -->
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div class="flex flex-col md:flex-row gap-4 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Select Tenant</label>
            <select [(ngModel)]="selectedTenantId" (ngModelChange)="onTenantSelect($event)"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition">
              <option value="">-- Choose a tenant --</option>
              @for (tenant of tenants(); track tenant.id) {
                <option [value]="tenant.id">{{ tenant.name }} ({{ tenant.slug }}) — {{ tenant.status }}</option>
              }
            </select>
          </div>
          <div class="flex gap-2 items-end">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Expiring in</label>
              <div class="flex items-center gap-1">
                <input type="number" [(ngModel)]="daysFilter" min="1" max="90" class="w-20 px-3 py-2.5 border border-slate-300 rounded-lg text-sm" />
                <span class="text-sm text-slate-500">days</span>
              </div>
            </div>
            <button (click)="loadExpiring()" class="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Check
            </button>
          </div>
        </div>
      </div>

      <!-- Expiring Subscriptions Alert -->
      @if (expiring().length > 0) {
        <div class="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <h3 class="font-semibold text-orange-800 mb-3">⚠️ {{ expiring().length }} Subscription(s) Expiring Within {{ daysFilter }} Days</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (sub of expiring(); track sub.tenantId) {
              <div class="bg-white rounded-lg p-4 border border-orange-100 hover:shadow-sm transition-shadow">
                <div class="flex items-start justify-between">
                  <div>
                    <p class="font-semibold text-slate-800">{{ sub.tenantName }}</p>
                    <p class="text-xs text-slate-500">{{ sub.tenantSlug }}</p>
                  </div>
                  <span class="text-xs font-bold px-2 py-1 rounded-full"
                    [class]="sub.daysRemaining <= 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'">
                    {{ sub.daysRemaining }}d left
                  </span>
                </div>
                <div class="mt-2 flex items-center justify-between">
                  <span class="text-xs text-slate-500">{{ sub.planName }} · Ends {{ sub.endDate | date:'mediumDate' }}</span>
                  <button (click)="selectTenant(sub.tenantId)" class="text-indigo-600 hover:text-indigo-800 text-xs font-semibold">
                    Manage →
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (selectedTenant()) {
        <!-- Current Subscription Status -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 class="font-bold text-lg text-slate-800">{{ selectedTenant()!.name }}</h2>
              <p class="text-slate-500 text-sm">{{ selectedTenant()!.slug }}</p>
            </div>
            <span class="text-sm px-3 py-1 rounded-full font-medium"
              [class]="selectedTenant()!.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                       selectedTenant()!.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                       'bg-amber-100 text-amber-700'">
              {{ selectedTenant()!.status }}
            </span>
          </div>

          @if (selectedTenant()!.subscription) {
            <div class="p-5">
              <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="bg-slate-50 rounded-lg p-3">
                  <p class="text-xs text-slate-500 uppercase tracking-wide">Plan</p>
                  <p class="font-semibold text-slate-800 mt-0.5">{{ selectedTenant()!.subscription!.planName }}</p>
                </div>
                <div class="bg-slate-50 rounded-lg p-3">
                  <p class="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                  <span class="text-sm font-semibold mt-0.5 block"
                    [class]="selectedTenant()!.subscription!.status === 'Active' ? 'text-emerald-600' :
                             selectedTenant()!.subscription!.status === 'Trial' ? 'text-blue-600' :
                             selectedTenant()!.subscription!.status === 'Grace' ? 'text-orange-600' :
                             'text-red-600'">
                    {{ selectedTenant()!.subscription!.status }}
                  </span>
                </div>
                <div class="bg-slate-50 rounded-lg p-3">
                  <p class="text-xs text-slate-500 uppercase tracking-wide">Start</p>
                  <p class="text-slate-800 text-sm mt-0.5">{{ selectedTenant()!.subscription!.startDate | date:'mediumDate' }}</p>
                </div>
                <div class="bg-slate-50 rounded-lg p-3">
                  <p class="text-xs text-slate-500 uppercase tracking-wide">End</p>
                  <p class="text-slate-800 text-sm mt-0.5">{{ selectedTenant()!.subscription!.endDate | date:'mediumDate' }}</p>
                </div>
                @if (selectedTenant()!.subscription!.trialEndsAt) {
                  <div class="bg-blue-50 rounded-lg p-3">
                    <p class="text-xs text-blue-500 uppercase tracking-wide">Trial Ends</p>
                    <p class="text-blue-700 text-sm mt-0.5">{{ selectedTenant()!.subscription!.trialEndsAt | date:'mediumDate' }}</p>
                  </div>
                }
                @if (selectedTenant()!.subscription!.graceEndsAt) {
                  <div class="bg-orange-50 rounded-lg p-3">
                    <p class="text-xs text-orange-500 uppercase tracking-wide">Grace Ends</p>
                    <p class="text-orange-700 text-sm mt-0.5">{{ selectedTenant()!.subscription!.graceEndsAt | date:'mediumDate' }}</p>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="p-8 text-center text-slate-400">
              <p class="text-lg">No active subscription</p>
              <p class="text-sm mt-1">Start a trial or activate a subscription below</p>
            </div>
          }
        </div>

        <!-- Action Tabs -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="flex border-b border-slate-200">
            <button (click)="activeTab.set('trial')"
              class="flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2"
              [class]="activeTab() === 'trial' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'">
              Start Trial
            </button>
            <button (click)="activeTab.set('activate')"
              class="flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2"
              [class]="activeTab() === 'activate' ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'">
              Activate
            </button>
            <button (click)="activeTab.set('renew')"
              class="flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2"
              [class]="activeTab() === 'renew' ? 'border-purple-600 text-purple-600 bg-purple-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'">
              Renew
            </button>
          </div>

          <div class="p-6">
            <!-- Start Trial Tab -->
            @if (activeTab() === 'trial') {
              <div class="space-y-5 max-w-lg">
                <p class="text-sm text-slate-500">Start a free trial period. The tenant gets access to the selected plan features during the trial.</p>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Plan <span class="text-red-500">*</span></label>
                  <select [(ngModel)]="trialForm.planId" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
                    <option value="">Select plan</option>
                    @for (plan of plans(); track plan.id) {
                      <option [value]="plan.id">{{ plan.name }} — {{ plan.priceMonthly | number:'1.0-0' }} EGP/mo</option>
                    }
                  </select>
                </div>
                <button (click)="startTrial()" [disabled]="processing() || !trialForm.planId"
                  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  {{ processing() ? 'Starting...' : 'Start Trial' }}
                </button>
              </div>
            }

            <!-- Activate Tab -->
            @if (activeTab() === 'activate') {
              <div class="space-y-5 max-w-2xl">
                <p class="text-sm text-slate-500">Activate a paid subscription. Select a plan, choose the duration, and record the payment amount.</p>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Plan <span class="text-red-500">*</span></label>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    @for (plan of plans(); track plan.id) {
                      <button (click)="selectActivatePlan(plan)"
                        class="p-3 border-2 rounded-lg text-left transition-all"
                        [class]="activateForm.planId === plan.id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'">
                        <div class="font-semibold text-slate-800 text-sm">{{ plan.name }}</div>
                        <div class="text-emerald-600 font-bold">{{ plan.priceMonthly | number:'1.0-0' }} EGP<span class="text-xs text-slate-400 font-normal">/mo</span></div>
                        @if (plan.activationFee > 0) {
                          <div class="text-xs text-slate-400">+ {{ plan.activationFee | number:'1.0-0' }} activation</div>
                        }
                      </button>
                    }
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Duration (Months) <span class="text-red-500">*</span></label>
                    <input type="number" [(ngModel)]="activateForm.months" min="1" max="24"
                      (ngModelChange)="recalcActivateAmount()"
                      class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Payment Amount (EGP)
                      @if (calculatedActivateAmount() !== activateForm.paymentAmount) {
                        <button (click)="activateForm.paymentAmount = calculatedActivateAmount()" class="text-xs text-emerald-600 hover:text-emerald-800 ml-1">(reset to {{ calculatedActivateAmount() | number:'1.0-0' }})</button>
                      }
                    </label>
                    <input type="number" [(ngModel)]="activateForm.paymentAmount" min="0"
                      class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400" />
                    <p class="text-xs text-slate-400 mt-1">Auto: {{ selectedActivatePlanPrice() | number:'1.0-0' }} × {{ activateForm.months }} mo = {{ calculatedActivateAmount() | number:'1.0-0' }} EGP</p>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                  <input [(ngModel)]="activateForm.notes" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="Payment reference or notes..." />
                </div>

                <!-- Activate Summary -->
                @if (activateForm.planId) {
                  <div class="bg-slate-50 rounded-lg p-4 space-y-1 text-sm">
                    <div class="flex justify-between"><span class="text-slate-500">Plan</span><span class="font-medium">{{ selectedActivatePlanName() }}</span></div>
                    <div class="flex justify-between"><span class="text-slate-500">Duration</span><span class="font-medium">{{ activateForm.months }} months</span></div>
                    <div class="flex justify-between border-t border-slate-200 pt-2 mt-2 font-bold"><span>Payment</span><span class="text-emerald-600">{{ activateForm.paymentAmount | number:'1.0-0' }} EGP</span></div>
                  </div>
                }

                <button (click)="activate()" [disabled]="processing() || !activateForm.planId"
                  class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  {{ processing() ? 'Activating...' : 'Activate Subscription' }}
                </button>
              </div>
            }

            <!-- Renew Tab -->
            @if (activeTab() === 'renew') {
              <div class="space-y-5 max-w-lg">
                <p class="text-sm text-slate-500">Extend the current subscription by additional months. The current plan stays the same.</p>

                @if (selectedTenant()?.subscription) {
                  <div class="bg-purple-50 rounded-lg p-3 text-sm">
                    <span class="text-purple-700 font-medium">Current plan: {{ selectedTenant()!.subscription!.planName }}</span>
                    <span class="text-purple-500 ml-2">· Ends {{ selectedTenant()!.subscription!.endDate | date:'mediumDate' }}</span>
                  </div>
                }

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Additional Months <span class="text-red-500">*</span></label>
                    <input type="number" [(ngModel)]="renewForm.months" min="1" max="24"
                      (ngModelChange)="recalcRenewAmount()"
                      class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Payment Amount (EGP)
                      @if (calculatedRenewAmount() !== renewForm.paymentAmount) {
                        <button (click)="renewForm.paymentAmount = calculatedRenewAmount()" class="text-xs text-purple-600 hover:text-purple-800 ml-1">(reset to {{ calculatedRenewAmount() | number:'1.0-0' }})</button>
                      }
                    </label>
                    <input type="number" [(ngModel)]="renewForm.paymentAmount" min="0"
                      class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400" />
                    @if (currentPlanPrice() > 0) {
                      <p class="text-xs text-slate-400 mt-1">Auto: {{ currentPlanPrice() | number:'1.0-0' }} × {{ renewForm.months }} mo = {{ calculatedRenewAmount() | number:'1.0-0' }} EGP</p>
                    }
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                  <input [(ngModel)]="renewForm.notes" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="Payment reference or notes..." />
                </div>

                <button (click)="renew()" [disabled]="processing() || !selectedTenant()?.subscription"
                  class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  {{ processing() ? 'Renewing...' : 'Renew Subscription' }}
                </button>
              </div>
            }
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
  readonly activeTab = signal<'trial' | 'activate' | 'renew'>('activate');

  selectedTenantId = '';
  daysFilter = 7;

  trialForm: StartTrialRequest = { planId: '' };
  activateForm: ActivateSubscriptionRequest = { planId: '', months: 1, paymentAmount: 0, notes: '' };
  renewForm: RenewSubscriptionRequest = { months: 1, paymentAmount: 0, notes: '' };

  ngOnInit(): void {
    this.loadTenants();
    this.loadPlans();
    this.loadExpiring();

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
      next: data => this.plans.set((data || []).filter(p => p.isActive)),
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
      next: data => {
        this.selectedTenant.set(data);
        // Auto-detect best tab based on current subscription status
        if (!data.subscription) {
          this.activeTab.set('trial');
        } else if (data.subscription.status === 'Trial') {
          this.activeTab.set('activate');
        } else {
          this.activeTab.set('renew');
        }
      },
      error: () => this.selectedTenant.set(null),
    });
  }

  // ── Activate helpers ──
  selectActivatePlan(plan: Plan): void {
    this.activateForm.planId = plan.id;
    this.recalcActivateAmount();
  }

  recalcActivateAmount(): void {
    const plan = this.plans().find(p => p.id === this.activateForm.planId);
    if (plan) {
      this.activateForm.paymentAmount = plan.priceMonthly * this.activateForm.months;
    }
  }

  calculatedActivateAmount(): number {
    const plan = this.plans().find(p => p.id === this.activateForm.planId);
    return plan ? plan.priceMonthly * this.activateForm.months : 0;
  }

  selectedActivatePlanPrice(): number {
    return this.plans().find(p => p.id === this.activateForm.planId)?.priceMonthly ?? 0;
  }

  selectedActivatePlanName(): string {
    return this.plans().find(p => p.id === this.activateForm.planId)?.name ?? '—';
  }

  // ── Renew helpers ──
  recalcRenewAmount(): void {
    const price = this.currentPlanPrice();
    if (price > 0) {
      this.renewForm.paymentAmount = price * this.renewForm.months;
    }
  }

  calculatedRenewAmount(): number {
    return this.currentPlanPrice() * this.renewForm.months;
  }

  currentPlanPrice(): number {
    const tenant = this.selectedTenant();
    if (!tenant?.subscription) return 0;
    const plan = this.plans().find(p => p.name === tenant.subscription!.planName);
    return plan?.priceMonthly ?? 0;
  }

  // ── Actions ──
  startTrial(): void {
    if (!this.selectedTenant() || !this.trialForm.planId) return;
    this.processing.set(true);
    this.api.startTrial(this.selectedTenant()!.id, this.trialForm).subscribe({
      next: () => {
        this.toast.success('Trial started successfully');
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
        this.toast.success('Subscription activated successfully');
        this.processing.set(false);
        this.onTenantSelect(this.selectedTenant()!.id);
      },
      error: (err: any) => {
        this.toast.error(err?.message || 'Failed to activate subscription');
        this.processing.set(false);
      },
    });
  }

  renew(): void {
    if (!this.selectedTenant()) return;
    this.processing.set(true);
    this.api.renewSubscription(this.selectedTenant()!.id, this.renewForm).subscribe({
      next: () => {
        this.toast.success('Subscription renewed successfully');
        this.processing.set(false);
        this.onTenantSelect(this.selectedTenant()!.id);
        this.loadExpiring();
      },
      error: (err: any) => {
        this.toast.error(err?.message || 'Failed to renew subscription');
        this.processing.set(false);
      },
    });
  }
}
