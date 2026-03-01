import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { SettingsStore } from '../../../core/stores/settings.store';
import { I18nService } from '../../../core/services/i18n.service';

interface InstallmentProvider {
  id: string;
  name: string;
  type: string;
  logoUrl: string | null;
  isActive: boolean;
  displayOrder: number;
}

interface InstallmentPlan {
  id: string;
  providerId: string;
  providerName: string;
  itemId: string | null;
  itemTitle: string | null;
  months: number;
  downPayment: number;
  adminFees: number;
  downPaymentPercent: number | null;
  adminFeesPercent: number | null;
  interestRate: number | null;
  notes: string | null;
  isActive: boolean;
}

@Component({
  selector: 'app-installments',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ i18n.t('installments.providersTitle') }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ i18n.t('installments.subtitle') }}</p>
        </div>
        <button (click)="showProviderForm = true; editingProvider = null; resetProviderForm()" class="btn-primary">{{ i18n.t('installments.addProvider') }}</button>
      </div>

      <!-- Providers List -->
      @if (loadingProviders()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-20 rounded-xl bg-gray-100 animate-pulse"></div>
          }
        </div>
      } @else if (providers().length === 0) {
        <div class="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div class="text-5xl mb-4">🏦</div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">{{ i18n.t('installments.noProviders') }}</h3>
          <p class="text-sm text-gray-500 mb-4">{{ i18n.t('installments.noProvidersHint') }}</p>
          <button (click)="showProviderForm = true; resetProviderForm()" class="btn-primary">{{ i18n.t('installments.addProvider') }}</button>
        </div>
      } @else {
        <div class="space-y-3">
          @for (provider of providers(); track provider.id) {
            <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-400 shrink-0">
                  {{ provider.name.charAt(0) }}
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">{{ provider.name }}</h3>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                      [class]="provider.type === 'Banks' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'">
                      {{ provider.type }}
                    </span>
                    <span class="text-xs" [class]="provider.isActive ? 'text-emerald-600' : 'text-gray-400'">
                      {{ provider.isActive ? i18n.t('common.active') : i18n.t('common.inactive') }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button (click)="editProvider(provider)" class="text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">{{ i18n.t('common.edit') }}</button>
                <button (click)="deleteProvider(provider.id)" class="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">{{ i18n.t('common.delete') }}</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Plans Section -->
      <div class="flex items-center justify-between pt-4">
        <h2 class="text-xl font-bold text-gray-900">{{ i18n.t('installments.plansTitle') }}</h2>
        @if (providers().length > 0) {
          <button (click)="showPlanForm = true; editingPlan = null; resetPlanForm()" class="btn-primary text-sm">{{ i18n.t('installments.addPlan') }}</button>
        }
      </div>

      @if (loadingPlans()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-16 rounded-xl bg-gray-100 animate-pulse"></div>
          }
        </div>
      } @else if (plans().length === 0) {
        <div class="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <p class="text-gray-500">{{ i18n.t('installments.noPlans') }}</p>
        </div>
      } @else {
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{{ i18n.t('installments.providerCol') }}</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{{ i18n.t('installments.monthsCol') }}</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{{ i18n.t('installments.downPaymentCol') }}</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{{ i18n.t('installments.feesCol') }}</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{{ i18n.t('installments.interestCol') }}</th>
                <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{{ i18n.t('common.status') }}</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (plan of plans(); track plan.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ plan.providerName }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ plan.months }} {{ i18n.t('installments.monthsSuffix') }}</td>
                  <td class="px-4 py-3 text-right text-gray-600">
                    @if (plan.downPaymentPercent) {
                      <span class="text-xs font-semibold text-blue-600">{{ plan.downPaymentPercent }}%</span>
                    } @else {
                      {{ plan.downPayment | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                    }
                  </td>
                  <td class="px-4 py-3 text-right text-gray-600">
                    @if (plan.adminFeesPercent) {
                      <span class="text-xs font-semibold text-blue-600">{{ plan.adminFeesPercent }}%</span>
                    } @else {
                      {{ plan.adminFees | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                    }
                  </td>
                  <td class="px-4 py-3 text-right text-gray-600">
                    @if (plan.interestRate) {
                      <span class="text-xs font-semibold">{{ plan.interestRate }}%</span>
                    } @else {
                      <span class="text-xs text-gray-400">0%</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                      [class]="plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'">
                      {{ plan.isActive ? i18n.t('common.active') : i18n.t('common.inactive') }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button (click)="editPlan(plan)" class="text-gray-500 hover:text-gray-900 text-xs">{{ i18n.t('common.edit') }}</button>
                    <button (click)="deletePlan(plan.id)" class="text-red-500 hover:text-red-700 text-xs ml-2">{{ i18n.t('common.delete') }}</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Provider Modal -->
      @if (showProviderForm) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" (click)="showProviderForm = false">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-bold mb-4">{{ editingProvider ? i18n.t('installments.editProvider') : i18n.t('installments.addProvider') }}</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">{{ i18n.t('installments.providerName') }}</label>
                <input [(ngModel)]="providerForm.name" class="input-field" [placeholder]="i18n.t('installments.providerNamePlaceholder')" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Type</label>
                <select [(ngModel)]="providerForm.type" class="input-field">
                  <option value="Banks">Banks</option>
                  <option value="BNPL">BNPL</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Logo URL</label>
                <input [(ngModel)]="providerForm.logoUrl" class="input-field" placeholder="https://..." />
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" [(ngModel)]="providerForm.isActive" id="providerActive" class="rounded" />
                <label for="providerActive" class="text-sm">{{ i18n.t('common.active') }}</label>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Display Order</label>
                <input type="number" [(ngModel)]="providerForm.displayOrder" class="input-field" />
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button (click)="saveProvider()" class="btn-primary flex-1" [disabled]="savingProvider()">
                {{ savingProvider() ? i18n.t('common.saving') : i18n.t('common.save') }}
              </button>
              <button (click)="showProviderForm = false" class="btn-outline flex-1">{{ i18n.t('common.cancel') }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Plan Modal -->
      @if (showPlanForm) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" (click)="showPlanForm = false">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-bold mb-4">{{ editingPlan ? i18n.t('common.edit') : i18n.t('installments.addPlan') }}</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Provider</label>
                <select [(ngModel)]="planForm.providerId" class="input-field">
                  @for (p of providers(); track p.id) {
                    <option [value]="p.id">{{ p.name }}</option>
                  }
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1">{{ i18n.t('installments.months') }}</label>
                  <input type="number" [(ngModel)]="planForm.months" class="input-field" min="1" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">{{ i18n.t('installments.interestRate') }}</label>
                  <input type="number" [(ngModel)]="planForm.interestRate" class="input-field" placeholder="e.g. 2.5" step="0.1" />
                  <p class="text-[10px] text-gray-400 mt-0.5">Annual rate. Leave empty for 0% interest.</p>
                </div>
              </div>

              <!-- Down Payment -->
              <div class="p-3 bg-gray-50 rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium">{{ i18n.t('installments.downPayment') }}</label>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] text-gray-500 mb-1">Percentage %</label>
                    <input type="number" [(ngModel)]="planForm.downPaymentPercent" class="input-field" placeholder="e.g. 20" step="0.1" min="0" max="100" />
                  </div>
                  <div>
                    <label class="block text-[11px] text-gray-500 mb-1">Fixed Amount</label>
                    <input type="number" [(ngModel)]="planForm.downPayment" class="input-field" placeholder="0" />
                  </div>
                </div>
                <p class="text-[10px] text-gray-400">Set % to calculate from item price, or enter a fixed amount. % takes priority.</p>
              </div>

              <!-- Admin Fees -->
              <div class="p-3 bg-gray-50 rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium">{{ i18n.t('installments.adminFees') }}</label>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] text-gray-500 mb-1">Percentage %</label>
                    <input type="number" [(ngModel)]="planForm.adminFeesPercent" class="input-field" placeholder="e.g. 5" step="0.1" min="0" max="100" />
                  </div>
                  <div>
                    <label class="block text-[11px] text-gray-500 mb-1">Fixed Amount</label>
                    <input type="number" [(ngModel)]="planForm.adminFees" class="input-field" placeholder="0" />
                  </div>
                </div>
                <p class="text-[10px] text-gray-400">Set % to calculate from item price, or enter a fixed amount. % takes priority.</p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1">{{ i18n.t('installments.planNotes') }}</label>
                  <input [(ngModel)]="planForm.notes" class="input-field" [placeholder]="i18n.t('installments.notesPlaceholder')" />
                </div>
                <div class="flex items-center gap-2">
                  <input type="checkbox" [(ngModel)]="planForm.isActive" id="planActive" class="rounded" />
                  <label for="planActive" class="text-sm">{{ i18n.t('common.active') }}</label>
                </div>
              </div>
              <div class="flex gap-3 mt-6">
                <button (click)="savePlan()" class="btn-primary flex-1" [disabled]="savingPlan()">
                  {{ savingPlan() ? i18n.t('common.saving') : i18n.t('common.save') }}
                </button>
                <button (click)="showPlanForm = false" class="btn-outline flex-1">{{ i18n.t('common.cancel') }}</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class InstallmentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly settingsStore = inject(SettingsStore);
  readonly i18n = inject(I18nService);

  readonly providers = signal<InstallmentProvider[]>([]);
  readonly plans = signal<InstallmentPlan[]>([]);
  readonly loadingProviders = signal(true);
  readonly loadingPlans = signal(true);
  readonly savingProvider = signal(false);
  readonly savingPlan = signal(false);

  showProviderForm = false;
  showPlanForm = false;
  editingProvider: InstallmentProvider | null = null;
  editingPlan: InstallmentPlan | null = null;

  providerForm = { name: '', type: 'BNPL', logoUrl: '', isActive: true, displayOrder: 0 };
  planForm: any = { providerId: '', months: 12, downPayment: 0, adminFees: 0, downPaymentPercent: null as number | null, adminFeesPercent: null as number | null, interestRate: null as number | null, notes: '', isActive: true };

  ngOnInit(): void {
    this.loadProviders();
    this.loadPlans();
  }

  loadProviders(): void {
    this.api.get<InstallmentProvider[]>('/Installments/providers').subscribe({
      next: data => { this.providers.set(data || []); this.loadingProviders.set(false); },
      error: () => this.loadingProviders.set(false),
    });
  }

  loadPlans(): void {
    this.api.get<InstallmentPlan[]>('/Installments/plans').subscribe({
      next: data => { this.plans.set(data || []); this.loadingPlans.set(false); },
      error: () => this.loadingPlans.set(false),
    });
  }

  resetProviderForm(): void {
    this.providerForm = { name: '', type: 'BNPL', logoUrl: '', isActive: true, displayOrder: 0 };
  }

  resetPlanForm(): void {
    this.planForm = { providerId: this.providers()[0]?.id || '', months: 12, downPayment: 0, adminFees: 0, downPaymentPercent: null, adminFeesPercent: null, interestRate: null, notes: '', isActive: true };
  }

  editProvider(p: InstallmentProvider): void {
    this.editingProvider = p;
    this.providerForm = { name: p.name, type: p.type, logoUrl: p.logoUrl || '', isActive: p.isActive, displayOrder: p.displayOrder };
    this.showProviderForm = true;
  }

  editPlan(p: InstallmentPlan): void {
    this.editingPlan = p;
    this.planForm = {
      providerId: p.providerId, months: p.months,
      downPayment: p.downPayment, adminFees: p.adminFees,
      downPaymentPercent: p.downPaymentPercent, adminFeesPercent: p.adminFeesPercent,
      interestRate: p.interestRate,
      notes: p.notes || '', isActive: p.isActive,
    };
    this.showPlanForm = true;
  }

  saveProvider(): void {
    if (!this.providerForm.name.trim()) { this.toast.error('Provider name is required'); return; }
    this.savingProvider.set(true);

    const obs$ = this.editingProvider
      ? this.api.put(`/Installments/providers/${this.editingProvider.id}`, this.providerForm)
      : this.api.post('/Installments/providers', this.providerForm);

    obs$.subscribe({
      next: () => {
        this.toast.success(this.i18n.t('installments.providerSaved'));
        this.showProviderForm = false;
        this.savingProvider.set(false);
        this.loadProviders();
      },
      error: (err: any) => {
        this.toast.error(err.message || this.i18n.t('installments.saveFailed'));
        this.savingProvider.set(false);
      },
    });
  }

  savePlan(): void {
    if (!this.planForm.providerId) { this.toast.error('Select a provider'); return; }
    this.savingPlan.set(true);

    const obs$ = this.editingPlan
      ? this.api.put(`/Installments/plans/${this.editingPlan.id}`, this.planForm)
      : this.api.post('/Installments/plans', this.planForm);

    obs$.subscribe({
      next: () => {
        this.toast.success(this.i18n.t('installments.providerSaved'));
        this.showPlanForm = false;
        this.savingPlan.set(false);
        this.loadPlans();
      },
      error: (err: any) => {
        this.toast.error(err.message || this.i18n.t('installments.saveFailed'));
        this.savingPlan.set(false);
      },
    });
  }

  deleteProvider(id: string): void {
    if (!confirm(this.i18n.t('common.confirmDelete'))) return;
    this.api.delete(`/Installments/providers/${id}`).subscribe({
      next: () => { this.toast.success(this.i18n.t('installments.providerDeleted')); this.loadProviders(); this.loadPlans(); },
      error: (err: any) => this.toast.error(err.message || this.i18n.t('installments.deleteFailed')),
    });
  }

  deletePlan(id: string): void {
    if (!confirm(this.i18n.t('common.confirmDelete'))) return;
    this.api.delete(`/Installments/plans/${id}`).subscribe({
      next: () => { this.toast.success(this.i18n.t('installments.providerDeleted')); this.loadPlans(); },
      error: (err: any) => this.toast.error(err.message || this.i18n.t('installments.deleteFailed')),
    });
  }
}
