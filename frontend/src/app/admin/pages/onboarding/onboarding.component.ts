import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { I18nService } from '../../../core/services/i18n.service';

interface Step {
  key: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Hero -->
      <div class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-black flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">{{ i18n.t('onboarding.title') }}</h1>
        <p class="text-gray-500 mt-2 max-w-lg mx-auto">{{ i18n.t('onboarding.subtitle') }}</p>
      </div>

      <!-- Steps -->
      <div class="space-y-4">
        @for (step of steps; track step.key; let idx = $index) {
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition hover:shadow-md"
               [class.ring-2]="expandedStep() === idx" [class.ring-black]="expandedStep() === idx">
            <!-- Step Header -->
            <button (click)="toggleStep(idx)"
                    class="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition">
              <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-700">
                {{ idx + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900">{{ i18n.t('onboarding.' + step.key + '.title') }}</h3>
                <p class="text-sm text-gray-500 truncate">{{ i18n.t('onboarding.' + step.key + '.brief') }}</p>
              </div>
              <div class="flex-shrink-0 text-2xl" [innerHTML]="step.icon"></div>
              <svg class="w-5 h-5 text-gray-400 transition-transform" [class.rotate-180]="expandedStep() === idx"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <!-- Step Details -->
            @if (expandedStep() === idx) {
              <div class="px-5 pb-5 border-t border-gray-100">
                <div class="pt-4 space-y-3">
                  <p class="text-gray-600 text-sm leading-relaxed">{{ i18n.t('onboarding.' + step.key + '.detail') }}</p>

                  <!-- Tips -->
                  <div class="bg-gray-50 rounded-xl p-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ i18n.t('onboarding.tips') }}</h4>
                    <ul class="space-y-1.5 text-sm text-gray-600">
                      <li class="flex items-start gap-2">
                        <span class="text-green-500 mt-0.5">✓</span>
                        <span>{{ i18n.t('onboarding.' + step.key + '.tip1') }}</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-green-500 mt-0.5">✓</span>
                        <span>{{ i18n.t('onboarding.' + step.key + '.tip2') }}</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-green-500 mt-0.5">✓</span>
                        <span>{{ i18n.t('onboarding.' + step.key + '.tip3') }}</span>
                      </li>
                    </ul>
                  </div>

                  <a [routerLink]="[tenant.adminUrl() + step.route]"
                     class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                    {{ i18n.t('onboarding.goTo') }} {{ i18n.t('onboarding.' + step.key + '.title') }}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Footer CTA -->
      <div class="text-center pb-8">
        <a [routerLink]="[tenant.adminUrl()]"
           class="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">
          {{ i18n.t('onboarding.backToDashboard') }}
        </a>
      </div>
    </div>
  `,
})
export class OnboardingComponent {
  readonly i18n = inject(I18nService);
  readonly tenant = inject(TenantService);

  readonly expandedStep = signal<number | null>(0);

  readonly steps: Step[] = [
    { key: 'settings',   icon: '⚙️', route: '/settings' },
    { key: 'categories', icon: '📂', route: '/categories' },
    { key: 'brands',     icon: '🏷️', route: '/brands' },
    { key: 'items',      icon: '📱', route: '/items' },
    { key: 'invoices',   icon: '🧾', route: '/invoices' },
    { key: 'expenses',   icon: '💰', route: '/expenses' },
    { key: 'employees',  icon: '👥', route: '/employees' },
    { key: 'leads',      icon: '📊', route: '/leads' },
  ];

  toggleStep(idx: number): void {
    this.expandedStep.set(this.expandedStep() === idx ? null : idx);
  }
}
