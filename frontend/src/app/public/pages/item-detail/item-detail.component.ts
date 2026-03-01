import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Item, ItemImage, CustomFieldValue, ChecklistItem } from '../../../core/models/item.models';
import { SettingsStore } from '../../../core/stores/settings.store';
import { CompareStore } from '../../../core/stores/compare.store';
import { TenantService } from '../../../core/services/tenant.service';
import { WhatsAppService } from '../../../core/services/whatsapp.service';
import { I18nService } from '../../../core/services/i18n.service';
import { ItemGalleryComponent } from '../../../shared/components/item-gallery/item-gallery.component';
import { FollowUpModalComponent } from '../../../shared/components/follow-up-modal/follow-up-modal.component';
import { resolveImageUrl } from '../../../core/utils/image.utils';

interface InstallmentPlan {
  providerName: string;
  providerType: string;
  providerLogoUrl: string | null;
  months: number;
  downPayment: number;
}

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, ItemGalleryComponent, FollowUpModalComponent],
  template: `
    @if (loading()) {
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div class="skeleton aspect-square rounded-2xl"></div>
          <div class="space-y-5">
            <div class="skeleton h-5 w-24"></div>
            <div class="skeleton h-9 w-3/4"></div>
            <div class="skeleton h-7 w-1/3"></div>
            <div class="skeleton h-48 w-full rounded-2xl"></div>
            <div class="skeleton h-14 w-full rounded-xl"></div>
          </div>
        </div>
      </div>
    } @else if (item()) {
      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <a [routerLink]="tenantService.storeUrl()" class="hover:text-[color:var(--color-primary)] transition">{{ i18n.t('store.home') }}</a>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <a [routerLink]="tenantService.storeUrl() + '/catalog'" class="hover:text-[color:var(--color-primary)] transition">{{ i18n.t('store.catalog') }}</a>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <span class="text-gray-600 font-medium truncate">{{ item()!.title }}</span>
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <!-- Gallery -->
          <app-item-gallery
            [mainImage]="item()!.mainImageUrl"
            [gallery]="parsedGallery()"
            [alt]="item()!.title" />

          <!-- Details -->
          <div class="space-y-6">
            <!-- Brand & Title -->
            <div>
              @if (item()!.brandName) {
                <p class="text-sm font-semibold text-[color:var(--color-primary)] uppercase tracking-wider mb-1.5">{{ item()!.brandName }}</p>
              }
              <h1 class="text-3xl font-extrabold text-gray-900 leading-tight">{{ item()!.title }}</h1>
            </div>

            <!-- Badges -->
            <div class="flex flex-wrap gap-2">
              @if (item()!.condition === 'New') {
                <span class="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">{{ i18n.t('store.new') }}</span>
              }
              @if (item()!.condition === 'Used') {
                <span class="text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">{{ i18n.t('store.used') }}</span>
              }
              @if (item()!.condition === 'Refurbished') {
                <span class="text-xs font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{{ i18n.t('store.refurbished') }}</span>
              }
              @if (item()!.status === 'Reserved') {
                <span class="text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">Reserved</span>
              }
              @if (item()!.status === 'Sold') {
                <span class="text-xs font-semibold bg-gray-200 text-gray-600 px-3 py-1 rounded-full">{{ i18n.t('store.sold') }}</span>
              }
              @if (item()!.oldPrice && item()!.oldPrice! > item()!.price) {
                <span class="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1 rounded-full">-{{ discountPercent() }}%</span>
              }
              @if (item()!.installmentAvailable) {
                <span class="text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{{ i18n.t('store.installmentAvailable') }}</span>
              }
            </div>

            <!-- Price -->
            <div class="bg-gray-50 rounded-2xl p-5">
              <div class="flex items-baseline gap-3 flex-wrap">
                <span class="text-4xl font-extrabold text-[color:var(--color-primary)]">
                  {{ item()!.price | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                </span>
                @if (item()!.oldPrice && item()!.oldPrice! > item()!.price) {
                  <span class="text-xl line-through text-gray-400">
                    {{ item()!.oldPrice | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                  </span>
                  <span class="text-sm font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">-{{ discountPercent() }}%</span>
                }
              </div>
              @if (item()!.installmentAvailable && installmentPlans().length) {
                <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                  <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                  <p class="text-sm text-gray-600">
                    {{ i18n.t('store.installmentAvailable') || 'Installment plans available' }}
                  </p>
                  <button (click)="showInstallmentModal = true" class="text-xs font-semibold text-purple-600 hover:text-purple-800 underline transition ml-auto">{{ i18n.t('store.viewPlans') }}</button>
                </div>
              }
            </div>

            <!-- Quick specs summary -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              @if (item()!.storage) {
                <div class="bg-gray-50 rounded-xl p-3 text-center">
                  <div class="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Storage</div>
                  <div class="text-sm font-bold text-gray-900">{{ item()!.storage }}</div>
                </div>
              }
              @if (item()!.ram) {
                <div class="bg-gray-50 rounded-xl p-3 text-center">
                  <div class="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">RAM</div>
                  <div class="text-sm font-bold text-gray-900">{{ item()!.ram }}</div>
                </div>
              }
              @if (item()!.color) {
                <div class="bg-gray-50 rounded-xl p-3 text-center">
                  <div class="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Color</div>
                  <div class="text-sm font-bold text-gray-900">{{ item()!.color }}</div>
                </div>
              }
              @if (item()!.batteryHealth) {
                <div class="bg-gray-50 rounded-xl p-3 text-center">
                  <div class="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Battery</div>
                  <div class="text-sm font-bold text-gray-900">{{ item()!.batteryHealth }}%</div>
                </div>
              }
              @if (item()!.warrantyType && item()!.warrantyType !== 'None') {
                <div class="bg-gray-50 rounded-xl p-3 text-center">
                  <div class="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{{ i18n.t('store.warranty') }}</div>
                  <div class="text-sm font-bold text-gray-900">{{ item()!.warrantyType }}@if (item()!.warrantyMonths) { ({{ item()!.warrantyMonths }}m) }</div>
                </div>
              }
              <div class="bg-gray-50 rounded-xl p-3 text-center">
                <div class="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{{ i18n.t('store.condition') }}</div>
                <div class="text-sm font-bold text-gray-900">{{ item()!.condition }}</div>
              </div>
            </div>

            <!-- CTAs -->
            <div class="flex flex-col sm:flex-row gap-3 pt-1">
              <button (click)="onWhatsAppClick()"
                class="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128c7e] text-white font-bold py-3.5 rounded-xl transition shadow-lg text-base">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.697-6.413-1.896l-.447-.292-2.637.884.884-2.637-.292-.447A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                {{ i18n.t('store.askWhatsApp') }}
              </button>
              <button (click)="followUpOpen = true"
                class="flex-1 py-3.5 px-5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-gray-300 hover:bg-gray-50 transition text-base text-center">
                {{ i18n.t('store.requestFollowUp') }}
              </button>
              <button
                (click)="onCompareToggle()"
                class="p-3.5 rounded-xl border-2 transition"
                [class]="compareStore.isInCompare(item()!.id) ? 'bg-[color:var(--color-primary)] text-white border-transparent' : 'border-gray-200 text-gray-500 hover:border-gray-300'"
                [disabled]="!compareStore.isInCompare(item()!.id) && compareStore.isFull()">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- ─── Tabbed Content Section ─── -->
        <div class="mt-12">
          <!-- Tab Buttons -->
          <div class="flex gap-1 border-b border-gray-200 overflow-x-auto">
            <button (click)="activeTab = 'description'"
              class="px-5 py-3 text-sm font-semibold whitespace-nowrap transition border-b-2 -mb-px"
              [class]="activeTab === 'description' ? 'border-[color:var(--color-primary)] text-[color:var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'">
              {{ i18n.t('store.description') }}
            </button>
            <button (click)="activeTab = 'specs'"
              class="px-5 py-3 text-sm font-semibold whitespace-nowrap transition border-b-2 -mb-px"
              [class]="activeTab === 'specs' ? 'border-[color:var(--color-primary)] text-[color:var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'">
              {{ i18n.t('store.specifications') }}
            </button>
            @if (parsedChecklist().length) {
              <button (click)="activeTab = 'checklist'"
                class="px-5 py-3 text-sm font-semibold whitespace-nowrap transition border-b-2 -mb-px"
                [class]="activeTab === 'checklist' ? 'border-[color:var(--color-primary)] text-[color:var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'">
                {{ i18n.t('store.qualityChecklist') }}
              </button>
            }
            @if (installmentPlans().length) {
              <button (click)="activeTab = 'installments'"
                class="px-5 py-3 text-sm font-semibold whitespace-nowrap transition border-b-2 -mb-px"
                [class]="activeTab === 'installments' ? 'border-[color:var(--color-primary)] text-[color:var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'">
                {{ i18n.t('store.installmentPlans') }}
              </button>
            }
          </div>

          <!-- Tab Content -->
          <div class="py-8">
            <!-- Description Tab -->
            @if (activeTab === 'description') {
              <div class="max-w-3xl">
                @if (item()!.description) {
                  <p class="text-gray-700 leading-relaxed whitespace-pre-line text-base">{{ item()!.description }}</p>
                } @else {
                  <p class="text-gray-400 italic text-sm">No description available.</p>
                }
              </div>
            }

            <!-- Specs Tab -->
            @if (activeTab === 'specs') {
              <div class="max-w-2xl bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div class="divide-y divide-gray-50">
                  @if (item()!.categoryName) {
                    <div class="flex px-5 py-3 text-sm bg-gray-50/50">
                      <span class="w-44 shrink-0 text-gray-500 font-medium">Category</span>
                      <span class="font-semibold text-gray-900">{{ item()!.categoryName }}</span>
                    </div>
                  }
                  @if (item()!.brandName) {
                    <div class="flex px-5 py-3 text-sm bg-gray-50/50">
                      <span class="w-44 shrink-0 text-gray-500 font-medium">Brand</span>
                      <span class="font-semibold text-gray-900">{{ item()!.brandName }}</span>
                    </div>
                  }
                  <div class="flex px-5 py-3 text-sm">
                    <span class="w-44 shrink-0 text-gray-500 font-medium">{{ i18n.t('store.condition') }}</span>
                    <span class="font-semibold text-gray-900">{{ item()!.condition }}</span>
                  </div>
                  @if (item()!.color) {
                    <div class="flex px-5 py-3 text-sm bg-gray-50/50">
                      <span class="w-44 shrink-0 text-gray-500 font-medium">Color</span>
                      <span class="font-semibold text-gray-900">{{ item()!.color }}</span>
                    </div>
                  }
                  @if (item()!.storage) {
                    <div class="flex px-5 py-3 text-sm">
                      <span class="w-44 shrink-0 text-gray-500 font-medium">Storage</span>
                      <span class="font-semibold text-gray-900">{{ item()!.storage }}</span>
                    </div>
                  }
                  @if (item()!.ram) {
                    <div class="flex px-5 py-3 text-sm bg-gray-50/50">
                      <span class="w-44 shrink-0 text-gray-500 font-medium">RAM</span>
                      <span class="font-semibold text-gray-900">{{ item()!.ram }}</span>
                    </div>
                  }
                  @if (item()!.batteryHealth) {
                    <div class="flex px-5 py-3 text-sm">
                      <span class="w-44 shrink-0 text-gray-500 font-medium">Battery Health</span>
                      <span class="font-semibold text-gray-900">{{ item()!.batteryHealth }}%</span>
                    </div>
                  }
                  @if (item()!.warrantyType && item()!.warrantyType !== 'None') {
                    <div class="flex px-5 py-3 text-sm bg-gray-50/50">
                      <span class="w-44 shrink-0 text-gray-500 font-medium">{{ i18n.t('store.warranty') }}</span>
                      <span class="font-semibold text-gray-900">{{ item()!.warrantyType }}@if (item()!.warrantyMonths) { ({{ item()!.warrantyMonths }} {{ i18n.t('store.months') }}) }</span>
                    </div>
                  }
                  @if (item()!.taxStatus === 'Taxable') {
                    <div class="flex px-5 py-3 text-sm">
                      <span class="w-44 shrink-0 text-gray-500 font-medium">Tax</span>
                      <span class="font-semibold text-gray-900">VAT {{ item()!.vatPercent }}%</span>
                    </div>
                  }
                  @for (field of parsedCustomFields(); track field.fieldId; let odd = $odd) {
                    <div class="flex px-5 py-3 text-sm" [class.bg-gray-50]="odd">
                      <span class="w-44 shrink-0 text-gray-500 font-medium">{{ field.fieldName }}</span>
                      <span class="font-semibold text-gray-900">{{ field.value }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Checklist Tab -->
            @if (activeTab === 'checklist') {
              <div class="max-w-2xl">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  @for (check of parsedChecklist(); track check.key) {
                    <div class="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4">
                      @if (check.passed) {
                        <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">&#10003;</span>
                      } @else {
                        <span class="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">&times;</span>
                      }
                      <div>
                        <span class="text-sm font-semibold text-gray-900">{{ check.label }}</span>
                        @if (check.notes) {
                          <p class="text-xs text-gray-500 mt-0.5">{{ check.notes }}</p>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Installment Plans Tab -->
            @if (activeTab === 'installments') {
              <div class="max-w-3xl space-y-6">
                @for (group of providerGroups(); track group.name) {
                  <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div class="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
                      @if (group.logoUrl) {
                        <img [src]="resolveImg(group.logoUrl)" [alt]="group.name" class="h-8 w-auto object-contain">
                      } @else {
                        <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">{{ group.name.charAt(0) }}</div>
                      }
                      <div>
                        <h4 class="font-bold text-gray-900 text-sm">{{ group.name }}</h4>
                        <span class="text-xs text-gray-500">{{ group.type }}</span>
                      </div>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-sm">
                        <thead>
                          <tr class="text-start text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            <th class="px-5 py-3 font-medium">{{ i18n.t('store.months') }}</th>
                            <th class="px-5 py-3 font-medium">{{ i18n.t('store.downPayment') }}</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50">
                          @for (plan of group.plans; track plan.months; let odd = $odd) {
                            <tr [class.bg-gray-50]="odd" class="hover:bg-purple-50/50 transition">
                              <td class="px-5 py-3 font-semibold text-gray-900">{{ plan.months }}</td>
                              <td class="px-5 py-3 text-gray-700">{{ plan.downPayment | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }
                @if (!installmentPlans().length) {
                  <p class="text-gray-400 text-sm italic">No installment plans available for this item.</p>
                }
              </div>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="max-w-7xl mx-auto px-4 py-20 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">{{ i18n.t('store.itemNotFound') }}</h2>
        <p class="text-gray-500 mb-6">{{ i18n.t('store.itemNotFoundDesc') }}</p>
        <a [routerLink]="tenantService.storeUrl() + '/catalog'" class="inline-flex items-center gap-2 bg-[color:var(--color-primary)] text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition text-sm">{{ i18n.t('store.browseCatalog') }}</a>
      </div>
    }

    <app-follow-up-modal
      [open]="followUpOpen"
      [itemId]="item()?.id || ''"
      [itemTitle]="item()?.title || ''"
      (closed)="followUpOpen = false" />

    <!-- Installment Plans Modal (Quick View) -->
    @if (showInstallmentModal && item()) {
      <div class="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" (click)="showInstallmentModal = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
          <div class="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
            <h3 class="font-bold text-lg text-gray-900">{{ i18n.t('store.installmentPlans') }}</h3>
            <button (click)="showInstallmentModal = false" class="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition">&times;</button>
          </div>
          <div class="p-5 overflow-y-auto space-y-4">
            <div class="flex items-center gap-3 bg-purple-50 rounded-xl p-4">
              <svg class="w-8 h-8 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
              <div>
                <div class="text-sm font-bold text-gray-900">{{ item()!.title }}</div>
                <div class="text-lg font-extrabold text-[color:var(--color-primary)]">{{ item()!.price | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</div>
              </div>
            </div>

            @for (group of providerGroups(); track group.name) {
              <div class="border border-gray-100 rounded-xl overflow-hidden">
                <div class="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  @if (group.logoUrl) {
                    <img [src]="resolveImg(group.logoUrl)" [alt]="group.name" class="h-6 w-auto">
                  }
                  <span class="text-sm font-bold text-gray-900">{{ group.name }}</span>
                  <span class="text-[10px] text-gray-400 uppercase">{{ group.type }}</span>
                </div>
                @for (plan of group.plans; track plan.months) {
                  <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-b-0 hover:bg-purple-50/30 transition">
                    <span class="text-sm text-gray-700">{{ plan.months }} {{ i18n.t('store.months') }}</span>
                    <div class="text-end">
                      @if (plan.downPayment > 0) {
                        <span class="text-sm font-bold text-purple-600">{{ plan.downPayment | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }} {{ i18n.t('store.downPayment') }}</span>
                      } @else {
                        <span class="text-sm font-bold text-emerald-600">{{ i18n.t('store.noDownPayment') || 'No Down Payment' }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            @if (!installmentPlans().length) {
              <p class="text-sm text-gray-400 text-center py-4">Loading plans...</p>
            }

            <a [href]="installmentWhatsAppUrl()"
               target="_blank"
               class="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#128c7e] text-white font-bold py-3 rounded-xl transition text-sm">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              {{ i18n.t('store.askAboutInstallment') }}
            </a>
          </div>
        </div>
      </div>
    }
  `,
})
export class ItemDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly whatsappService = inject(WhatsAppService);
  readonly settingsStore = inject(SettingsStore);
  readonly compareStore = inject(CompareStore);
  readonly tenantService = inject(TenantService);
  readonly i18n = inject(I18nService);

  readonly item = signal<Item | null>(null);
  readonly loading = signal(true);
  readonly installmentPlans = signal<InstallmentPlan[]>([]);

  followUpOpen = false;
  showInstallmentModal = false;
  activeTab: 'description' | 'specs' | 'checklist' | 'installments' = 'description';

  readonly discountPercent = computed(() => {
    const i = this.item();
    if (!i || !i.oldPrice || i.oldPrice <= i.price) return 0;
    return Math.round(((i.oldPrice - i.price) / i.oldPrice) * 100);
  });

  readonly lowestMonthly = computed(() => {
    return null; // Removed - monthly payment no longer tracked
  });

  readonly providerGroups = computed(() => {
    const plans = this.installmentPlans();
    const map = new Map<string, { name: string; type: string; logoUrl: string | null; plans: InstallmentPlan[] }>();
    for (const p of plans) {
      let group = map.get(p.providerName);
      if (!group) {
        group = { name: p.providerName, type: p.providerType, logoUrl: p.providerLogoUrl, plans: [] };
        map.set(p.providerName, group);
      }
      group.plans.push(p);
    }
    return Array.from(map.values());
  });

  // Parse JSON string fields from backend into typed arrays
  readonly parsedGallery = computed<ItemImage[]>(() => {
    const i = this.item();
    if (!i?.galleryImagesJson) return [];
    try {
      const urls: string[] = JSON.parse(i.galleryImagesJson);
      return urls.map((url, idx) => ({ id: String(idx), url, sortOrder: idx }));
    } catch { return []; }
  });

  readonly parsedCustomFields = computed<CustomFieldValue[]>(() => {
    const i = this.item();
    if (!i?.customFieldsJson) return [];
    try { return JSON.parse(i.customFieldsJson); } catch { return []; }
  });

  readonly parsedChecklist = computed<ChecklistItem[]>(() => {
    const i = this.item();
    if (!i?.checklistJson) return [];
    try { return JSON.parse(i.checklistJson); } catch { return []; }
  });

  resolveImg = resolveImageUrl;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['itemSlug'];
      this.loading.set(true);
      this.api.get<Item>(`/Public/items/${slug}`).subscribe({
        next: data => {
          this.item.set(data);
          this.loading.set(false);

          // Load installment plans if available
          if (data.installmentAvailable) {
            this.api.get<InstallmentPlan[]>(`/Public/items/${data.id}/installments`).subscribe({
              next: plans => this.installmentPlans.set(plans),
              error: () => this.installmentPlans.set([]),
            });
          }
        },
        error: () => {
          this.item.set(null);
          this.loading.set(false);
        },
      });
    });
  }

  onWhatsAppClick(): void {
    const i = this.item();
    if (!i) return;
    this.whatsappService.clickAndOpen({
      targetType: 'Item',
      targetId: i.id,
      targetTitle: i.title,
      pageUrl: window.location.href,
    }).subscribe();
  }

  onCompareToggle(): void {
    const i = this.item();
    if (i) this.compareStore.toggle(i);
  }

  installmentWhatsAppUrl(): string {
    const i = this.item();
    if (!i) return '#';
    const phone = this.settingsStore.whatsappNumber().replace(/\D/g, '');
    const store = this.settingsStore.storeName();
    const msg = `Hi ${store}, I'm interested in installment plans for ${i.title} (${i.price} ${this.settingsStore.currency()}).\n${window.location.href}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }
}
