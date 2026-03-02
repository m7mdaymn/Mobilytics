import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { TenantService } from '../../../core/services/tenant.service';
import { I18nService } from '../../../core/services/i18n.service';
import { SettingsStore } from '../../../core/stores/settings.store';
import { Brand, Category, CustomFieldDefinition, ItemImage } from '../../../core/models/item.models';
import { resolveImageUrl } from '../../../core/utils/image.utils';

interface InstallmentProviderRef { id: string; name: string; logoUrl: string | null; }
interface InstallmentPlanRef { id: string; providerId: string; months: number; downPaymentPercent: number | null; adminFeesPercent: number | null; interestRate: number | null; downPayment: number; adminFees: number; isActive: boolean; }
interface ChecklistEntry { key: string; label: string; passed: boolean; notes: string; }

const STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];
const RAM_OPTIONS = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '18GB', '24GB', '32GB'];
const COLOR_OPTIONS = [
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Space Gray', hex: '#535150' },
  { name: 'Silver', hex: '#C0C0C0' }, { name: 'Gold', hex: '#FFD700' }, { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Blue', hex: '#007AFF' }, { name: 'Red', hex: '#FF3B30' }, { name: 'Green', hex: '#34C759' },
  { name: 'Purple', hex: '#AF52DE' }, { name: 'Yellow', hex: '#FFCC00' }, { name: 'Orange', hex: '#FF9500' },
  { name: 'Pink', hex: '#FF2D55' }, { name: 'Midnight', hex: '#1C1C1E' }, { name: 'Starlight', hex: '#F5E6D3' },
  { name: 'Graphite', hex: '#41424C' }, { name: 'Sierra Blue', hex: '#A7C1D9' }, { name: 'Alpine Green', hex: '#576856' },
  { name: 'Deep Purple', hex: '#635488' }, { name: 'Natural Titanium', hex: '#A9A9A4' },
];

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe],
  template: `
    <div class="max-w-3xl mx-auto space-y-5 pb-28">

      <!-- HEADER -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ isEdit() ? i18n.t('items.editItem') : i18n.t('items.addNew') }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ i18n.t('items.formSubtitle') }}</p>
        </div>
        <a [routerLink]="tenantService.adminUrl() + '/items'" class="text-sm text-gray-500 hover:text-gray-900 font-medium transition">&larr; {{ i18n.t('common.back') }}</a>
      </div>

      <!-- LOADING -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <svg class="w-8 h-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      } @else {

      <!-- 1. BASIC INFO -->
      <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
        <h2 class="font-semibold text-base text-gray-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">1</span>
          {{ i18n.t('items.basicInfo') }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.titleLabel') }} <span class="text-red-500">*</span></label>
            <input [(ngModel)]="form.title" (ngModelChange)="autoSlug()" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition" [placeholder]="i18n.t('items.titlePlaceholder')" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.urlSlug') }}</label>
            <input [(ngModel)]="form.slug" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-gray-50 font-mono text-xs focus:ring-2 focus:ring-gray-900/10 outline-none transition" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.condition') }}</label>
            <div class="flex gap-2">
              @for (cond of conditionOptions; track cond) {
                <button type="button" (click)="form.condition = cond"
                  class="flex-1 py-2 rounded-xl text-sm font-medium border transition-all text-center"
                  [class]="form.condition === cond
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'">
                  {{ cond === 'New' ? i18n.t('items.conditionNew') : cond === 'Used' ? i18n.t('items.conditionUsed') : i18n.t('items.conditionRefurbished') }}
                </button>
              }
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.category') }} <span class="text-red-500">*</span></label>
            <select [(ngModel)]="form.categoryId" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none transition">
              <option value="">{{ i18n.t('items.selectCategory') }}</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.brand') }}</label>
            <select [(ngModel)]="form.brandId" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none transition">
              <option value="">{{ i18n.t('items.selectBrand') }}</option>
              @for (brand of brands(); track brand.id) {
                <option [value]="brand.id">{{ brand.name }}</option>
              }
            </select>
          </div>
          <div class="flex items-center">
            <label class="flex items-center gap-2 cursor-pointer pt-5">
              <input type="checkbox" [(ngModel)]="form.isFeatured" class="w-4 h-4 rounded accent-gray-900" />
              <span class="text-sm font-medium text-gray-700">{{ i18n.t('items.featured') }}</span>
            </label>
          </div>
        </div>
      </section>

      <!-- 2. DEVICE TYPE & SPECS (unified) -->
      <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
        <h2 class="font-semibold text-base text-gray-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">2</span>
          {{ i18n.t('items.deviceTypeAndSpecs') || 'Device Type & Specs' }}
        </h2>

        <!-- Device Type Dropdown -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.deviceType') || 'Device Type' }}</label>
          <select [(ngModel)]="form.deviceType" (ngModelChange)="onDeviceTypeChange()" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none transition">
            <option value="">{{ i18n.t('items.selectDeviceType') }}</option>
            @for (dt of deviceTypeOptions; track dt) {
              <option [value]="dt">{{ deviceTypeLabel(dt) }}</option>
            }
          </select>
          <p class="text-xs text-gray-400 mt-1">{{ i18n.t('items.deviceTypeHint') || 'Select a device type to load relevant spec fields' }}</p>
        </div>

        @if (form.deviceType) {
          <!-- Color Picker -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.color') }}</label>
            <div class="flex flex-wrap gap-1.5">
              @for (c of colorOptions; track c.name) {
                <button type="button" (click)="selectColor(c.name)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                  [class]="form.color === c.name
                    ? 'border-gray-900 bg-gray-900 text-white ring-1 ring-gray-900/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'">
                  <span class="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0" [style.background-color]="c.hex"></span>
                  {{ c.name }}
                </button>
              }
            </div>
            <input [(ngModel)]="form.color" (ngModelChange)="syncSpecEntry('Color', $event)" class="mt-2 w-full max-w-xs px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 outline-none" [placeholder]="i18n.t('items.customColor')" />
          </div>

          <!-- Storage Picker (hidden for Accessories, Headphones, etc.) -->
          @if (showStoragePicker) {
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.storage') }}</label>
            <div class="flex flex-wrap gap-2">
              @for (s of storageOptions; track s) {
                <button type="button" (click)="selectStorage(s)"
                  class="px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all"
                  [class]="form.storage === s
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'">
                  {{ s }}
                </button>
              }
            </div>
            <input [(ngModel)]="form.storage" (ngModelChange)="syncSpecEntry('Storage', $event)" class="mt-2 w-full max-w-xs px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 outline-none" [placeholder]="i18n.t('items.customStorage')" />
          </div>
          }

          <!-- RAM Picker (hidden for Accessories, Headphones, Camera, etc.) -->
          @if (showRamPicker) {
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.ram') }}</label>
            <div class="flex flex-wrap gap-2">
              @for (r of ramOptions; track r) {
                <button type="button" (click)="selectRam(r)"
                  class="px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all"
                  [class]="form.ram === r
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'">
                  {{ r }}
                </button>
              }
            </div>
            <input [(ngModel)]="form.ram" (ngModelChange)="syncSpecEntry('RAM', $event)" class="mt-2 w-full max-w-xs px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 outline-none" [placeholder]="i18n.t('items.customRam')" />
          </div>
          }

          <!-- Preset spec fields from device type -->
          <div class="border-t border-gray-100 pt-4">
            <div class="flex items-center justify-between mb-3">
              <label class="block text-sm font-medium text-gray-700">{{ i18n.t('items.specs') }}</label>
              <button type="button" (click)="addSpecEntry()" class="text-xs text-gray-500 hover:text-gray-700 font-medium transition flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                {{ i18n.t('common.add') }}
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-3">
              @for (field of activeSpecPresets; track field.label) {
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">{{ field.label }}</label>
                  @if (field.options && field.options.length) {
                    <select
                      [ngModel]="getSpecValue(field.label)"
                      (ngModelChange)="setSpecValue(field.label, $event)"
                      class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none transition focus:border-gray-400 bg-white">
                      <option value="">— {{ i18n.t('common.select') || 'Select' }} —</option>
                      @for (opt of field.options; track opt) {
                        <option [value]="opt">{{ opt }}</option>
                      }
                    </select>
                    <input
                      [ngModel]="getSpecValue(field.label)"
                      (ngModelChange)="setSpecValue(field.label, $event)"
                      class="mt-1.5 w-full px-3 py-1.5 border border-gray-100 rounded-lg text-xs outline-none bg-gray-50 transition focus:border-gray-300"
                      [placeholder]="i18n.t('items.orTypeCustom') || 'Or type custom value...'" />
                  } @else {
                    <input
                      [ngModel]="getSpecValue(field.label)"
                      (ngModelChange)="setSpecValue(field.label, $event)"
                      class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none transition focus:border-gray-400"
                      [placeholder]="field.placeholder || 'Enter value...'" />
                  }
                </div>
              }
            </div>

            <!-- Custom spec entries (non-preset labels) -->
            @if (hasCustomSpecs()) {
              <div class="space-y-2 mb-3 pt-3 border-t border-gray-100">
                @for (spec of specsEntries; track $index; let i = $index) {
                  @if (!isPresetSpec(spec.label)) {
                    <div class="flex items-center gap-2">
                      <input [(ngModel)]="spec.label" (blur)="saveCustomSpecField(spec.label)" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition" [placeholder]="i18n.t('items.specLabel') || 'Label'" />
                      <input [(ngModel)]="spec.value" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition" placeholder="e.g. 6.7 inch OLED" />
                      <button type="button" (click)="removeSpecEntry(i)" class="text-red-400 hover:text-red-600 p-1 transition shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  }
                }
              </div>
            }
            <p class="text-xs text-gray-400 mt-1">{{ i18n.t('items.specsHint') }}</p>
          </div>
        }
      </section>

      <!-- 3. CONDITION DETAILS & IDENTIFIERS -->
      @if (form.deviceType) {
      <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
          <h2 class="font-semibold text-base text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">!</span>
            {{ i18n.t('items.conditionDetails') }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.batteryHealth') }} %</label>
                <div class="relative">
                  <input [(ngModel)]="form.batteryHealth" type="number" min="0" max="100" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition" [placeholder]="i18n.t('items.egBattery')" />
                  @if (form.batteryHealth != null) {
                    <div class="absolute inset-y-0 end-3 flex items-center">
                      <span class="text-xs font-bold"
                        [class]="form.batteryHealth >= 80 ? 'text-green-600' : form.batteryHealth >= 50 ? 'text-yellow-600' : 'text-red-600'">
                        {{ form.batteryHealth >= 80 ? i18n.t('items.good') : form.batteryHealth >= 50 ? i18n.t('items.fair') : i18n.t('items.poor') }}
                      </span>
                    </div>
                  }
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">IMEI</label>
                <input [(ngModel)]="form.imei" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition font-mono" [placeholder]="i18n.t('items.optional')" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.serialNumber') }}</label>
                <input [(ngModel)]="form.serialNumber" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition font-mono" [placeholder]="i18n.t('items.optional')" />
              </div>
          </div>
        </section>
      }

      <!-- 4. INVENTORY & WARRANTY -->
      <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
          <h2 class="font-semibold text-base text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">3</span>
            {{ i18n.t('items.inventory') }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.qty') }}</label>
              <input [(ngModel)]="form.quantity" type="number" min="0" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.minQty') }}</label>
              <input [(ngModel)]="form.lowStockThreshold" type="number" min="0" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition" />
            </div>
          </div>

          <!-- Warranty -->
            <div class="border-t border-gray-100 pt-4">
              <h3 class="text-sm font-semibold text-gray-700 mb-3">{{ i18n.t('items.warranty') }}</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.warrantyType') }}</label>
                  <select [(ngModel)]="form.warrantyType" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition">
                    <option value="">{{ i18n.t('items.warrantyNone') }}</option>
                    <option value="Manufacturer">{{ i18n.t('items.warrantyManufacturer') }}</option>
                    <option value="Store">{{ i18n.t('items.warrantyStore') }}</option>
                    <option value="Extended">{{ i18n.t('items.warrantyExtended') }}</option>
                  </select>
                </div>
                @if (form.warrantyType) {
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.warrantyMonths') }}</label>
                    <input [(ngModel)]="form.warrantyMonths" type="number" min="0" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition" [placeholder]="i18n.t('items.egMonths')" />
                  </div>
                }
              </div>
            </div>
        </section>

      <!-- 5. PRICING -->
      <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
        <h2 class="font-semibold text-base text-gray-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">4</span>
          {{ i18n.t('items.pricing') }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.price') }} <span class="text-red-500">*</span></label>
            <div class="relative">
              <input [(ngModel)]="form.price" type="number" min="0" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none transition pe-14" />
              <span class="absolute inset-y-0 end-4 flex items-center text-xs text-gray-400 font-medium">{{ settingsStore.currency() }}</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.oldPrice') }}</label>
            <div class="relative">
              <input [(ngModel)]="form.oldPrice" type="number" min="0" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none transition pe-14" />
              <span class="absolute inset-y-0 end-4 flex items-center text-xs text-gray-400 font-medium">{{ settingsStore.currency() }}</span>
            </div>
            @if (form.oldPrice && form.price && form.oldPrice > form.price) {
              <p class="text-xs text-green-600 mt-1 font-medium">{{ ((1 - form.price / form.oldPrice) * 100) | number:'1.0-0' }}% {{ i18n.t('items.discount') }}</p>
            }
          </div>
        </div>

        <div class="bg-gray-50 rounded-xl p-4 space-y-3">
          <h3 class="text-sm font-semibold text-gray-700">{{ i18n.t('items.tax') }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.taxEnabled') }}</label>
              <select [(ngModel)]="form.taxStatus" (change)="onTaxChange()" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none bg-white transition">
                <option value="Taxable">{{ i18n.t('items.taxIncluded') }}</option>
                <option value="Exempt">{{ i18n.t('items.taxExcluded') }}</option>
              </select>
            </div>
            @if (form.taxStatus === 'Taxable') {
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.vatAmount') || 'VAT Amount' }}</label>
                <input [(ngModel)]="form.vatAmount" type="number" min="0" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none bg-white transition" placeholder="e.g. 100" />
              </div>
            }
          </div>
        </div>
      </section>

      <!-- 6. INSTALLMENTS — Plan-based selection with full calculations -->
      @if (installmentProviders().length) {
        <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
          <h2 class="font-semibold text-base text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">5</span>
            {{ i18n.t('items.installmentProviders') }}
          </h2>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" [(ngModel)]="form.installmentAvailable" class="w-4 h-4 rounded accent-gray-900" />
            <span class="text-sm font-medium text-gray-700">{{ i18n.t('items.enableInstallments') }}</span>
          </label>
          @if (form.installmentAvailable) {
            <!-- Plan cards with full calculation details -->
            @if (form.price > 0 && getAllInstallmentPlans().length > 0) {
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-semibold text-gray-700">{{ i18n.t('installments.selectPlans') || 'Select Installment Plans' }}</label>
                  <div class="flex gap-2">
                    <button type="button" (click)="selectAllPlans()" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition">{{ i18n.t('common.selectAll') || 'Select All' }}</button>
                    <button type="button" (click)="deselectAllPlans()" class="text-xs text-gray-500 hover:text-gray-700 font-medium transition">{{ i18n.t('common.deselectAll') || 'Clear' }}</button>
                  </div>
                </div>
                <div class="space-y-2">
                  @for (plan of getAllInstallmentPlans(); track plan.planId) {
                    <div (click)="togglePlan(plan.planId)"
                      class="p-3 rounded-xl border cursor-pointer transition-all"
                      [class]="selectedPlanIds.has(plan.planId)
                        ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'">
                      <div class="flex items-center gap-3">
                        <div class="shrink-0">
                          <input type="checkbox" [checked]="selectedPlanIds.has(plan.planId)" class="w-4 h-4 rounded accent-indigo-600" (click)="$event.stopPropagation()" (change)="togglePlan(plan.planId)" />
                        </div>
                        @if (plan.logoUrl) {
                          <img [src]="resolveImg(plan.logoUrl)" [alt]="plan.providerName" class="w-8 h-8 object-contain shrink-0 rounded-lg bg-gray-100 p-1" />
                        }
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-sm font-semibold text-gray-900">{{ plan.months }} {{ i18n.t('installments.monthsLabel') || 'Months' }}</span>
                            <span class="text-xs text-gray-400">·</span>
                            <span class="text-xs text-gray-500">{{ plan.providerName }}</span>
                          </div>
                          <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                            <div class="text-xs text-gray-500">
                              <span class="text-gray-400">{{ i18n.t('installments.downPaymentCol') || 'Down Payment' }}:</span>
                              <span class="font-semibold text-gray-700 ms-1">{{ plan.downPayment | number:'1.0-0' }} {{ settingsStore.currency() }}</span>
                            </div>
                            @if (plan.adminFees > 0) {
                              <div class="text-xs text-gray-500">
                                <span class="text-gray-400">{{ i18n.t('installments.feesCol') || 'Admin Fees' }}:</span>
                                <span class="font-semibold text-gray-700 ms-1">{{ plan.adminFees | number:'1.0-0' }} {{ settingsStore.currency() }}</span>
                              </div>
                            }
                            @if (plan.interest > 0) {
                              <div class="text-xs text-gray-500">
                                <span class="text-gray-400">{{ i18n.t('installments.interestCol') || 'Interest' }}:</span>
                                <span class="font-semibold text-amber-600 ms-1">{{ plan.interest | number:'1.0-0' }} {{ settingsStore.currency() }}</span>
                              </div>
                            }
                          </div>
                        </div>
                        <div class="shrink-0 text-end">
                          <div class="text-lg font-bold text-indigo-600">{{ plan.monthly | number:'1.0-0' }}</div>
                          <div class="text-[10px] text-gray-400 uppercase tracking-wider">{{ settingsStore.currency() }}/{{ i18n.t('installments.monthUnit') || 'mo' }}</div>
                        </div>
                      </div>
                      <!-- Expanded details row -->
                      <div class="mt-2.5 pt-2.5 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-1 text-[11px]">
                        <span class="text-gray-400">{{ i18n.t('items.price') || 'Item Price' }}: <b class="text-gray-600">{{ form.price | number:'1.0-0' }} {{ settingsStore.currency() }}</b></span>
                        <span class="text-gray-400">{{ i18n.t('installments.totalCol') || 'Total Cost' }}: <b class="text-gray-600">{{ plan.total | number:'1.0-0' }} {{ settingsStore.currency() }}</b></span>
                        @if (plan.total > form.price) {
                          <span class="text-amber-500 font-semibold">+{{ plan.total - form.price | number:'1.0-0' }} {{ settingsStore.currency() }} {{ i18n.t('installments.extraCost') || 'extra' }}</span>
                        }
                        @if (plan.total <= form.price) {
                          <span class="text-green-600 font-semibold">{{ i18n.t('installments.noExtra') || '0% Interest' }} ✓</span>
                        }
                      </div>
                    </div>
                  }
                </div>
                <p class="text-[10px] text-gray-400">{{ i18n.t('items.installmentNote') || 'Calculated based on item price. Actual amounts may vary.' }}</p>
              </div>
            } @else if (form.price <= 0) {
              <p class="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">{{ i18n.t('installments.enterPrice') || 'Enter the item price above to see installment plan details.' }}</p>
            }
          }
        </section>
      }

      <!-- 7. DESCRIPTION & WHAT'S IN BOX -->
      <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
        <h2 class="font-semibold text-base text-gray-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">6</span>
          {{ i18n.t('items.descriptionAndSpecs') }}
        </h2>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.description') }}</label>
          <textarea [(ngModel)]="form.description" rows="3" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none resize-none transition" [placeholder]="i18n.t('items.descriptionPlaceholder')"></textarea>
        </div>

        <!-- Structured What's in the Box -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">{{ i18n.t('items.whatsInTheBox') }}</label>
            <div class="flex items-center gap-2">
              @if (boxItems.length === 0) {
                <button type="button" (click)="loadPresetBoxItems()" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition">{{ i18n.t('items.loadPreset') || 'Load Presets' }}</button>
              }
              <button type="button" (click)="addBoxItem()" class="text-xs text-gray-500 hover:text-gray-700 font-medium transition flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                {{ i18n.t('common.add') }}
              </button>
            </div>
          </div>
          <div class="space-y-2">
            @for (boxItem of boxItems; track $index; let i = $index) {
              <div class="flex items-center gap-2">
                <input [(ngModel)]="boxItems[i]" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition" [placeholder]="i18n.t('items.egBoxItem')" />
                <button type="button" (click)="removeBoxItem(i)" class="text-red-400 hover:text-red-600 p-1 transition shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- 8. CUSTOM FIELDS -->
      @if (customFields().length) {
        <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
          <h2 class="font-semibold text-base text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">7</span>
            {{ i18n.t('items.customFields') }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (field of customFields(); track field.id) {
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ field.name }} @if (field.isRequired) { <span class="text-red-500">*</span> }</label>
                @switch (field.fieldType) {
                  @case ('Boolean') {
                    <select [(ngModel)]="customFieldValues[field.id]" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition">
                      <option value="">{{ i18n.t('common.select') }}...</option>
                      <option value="true">{{ i18n.t('common.yes') }}</option>
                      <option value="false">{{ i18n.t('common.no') }}</option>
                    </select>
                  }
                  @case ('Select') {
                    <select [(ngModel)]="customFieldValues[field.id]" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition">
                      <option value="">{{ i18n.t('common.select') }}...</option>
                      @for (opt of field.options; track opt) {
                        <option [value]="opt">{{ opt }}</option>
                      }
                    </select>
                  }
                  @case ('Number') {
                    <input [(ngModel)]="customFieldValues[field.id]" type="number" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition" />
                  }
                  @default {
                    <input [(ngModel)]="customFieldValues[field.id]" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition" />
                  }
                }
              </div>
            }
          </div>
        </section>
      }

      <!-- 9. IMAGES -->
      <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
        <h2 class="font-semibold text-base text-gray-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">8</span>
          {{ i18n.t('items.gallery') }}
        </h2>

        @if (isEdit() && (existingMainImage() || existingGallery().length)) {
          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-gray-600">{{ i18n.t('items.currentImages') }}</h3>
            <div class="flex flex-wrap gap-3">
              @if (existingMainImage()) {
                <div class="relative group">
                  <img [src]="resolveImg(existingMainImage())" alt="Main" class="w-24 h-24 rounded-xl object-cover border-2 border-indigo-400" (error)="existingMainImage.set(null)" />
                  <span class="absolute top-1 start-1 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">MAIN</span>
                  <button (click)="deleteImage(existingMainImage()!, true)" type="button"
                    class="absolute -top-2 -end-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600">&times;</button>
                </div>
              }
              @for (img of existingGallery(); track img.id) {
                <div class="relative group">
                  <img [src]="resolveImg(img.url)" alt="Gallery" class="w-24 h-24 rounded-xl object-cover border border-gray-200" />
                  <button (click)="deleteImage(img.url, false)" type="button"
                    class="absolute -top-2 -end-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600">&times;</button>
                </div>
              }
            </div>
          </div>
        }

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ i18n.t('items.mainImageLabel') }}</label>
            <label class="flex flex-col items-center justify-center h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition">
              @if (mainImagePreview()) {
                <img [src]="mainImagePreview()" alt="Preview" class="w-full h-full object-cover rounded-xl" />
              } @else {
                <svg class="w-7 h-7 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span class="text-xs text-gray-500">{{ i18n.t('items.clickUpload') }}</span>
              }
              <input type="file" (change)="onMainImageChange($event)" accept="image/*" class="hidden" />
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ i18n.t('items.additionalImages') }} <span class="text-xs text-gray-400">(max 5)</span></label>
            <label class="flex flex-col items-center justify-center h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition">
              <svg class="w-7 h-7 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/></svg>
              <span class="text-xs text-gray-500">{{ galleryFiles.length ? galleryFiles.length + ' file(s)' : i18n.t('items.clickUpload') }}</span>
              <input type="file" (change)="onGalleryChange($event)" accept="image/*" multiple class="hidden" />
            </label>
            @if (galleryPreviews().length) {
              <div class="flex flex-wrap gap-2 mt-2">
                @for (prev of galleryPreviews(); track $index) {
                  <div class="relative group">
                    <img [src]="prev" alt="New" class="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                    <button (click)="removeGalleryFile($index)" type="button"
                      class="absolute -top-1 -end-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg">&times;</button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </section>

      <!-- 10. QUALITY CHECKLIST -->
      <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-base text-gray-900">{{ i18n.t('items.qualityChecklist') }}</h2>
            <p class="text-xs text-gray-500 mt-1">{{ i18n.t('items.checklistSubtitle') }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="loadPresetChecklist()" type="button" class="text-xs text-gray-500 hover:text-gray-700 font-medium transition border border-gray-200 px-2.5 py-1 rounded-lg">{{ i18n.t('items.presets') }}</button>
            <button (click)="addChecklistItem()" type="button" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition">+ {{ i18n.t('common.add') }}</button>
          </div>
        </div>
        @if (checklist.length) {
          <div class="space-y-2">
            <div class="flex items-center gap-2 px-2.5 pb-1 text-xs text-gray-400 font-medium">
              <span class="w-4 shrink-0"></span>
              <span class="flex-1">{{ i18n.t('items.checkItemCol') }}</span>
              <span class="flex-1">{{ i18n.t('items.notesOptional') }}</span>
              <span class="w-4 shrink-0"></span>
            </div>
            @for (item of checklist; track $index; let i = $index) {
              <div class="flex items-center gap-2 p-2.5 rounded-xl transition" [class]="item.passed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100'">
                <input type="checkbox" [(ngModel)]="item.passed" class="w-4 h-4 rounded accent-green-600 shrink-0" />
                <input [(ngModel)]="item.label" class="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-white" [placeholder]="i18n.t('items.checkItemName')" />
                <input [(ngModel)]="item.notes" class="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-white" [placeholder]="i18n.t('items.notes')" />
                <button (click)="checklist.splice(i, 1)" type="button" class="text-red-400 hover:text-red-600 transition shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            }
          </div>
        } @else {
          <p class="text-xs text-gray-400 text-center py-2">{{ i18n.t('items.noChecklistItems') }}</p>
        }
      </section>

      } <!-- end loading else -->

      <!-- STICKY SAVE BAR -->
      @if (!loading()) {
        <div class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 z-30">
          <div class="max-w-3xl mx-auto flex items-center gap-3">
            <a [routerLink]="tenantService.adminUrl() + '/items'" class="text-sm text-gray-500 hover:text-gray-900 font-medium transition">{{ i18n.t('common.cancel') }}</a>
            <div class="flex-1"></div>
            <button (click)="save('Hidden')" [disabled]="saving()"
              class="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
              {{ i18n.t('items.saveAsDraft') }}
            </button>
            <button (click)="save('Available')" [disabled]="saving()"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gray-900 hover:bg-black text-white transition disabled:opacity-50">
              @if (saving()) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              }
              {{ saving() ? i18n.t('common.saving') : (isEdit() ? i18n.t('common.update') : i18n.t('common.publish')) }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-in { animation: fadeSlide .2s ease-out; }
    @keyframes fadeSlide { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  `],
})
export class ItemFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  readonly tenantService = inject(TenantService);
  readonly i18n = inject(I18nService);
  readonly settingsStore = inject(SettingsStore);

  // State
  readonly isEdit = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly brands = signal<Brand[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly customFields = signal<CustomFieldDefinition[]>([]);
  readonly installmentProviders = signal<InstallmentProviderRef[]>([]);
  readonly installmentPlans = signal<InstallmentPlanRef[]>([]);
  readonly mainImagePreview = signal<string | null>(null);
  readonly galleryPreviews = signal<string[]>([]);
  readonly existingMainImage = signal<string | null>(null);
  readonly existingGallery = signal<ItemImage[]>([]);

  // Computed — selected category provides capability flags
  readonly selectedCategory = computed(() => this.categories().find(c => c.id === this.form.categoryId) || null);
  readonly resolveImg = resolveImageUrl;

  // UI constants
  readonly storageOptions = STORAGE_OPTIONS;
  readonly ramOptions = RAM_OPTIONS;
  readonly colorOptions = COLOR_OPTIONS;
  readonly conditionOptions = ['New', 'Used', 'Refurbished'];

  // ── Device Type Options (standalone, not category-linked) ──
  readonly deviceTypeOptions = ['Smartphone', 'Tablet', 'Laptop', 'Gaming Console', 'Accessories', 'Smartwatch', 'Headphones', 'Speaker', 'Camera', 'Drone', 'Monitor / TV', 'Other'];

  // Map device type value → i18n key
  private readonly dtKeyMap: Record<string, string> = {
    'Smartphone': 'items.dt.Smartphone', 'Tablet': 'items.dt.Tablet', 'Laptop': 'items.dt.Laptop',
    'Gaming Console': 'items.dt.GamingConsole', 'Accessories': 'items.dt.Accessories', 'Smartwatch': 'items.dt.Smartwatch',
    'Headphones': 'items.dt.Headphones', 'Speaker': 'items.dt.Speaker', 'Camera': 'items.dt.Camera',
    'Drone': 'items.dt.Drone', 'Monitor / TV': 'items.dt.MonitorTV', 'Other': 'items.dt.Other',
  };

  deviceTypeLabel(dt: string): string {
    return this.i18n.t(this.dtKeyMap[dt] || '') || dt;
  }

  // Device types that should NOT show Storage/RAM pickers
  private readonly noStorageRamTypes = new Set(['Accessories', 'Headphones', 'Speaker', 'Drone', 'Monitor / TV']);
  // Device types that should NOT show the RAM picker
  private readonly noRamTypes = new Set(['Camera']);

  // ── Device-Type-Aware Spec Presets ──
  readonly DEVICE_TYPE_PRESETS: Record<string, { label: string; placeholder?: string; options?: string[] }[]> = {
    'Smartphone': [
      { label: 'Display', placeholder: 'e.g. 6.7" Super AMOLED, 120Hz', options: ['6.1" OLED', '6.5" AMOLED', '6.7" Super AMOLED 120Hz', '6.7" LTPO OLED 120Hz', '6.9" Dynamic AMOLED', '5.4" Super Retina', '6.1" Super Retina XDR'] },
      { label: 'Processor', placeholder: 'e.g. Snapdragon 8 Gen 3', options: ['Apple A18 Pro', 'Apple A18', 'Apple A17 Pro', 'Apple A16 Bionic', 'Apple A15 Bionic', 'Snapdragon 8 Gen 3', 'Snapdragon 8 Gen 2', 'Snapdragon 8+ Gen 1', 'Snapdragon 7+ Gen 2', 'Snapdragon 6 Gen 1', 'MediaTek Dimensity 9300', 'MediaTek Dimensity 9200', 'MediaTek Dimensity 8300', 'MediaTek Dimensity 7200', 'Samsung Exynos 2400', 'Google Tensor G3', 'Kirin 9010'] },
      { label: 'OS', placeholder: 'e.g. iOS 18', options: ['iOS 18', 'iOS 17', 'iOS 16', 'Android 15', 'Android 14', 'Android 13', 'Android 12', 'HarmonyOS 4', 'HarmonyOS 3', 'MIUI 15', 'One UI 6', 'ColorOS 14', 'OxygenOS 14'] },
      { label: 'Rear Camera', placeholder: 'e.g. 200MP + 12MP + 50MP', options: ['200MP + 12MP + 50MP', '108MP + 12MP + 10MP', '50MP + 12MP + 10MP', '48MP + 12MP + 12MP', '48MP + 12MP', '50MP + 50MP + 12MP', '12MP + 12MP + 12MP', '64MP + 12MP + 5MP', '108MP + 8MP + 2MP'] },
      { label: 'Front Camera', placeholder: 'e.g. 12MP TrueDepth', options: ['12MP TrueDepth', '12MP', '10MP', '8MP', '16MP', '32MP', '44MP', '60MP'] },
      { label: 'Battery', placeholder: 'e.g. 5000 mAh', options: ['3000 mAh', '3500 mAh', '4000 mAh', '4500 mAh', '4700 mAh', '5000 mAh', '5200 mAh', '5500 mAh', '6000 mAh'] },
      { label: 'Charging', placeholder: 'e.g. 67W Fast + 15W Wireless', options: ['20W', '25W Fast', '33W Fast', '45W Super Fast', '65W Fast', '67W Turbo', '80W SuperVOOC', '100W HyperCharge', '120W UltraFast', '15W Wireless', '25W + 15W Wireless', '45W + 15W Wireless', '67W + 50W Wireless'] },
      { label: 'SIM', placeholder: 'e.g. Dual Nano SIM', options: ['Single Nano SIM', 'Dual Nano SIM', 'Nano SIM + eSIM', 'Dual eSIM', 'Dual SIM + eSIM', 'eSIM Only'] },
      { label: 'Network', placeholder: 'e.g. 5G', options: ['5G (Sub-6)', '5G (Sub-6 + mmWave)', '4G LTE', '4G LTE-A', '3G Only'] },
      { label: 'Connectivity', placeholder: 'e.g. WiFi 6E, BT 5.3, NFC', options: ['WiFi 7 + BT 5.4 + NFC', 'WiFi 6E + BT 5.3 + NFC', 'WiFi 6 + BT 5.2 + NFC', 'WiFi 6 + BT 5.0 + NFC', 'WiFi 5 + BT 5.0', 'WiFi 5 + BT 5.0 + NFC'] },
      { label: 'Water Resistance', placeholder: 'e.g. IP68', options: ['IP68', 'IP67', 'IP65', 'IP54', 'Not Rated'] },
      { label: 'Biometrics', placeholder: 'e.g. Face ID + Fingerprint', options: ['Face ID', 'Under-Display Fingerprint', 'Side Fingerprint', 'Face ID + Under-Display FP', 'Rear Fingerprint', 'Face Unlock + Side FP'] },
      { label: 'Screen Protection', placeholder: 'e.g. Gorilla Glass Victus 2', options: ['Gorilla Glass Victus 2', 'Gorilla Glass Victus+', 'Gorilla Glass Victus', 'Gorilla Glass 5', 'Ceramic Shield', 'Dragon Trail Glass'] },
    ],
    'Tablet': [
      { label: 'Type', options: ['iPad', 'iPad Air', 'iPad Pro', 'iPad Mini', 'Android Tablet', 'Windows Tablet', 'Amazon Fire', 'Samsung Galaxy Tab', 'Huawei MatePad'] },
      { label: 'Display', placeholder: 'e.g. 11" Liquid Retina', options: ['11" Liquid Retina 120Hz', '12.9" Liquid Retina XDR', '10.9" Liquid Retina', '10.2" Retina', '8.3" Liquid Retina', '11" AMOLED 120Hz', '12.4" Super AMOLED', '10.1" IPS LCD', '10.4" TFT LCD'] },
      { label: 'Processor', placeholder: 'e.g. Apple M2', options: ['Apple M4', 'Apple M2', 'Apple M1', 'Apple A15 Bionic', 'Apple A14 Bionic', 'Snapdragon 8 Gen 2', 'Snapdragon 870', 'MediaTek Dimensity 9000', 'MediaTek Helio G99', 'Samsung Exynos 1380'] },
      { label: 'OS', options: ['iPadOS 18', 'iPadOS 17', 'Android 14', 'Android 13', 'Windows 11', 'Fire OS 8'] },
      { label: 'Camera', placeholder: 'e.g. 12MP Wide', options: ['12MP Wide', '12MP Wide + 10MP Ultra Wide', '13MP', '8MP', '5MP'] },
      { label: 'Battery', placeholder: 'e.g. 8600 mAh', options: ['4500 mAh', '6400 mAh', '7538 mAh', '8600 mAh', '10090 mAh', '11200 mAh'] },
      { label: 'Connectivity', placeholder: 'e.g. WiFi + Cellular', options: ['WiFi Only', 'WiFi + Cellular (4G)', 'WiFi + Cellular (5G)'] },
      { label: 'SIM', options: ['No SIM', 'Nano SIM', 'eSIM', 'Nano SIM + eSIM'] },
      { label: 'Accessories', placeholder: 'e.g. Apple Pencil 2 support', options: ['Apple Pencil 2', 'Apple Pencil USB-C', 'S Pen Included', 'S Pen Support', 'Keyboard Support', 'Magic Keyboard', 'Smart Keyboard Folio'] },
    ],
    'Laptop': [
      { label: 'Processor', placeholder: 'e.g. Intel Core i7-13700H', options: ['Intel Core i3-1315U', 'Intel Core i5-1335U', 'Intel Core i5-1340P', 'Intel Core i5-13500H', 'Intel Core i7-1365U', 'Intel Core i7-13700H', 'Intel Core i7-13700HX', 'Intel Core i9-13900H', 'Intel Core i9-13980HX', 'Intel Core Ultra 5 125H', 'Intel Core Ultra 7 155H', 'Intel Core Ultra 9 185H', 'AMD Ryzen 3 7330U', 'AMD Ryzen 5 7530U', 'AMD Ryzen 5 7535HS', 'AMD Ryzen 7 7730U', 'AMD Ryzen 7 7840HS', 'AMD Ryzen 9 7940HS', 'AMD Ryzen 9 7945HX', 'Apple M1', 'Apple M2', 'Apple M3', 'Apple M3 Pro', 'Apple M3 Max', 'Apple M4', 'Apple M4 Pro', 'Apple M4 Max'] },
      { label: 'Display', placeholder: 'e.g. 15.6" FHD IPS 144Hz', options: ['13.3" FHD IPS', '14" FHD IPS', '14" 2.8K OLED 120Hz', '15.6" FHD IPS 60Hz', '15.6" FHD IPS 144Hz', '15.6" QHD IPS 165Hz', '16" QHD+ IPS 165Hz', '16" Liquid Retina XDR', '17.3" FHD IPS'] },
      { label: 'GPU', placeholder: 'e.g. NVIDIA RTX 4060', options: ['Integrated Intel UHD', 'Integrated Intel Iris Xe', 'Integrated AMD Radeon', 'Integrated Apple GPU', 'NVIDIA GTX 1650', 'NVIDIA RTX 2050', 'NVIDIA RTX 3050', 'NVIDIA RTX 3060', 'NVIDIA RTX 4050', 'NVIDIA RTX 4060', 'NVIDIA RTX 4070', 'NVIDIA RTX 4080', 'NVIDIA RTX 4090', 'AMD Radeon RX 7600S', 'AMD Radeon RX 7700S'] },
      { label: 'OS', options: ['Windows 11 Home', 'Windows 11 Pro', 'Windows 10 Pro', 'macOS Sonoma', 'macOS Ventura', 'ChromeOS', 'Linux (Ubuntu)', 'FreeDOS (No OS)'] },
      { label: 'Battery', placeholder: 'e.g. 72Wh, ~10h', options: ['42Wh (~5h)', '54Wh (~7h)', '56Wh (~8h)', '72Wh (~10h)', '86Wh (~12h)', '100Wh (~14h)'] },
      { label: 'Weight', placeholder: 'e.g. 1.7 kg', options: ['1.0 kg', '1.2 kg', '1.4 kg', '1.6 kg', '1.7 kg', '1.8 kg', '2.0 kg', '2.3 kg', '2.5 kg', '3.0 kg'] },
      { label: 'Keyboard', placeholder: 'e.g. Backlit, Arabic+English', options: ['Standard', 'Backlit', 'Backlit RGB', 'Per-Key RGB', 'Arabic + English', 'Arabic + English Backlit'] },
      { label: 'Ports', placeholder: 'e.g. 2x USB-C, 1x USB-A, HDMI', options: ['USB-C x2, USB-A x1, HDMI', 'Thunderbolt 4 x2, USB-A x1, HDMI, SD', 'USB-C x1, USB-A x2, HDMI', 'MagSafe, Thunderbolt x3, HDMI, SD', 'USB-C x2 only'] },
    ],
    'Gaming Console': [
      { label: 'Platform', options: ['PlayStation 4', 'PlayStation 4 Slim', 'PlayStation 4 Pro', 'PlayStation 5', 'PlayStation 5 Slim', 'PlayStation 5 Pro', 'PlayStation 5 Digital', 'Xbox Series S', 'Xbox Series X', 'Xbox One S', 'Xbox One X', 'Nintendo Switch', 'Nintendo Switch OLED', 'Nintendo Switch Lite', 'Steam Deck', 'Steam Deck OLED', 'ROG Ally', 'ROG Ally X'] },
      { label: 'Edition', placeholder: 'e.g. Standard, Limited Edition', options: ['Standard', 'Digital Edition', 'Limited Edition', 'Bundle', 'God of War Edition', 'Spider-Man Edition', 'Hogwarts Legacy Edition', 'FIFA Bundle', 'Fortnite Bundle'] },
      { label: 'Controller', options: ['1 Controller', '2 Controllers', 'No Controller', 'Pro Controller'] },
      { label: 'Connectivity', options: ['WiFi + Bluetooth', 'WiFi + Bluetooth + Ethernet', 'WiFi Only'] },
      { label: 'Included Games', placeholder: 'e.g. 2 games included' },
      { label: 'Accessories', placeholder: 'e.g. Extra controller, headset', options: ['None', 'Extra Controller', 'Headset', 'Charging Dock', 'Media Remote', 'Camera/Sensor'] },
      { label: 'Firmware', placeholder: 'e.g. Latest, Jailbroken', options: ['Latest Firmware', 'Older Firmware', 'Jailbroken / Modded'] },
    ],
    'Accessories': [
      { label: 'Type', options: ['Charger', 'Fast Charger', 'Wireless Charger', 'Screen Protector', 'Tempered Glass', 'Case / Cover', 'Clear Case', 'Wallet Case', 'USB-C Cable', 'Lightning Cable', 'Power Bank', 'Adapter', 'Stylus / Pen', 'Memory Card', 'Keyboard', 'Mouse', 'Stand / Mount', 'Car Mount', 'Ring Holder', 'Camera Lens', 'Selfie Stick', 'Tripod'] },
      { label: 'Compatible With', options: ['iPhone 15 Series', 'iPhone 14 Series', 'iPhone 13 Series', 'Samsung Galaxy S24', 'Samsung Galaxy S23', 'Samsung Galaxy A Series', 'Huawei', 'Xiaomi', 'iPad', 'Android Tablet', 'MacBook', 'Laptop (Universal)', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Universal'] },
      { label: 'Brand', placeholder: 'e.g. Anker, Baseus, Original', options: ['Original (OEM)', 'Anker', 'Baseus', 'Ugreen', 'Aukey', 'Belkin', 'Samsung Original', 'Apple Original', 'Generic'] },
      { label: 'Material', options: ['Plastic', 'Silicone', 'TPU', 'Leather', 'Faux Leather', 'Metal / Aluminum', 'Glass', 'Tempered Glass', 'Carbon Fiber', 'Fabric / Nylon', 'Wood'] },
      { label: 'Warranty', placeholder: 'e.g. 6 months', options: ['None', '3 Months', '6 Months', '1 Year', '2 Years', 'Lifetime'] },
    ],
    'Smartwatch': [
      { label: 'Type', options: ['Apple Watch Ultra 2', 'Apple Watch Series 9', 'Apple Watch SE', 'Samsung Galaxy Watch 6', 'Samsung Galaxy Watch 6 Classic', 'Samsung Galaxy Watch Ultra', 'Huawei Watch GT 4', 'Huawei Watch Fit 3', 'Garmin Venu 3', 'Garmin Forerunner 965', 'Garmin Fenix 8', 'Fitbit Sense 2', 'Fitbit Versa 4', 'Xiaomi Watch S3', 'Xiaomi Smart Band 8', 'Google Pixel Watch 2'] },
      { label: 'Display', placeholder: 'e.g. 1.9" AMOLED Always-On', options: ['1.9" AMOLED Always-On', '1.5" AMOLED', '1.4" AMOLED', '1.3" AMOLED', '1.2" AMOLED', '1.47" AMOLED'] },
      { label: 'Size', placeholder: 'e.g. 45mm', options: ['40mm', '41mm', '42mm', '44mm', '45mm', '46mm', '47mm', '49mm'] },
      { label: 'OS', options: ['watchOS 10', 'watchOS 11', 'Wear OS 4', 'Wear OS 5', 'Tizen', 'Garmin OS', 'Fitbit OS', 'Proprietary'] },
      { label: 'Battery', placeholder: 'e.g. Up to 36 hours', options: ['Up to 18 hours', 'Up to 24 hours', 'Up to 36 hours', 'Up to 48 hours', 'Up to 7 days', 'Up to 14 days', 'Up to 25 days'] },
      { label: 'Connectivity', placeholder: 'e.g. BT + WiFi + LTE', options: ['Bluetooth Only', 'Bluetooth + WiFi', 'Bluetooth + WiFi + LTE', 'Bluetooth + WiFi + GPS', 'Bluetooth + WiFi + GPS + LTE'] },
      { label: 'Water Resistance', options: ['IP67', 'IP68', '5ATM', '10ATM', 'WR50', 'WR100', 'Not Rated'] },
      { label: 'Sensors', placeholder: 'e.g. Heart Rate, SpO2, ECG', options: ['Heart Rate', 'Heart Rate + SpO2', 'Heart Rate + SpO2 + ECG', 'Heart Rate + SpO2 + ECG + Temperature', 'Heart Rate + SpO2 + ECG + BP'] },
      { label: 'Band', placeholder: 'e.g. Sport Band, Milanese Loop', options: ['Sport Band', 'Sport Loop', 'Milanese Loop', 'Leather', 'Stainless Steel', 'Titanium', 'Silicone', 'Fabric / Nylon'] },
    ],
    'Headphones': [
      { label: 'Type', options: ['Over-Ear', 'On-Ear', 'In-Ear (Wired)', 'True Wireless (TWS)', 'Neckband', 'Bone Conduction', 'Open-Ear'] },
      { label: 'Brand', placeholder: 'e.g. Sony, Apple, Samsung', options: ['Apple AirPods', 'Apple AirPods Pro', 'Apple AirPods Max', 'Sony WH-1000XM5', 'Sony WF-1000XM5', 'Samsung Galaxy Buds', 'Samsung Galaxy Buds Pro', 'Bose QuietComfort', 'Bose 700', 'JBL Tune', 'JBL Live', 'Beats Solo', 'Beats Studio', 'Beats Fit Pro', 'Sennheiser Momentum', 'Nothing Ear', 'Anker Soundcore'] },
      { label: 'Noise Cancellation', options: ['Active Noise Cancellation (ANC)', 'Adaptive ANC', 'Passive Noise Isolation', 'Transparency Mode', 'ANC + Transparency', 'None'] },
      { label: 'Connectivity', options: ['Bluetooth 5.0', 'Bluetooth 5.2', 'Bluetooth 5.3', 'Bluetooth 5.4', 'Wired (3.5mm)', 'Wired (USB-C)', 'Bluetooth + Wired'] },
      { label: 'Battery Life', placeholder: 'e.g. 30h (with case)', options: ['4h', '6h', '8h', '10h', '20h', '24h', '30h', '36h', '40h', '50h', '60h'] },
      { label: 'Driver Size', placeholder: 'e.g. 11mm', options: ['6mm', '8mm', '10mm', '11mm', '12mm', '30mm', '40mm', '50mm'] },
      { label: 'Water Resistance', options: ['IPX4 (Sweat)', 'IPX5', 'IP54', 'IP55', 'IP67', 'IP68', 'Not Rated'] },
      { label: 'Features', placeholder: 'e.g. Spatial Audio, LDAC', options: ['Spatial Audio', 'Hi-Res Audio (LDAC)', 'Multipoint Connection', 'Wireless Charging Case', 'Touch Controls', 'Voice Assistant', 'Head Tracking'] },
    ],
    'Speaker': [
      { label: 'Type', options: ['Portable Bluetooth', 'Smart Speaker', 'Soundbar', 'Home Theater', 'Desktop / PC', 'Party Speaker', 'Outdoor / Rugged'] },
      { label: 'Brand', placeholder: 'e.g. JBL, Bose, Sonos', options: ['JBL', 'Bose', 'Sonos', 'Marshall', 'Harman Kardon', 'Sony', 'Apple HomePod', 'Amazon Echo', 'Google Nest', 'Bang & Olufsen', 'Ultimate Ears'] },
      { label: 'Connectivity', options: ['Bluetooth 5.0', 'Bluetooth 5.3', 'WiFi + Bluetooth', 'WiFi + AirPlay', 'Wired (3.5mm / RCA)', 'USB + Bluetooth'] },
      { label: 'Battery Life', placeholder: 'e.g. 12h', options: ['No Battery (Wired)', '5h', '8h', '10h', '12h', '15h', '20h', '24h', '30h'] },
      { label: 'Water Resistance', options: ['IPX5', 'IPX7', 'IP67', 'Not Rated'] },
      { label: 'Power Output', placeholder: 'e.g. 30W', options: ['5W', '10W', '20W', '30W', '40W', '50W', '100W', '200W', '500W'] },
      { label: 'Voice Assistant', options: ['None', 'Google Assistant', 'Alexa', 'Siri', 'Google + Alexa'] },
    ],
    'Camera': [
      { label: 'Type', options: ['DSLR', 'Mirrorless', 'Compact / Point & Shoot', 'Action Camera', 'Instant Camera', 'Film Camera', 'Medium Format'] },
      { label: 'Brand', placeholder: 'e.g. Canon, Sony, Nikon', options: ['Canon', 'Sony', 'Nikon', 'Fujifilm', 'Panasonic Lumix', 'Olympus', 'Leica', 'GoPro', 'DJI', 'Insta360', 'Polaroid'] },
      { label: 'Sensor', placeholder: 'e.g. Full Frame 24.2MP', options: ['Full Frame', 'APS-C', 'Micro Four Thirds', '1-inch', '1/2.3-inch', 'Medium Format'] },
      { label: 'Resolution', placeholder: 'e.g. 45 MP', options: ['12 MP', '20 MP', '24 MP', '26 MP', '33 MP', '45 MP', '50 MP', '61 MP', '100 MP'] },
      { label: 'Video', placeholder: 'e.g. 4K 60fps', options: ['Full HD 1080p 30fps', 'Full HD 1080p 60fps', '4K 30fps', '4K 60fps', '4K 120fps', '5.3K 60fps', '6K 30fps', '8K 30fps'] },
      { label: 'Lens Mount', placeholder: 'e.g. Canon RF', options: ['Canon EF', 'Canon RF', 'Nikon F', 'Nikon Z', 'Sony E', 'Sony A', 'Fujifilm X', 'Micro Four Thirds (MFT)', 'Leica L', 'Fixed Lens'] },
      { label: 'Viewfinder', options: ['Optical (OVF)', 'Electronic (EVF)', 'LCD Only', 'None'] },
      { label: 'Lens Included', placeholder: 'e.g. 18-55mm kit lens', options: ['Body Only', '18-55mm Kit', '24-70mm Kit', '28-70mm Kit', '16-50mm Kit'] },
    ],
    'Drone': [
      { label: 'Type', options: ['Camera Drone', 'FPV Racing Drone', 'Mini / Compact', 'Professional / Cinema', 'Toy / Beginner'] },
      { label: 'Brand', placeholder: 'e.g. DJI, Autel', options: ['DJI Mini', 'DJI Air', 'DJI Mavic', 'DJI Avata', 'DJI Inspire', 'Autel EVO', 'Autel Lite', 'Parrot Anafi', 'Skydio', 'FIMI'] },
      { label: 'Camera', placeholder: 'e.g. 4K 60fps, 1-inch sensor', options: ['No Camera', '1080p', '2.7K', '4K 30fps', '4K 60fps', '5.1K', '5.4K', 'Hasselblad 4K'] },
      { label: 'Flight Time', placeholder: 'e.g. 34 min', options: ['10 min', '15 min', '20 min', '25 min', '30 min', '34 min', '38 min', '46 min'] },
      { label: 'Range', placeholder: 'e.g. 12 km', options: ['100m', '500m', '2 km', '5 km', '8 km', '10 km', '12 km', '15 km', '20 km'] },
      { label: 'Weight', placeholder: 'e.g. 249g (under 250g)', options: ['Under 250g', '250-500g', '500g-1kg', '1-2 kg', 'Over 2 kg'] },
      { label: 'Obstacle Avoidance', options: ['None', 'Forward Only', 'Forward + Backward', 'Omnidirectional', 'APAS 5.0'] },
      { label: 'Features', placeholder: 'e.g. Follow Me, Waypoints', options: ['Follow Me', 'ActiveTrack', 'Waypoints', 'Hyperlapse', 'QuickShots', 'MasterShots', 'Panorama', 'Return to Home'] },
    ],
    'Monitor / TV': [
      { label: 'Type', options: ['Monitor', 'Gaming Monitor', 'Ultrawide Monitor', 'Smart TV', 'OLED TV', 'QLED TV', 'LED TV', 'Portable Monitor'] },
      { label: 'Screen Size', placeholder: 'e.g. 27"', options: ['15.6"', '24"', '27"', '32"', '34" Ultrawide', '43"', '49" Super Ultrawide', '50"', '55"', '65"', '75"', '85"'] },
      { label: 'Resolution', options: ['Full HD (1080p)', 'QHD (1440p)', '4K UHD (2160p)', '5K', '8K', 'UWQHD (3440x1440)'] },
      { label: 'Panel', options: ['IPS', 'VA', 'TN', 'OLED', 'Mini-LED', 'QLED', 'Nano IPS'] },
      { label: 'Refresh Rate', options: ['60Hz', '75Hz', '100Hz', '120Hz', '144Hz', '165Hz', '180Hz', '240Hz', '360Hz'] },
      { label: 'Brand', placeholder: 'e.g. Samsung, LG, Dell', options: ['Samsung', 'LG', 'Dell', 'ASUS', 'BenQ', 'Acer', 'AOC', 'MSI', 'Gigabyte', 'Sony', 'TCL', 'Hisense', 'Xiaomi'] },
      { label: 'Connectivity', placeholder: 'e.g. HDMI 2.1, DP 1.4, USB-C', options: ['HDMI 2.0 x2', 'HDMI 2.1 x2', 'HDMI 2.1 + DisplayPort 1.4', 'HDMI 2.1 + DP 1.4 + USB-C', 'HDMI x3 (Smart TV)', 'HDMI x4 (Smart TV)'] },
      { label: 'Smart Features', options: ['None', 'Tizen OS', 'webOS', 'Google TV', 'Android TV', 'Roku TV', 'Fire TV', 'Vidaa'] },
    ],
    'Other': [
      { label: 'Type' }, { label: 'Model' }, { label: 'Material' }, { label: 'Connectivity' }, { label: 'Features' },
    ],
  };

  /** Resolve spec presets based on the selected device type */
  get activeSpecPresets(): { label: string; placeholder?: string; options?: string[] }[] {
    const dt = this.form.deviceType;
    if (!dt) return [];
    return this.DEVICE_TYPE_PRESETS[dt] || [];
  }

  /** Get the list of active preset field labels — conditionally includes Color/Storage/RAM */
  get activePresetLabels(): string[] {
    const dt = this.form.deviceType;
    const base: string[] = ['Color'];
    if (!this.noStorageRamTypes.has(dt)) base.push('Storage');
    if (!this.noStorageRamTypes.has(dt) && !this.noRamTypes.has(dt)) base.push('RAM');
    return [...base, ...this.activeSpecPresets.map(p => p.label)];
  }

  /** Whether the current device type should show the Storage picker */
  get showStoragePicker(): boolean { return !this.noStorageRamTypes.has(this.form.deviceType); }
  /** Whether the current device type should show the RAM picker */
  get showRamPicker(): boolean { return !this.noStorageRamTypes.has(this.form.deviceType) && !this.noRamTypes.has(this.form.deviceType); }
  selectedProviderIds = new Set<string>();
  selectedPlanIds = new Set<string>();
  checklist: ChecklistEntry[] = [];
  customFieldValues: Record<string, string> = {};
  specsEntries: { label: string; value: string }[] = [];
  boxItems: string[] = [];

  private editId = '';
  private mainImageFile: File | null = null;
  galleryFiles: File[] = [];

  // Form model
  form: {[k: string]: any;
    title: string; slug: string; description: string; price: number; oldPrice: number | null;
    condition: string; isFeatured: boolean;
    brandId: string; categoryId: string;
    quantity: number; lowStockThreshold: number;
    imei: string; serialNumber: string;
    taxStatus: string; vatAmount: number;
    deviceType: string; color: string; storage: string; ram: string;
    batteryHealth: number | null; warrantyType: string; warrantyMonths: number | null;
    installmentAvailable: boolean;
    specs: string; whatsInTheBox: string;
  } = {
    title: '', slug: '', description: '', price: 0, oldPrice: null,
    condition: 'New', isFeatured: false,
    brandId: '', categoryId: '',
    quantity: 1, lowStockThreshold: 2,
    imei: '', serialNumber: '',
    taxStatus: 'Taxable', vatAmount: 0,
    deviceType: '', color: '', storage: '', ram: '',
    batteryHealth: null, warrantyType: '', warrantyMonths: null,
    installmentAvailable: false,
    specs: '', whatsInTheBox: '',
  };

  ngOnInit(): void {
    // Load all reference data first, then load item if editing
    forkJoin({
      brands: this.api.get<Brand[]>('/Brands'),
      categories: this.api.get<Category[]>('/Categories'),
      customFields: this.api.get<CustomFieldDefinition[]>('/CustomFields'),
      providers: this.api.get<InstallmentProviderRef[]>('/Installments/providers'),
      plans: this.api.get<InstallmentPlanRef[]>('/Installments/plans'),
    }).subscribe({
      next: (data) => {
        this.brands.set(data.brands || []);
        this.categories.set(data.categories || []);
        this.customFields.set(data.customFields || []);
        this.installmentProviders.set(data.providers || []);
        this.installmentPlans.set((data.plans || []).filter(p => p.isActive));

        const id = this.route.snapshot.params['id'];
        if (id) {
          this.editId = id;
          this.isEdit.set(true);
          this.loadItem(id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.toastService.error(this.i18n.t('items.loadError'));
        this.loading.set(false);
      },
    });
  }

  private loadItem(id: string): void {
    this.api.get<any>(`/Items/${id}`).subscribe({
      next: item => {
        // Map only the fields we need
        this.form.title = item.title || '';
        this.form.slug = item.slug || '';
        this.form.description = item.description || '';
        this.form.price = item.price || 0;
        this.form.oldPrice = item.oldPrice || null;
        this.form.condition = item.condition || 'New';
        this.form.isFeatured = item.isFeatured || false;
        this.form.brandId = item.brandId || '';
        this.form.categoryId = item.categoryId || '';
        this.form.quantity = item.quantity ?? 1;
        this.form.lowStockThreshold = item.lowStockThreshold ?? 2;
        this.form.imei = item.imei || '';
        this.form.serialNumber = item.serialNumber || '';
        this.form.taxStatus = item.taxStatus || 'Taxable';
        this.form.vatAmount = item.vatAmount ?? 0;
        this.form.deviceType = item.deviceType || '';
        this.form.color = item.color || '';
        this.form.storage = item.storage || '';
        this.form.ram = item.ram || '';
        this.form.batteryHealth = item.batteryHealth ?? null;
        this.form.warrantyType = item.warrantyType || '';
        this.form.warrantyMonths = item.warrantyMonths ?? null;
        this.form.installmentAvailable = item.installmentAvailable || false;
        this.form.specs = item.specs || '';
        this.form.whatsInTheBox = item.whatsInTheBox || '';

        // Parse structured specs (JSON array of {label, value} or legacy "key: value" text)
        if (item.specs) {
          try {
            const parsed = JSON.parse(item.specs);
            if (Array.isArray(parsed)) {
              this.specsEntries = parsed.map((s: any) => ({ label: s.label || '', value: s.value || '' }));
            } else {
              this.specsEntries = this.parseTextSpecs(item.specs);
            }
          } catch {
            this.specsEntries = this.parseTextSpecs(item.specs);
          }
        }

        // Make sure Color/Storage/RAM from device details are reflected in specs entries
        if (item.color) this.syncSpecEntry('Color', item.color);
        if (item.storage) this.syncSpecEntry('Storage', item.storage);
        if (item.ram) this.syncSpecEntry('RAM', item.ram);

        // Parse structured what's in the box (JSON array of strings or comma-separated text)
        if (item.whatsInTheBox) {
          try {
            const parsed = JSON.parse(item.whatsInTheBox);
            if (Array.isArray(parsed)) {
              this.boxItems = parsed.filter((s: string) => s.trim());
            } else {
              this.boxItems = item.whatsInTheBox.split(',').map((s: string) => s.trim()).filter((s: string) => s);
            }
          } catch {
            this.boxItems = item.whatsInTheBox.split(',').map((s: string) => s.trim()).filter((s: string) => s);
          }
        }

        if (item.mainImageUrl) this.existingMainImage.set(item.mainImageUrl);
        if (item.galleryImagesJson) {
          try {
            const urls: string[] = JSON.parse(item.galleryImagesJson);
            this.existingGallery.set(urls.map((url, i) => ({ id: String(i), url, sortOrder: i })));
          } catch {}
        }
        if (item.customFieldsJson) {
          try {
            const fields: { fieldId: string; value: string }[] = JSON.parse(item.customFieldsJson);
            for (const cf of fields) this.customFieldValues[cf.fieldId] = cf.value;
          } catch {}
        }
        if (item.checklistJson) {
          try { this.checklist = JSON.parse(item.checklistJson); } catch {}
        }

        this.loading.set(false);
      },
      error: () => {
        this.toastService.error(this.i18n.t('items.loadError'));
        this.loading.set(false);
      },
    });
  }

  // Helpers

  onTaxChange(): void {
    if (this.form.taxStatus === 'Exempt') this.form.vatAmount = 0;
  }

  autoSlug(): void {
    if (!this.isEdit()) {
      this.form.slug = this.form.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
  }

  toggleProvider(id: string): void {
    if (this.selectedProviderIds.has(id)) this.selectedProviderIds.delete(id);
    else this.selectedProviderIds.add(id);
  }

  getInstallmentPreview(): { planId: string; providerName: string; months: number; downPayment: number; monthly: number; total: number }[] {
    const price = this.form.price;
    if (!price || price <= 0) return [];

    const rows: { planId: string; providerName: string; months: number; downPayment: number; monthly: number; total: number }[] = [];
    const providers = this.installmentProviders();

    for (const plan of this.installmentPlans()) {
      if (!this.selectedProviderIds.has(plan.providerId)) continue;
      const provider = providers.find(p => p.id === plan.providerId);
      if (!provider) continue;

      const dp = plan.downPaymentPercent ? (price * plan.downPaymentPercent / 100) : plan.downPayment;
      const fees = plan.adminFeesPercent ? (price * plan.adminFeesPercent / 100) : plan.adminFees;
      const interest = plan.interestRate ? (price * plan.interestRate / 100) : 0;
      const remaining = price - dp + fees + interest;
      const monthly = remaining / plan.months;
      const total = dp + remaining;

      rows.push({ planId: plan.id, providerName: provider.name, months: plan.months, downPayment: Math.round(dp), monthly: Math.round(monthly), total: Math.round(total) });
    }

    return rows.sort((a, b) => a.months - b.months);
  }

  /** Get all available plans with full calculations (plan-based, not provider-based) */
  getAllInstallmentPlans(): { planId: string; providerName: string; logoUrl: string | null; months: number; downPayment: number; adminFees: number; interest: number; monthly: number; total: number }[] {
    const price = this.form.price;
    if (!price || price <= 0) return [];

    const providers = this.installmentProviders();
    const rows: { planId: string; providerName: string; logoUrl: string | null; months: number; downPayment: number; adminFees: number; interest: number; monthly: number; total: number }[] = [];

    for (const plan of this.installmentPlans()) {
      const provider = providers.find(p => p.id === plan.providerId);
      if (!provider) continue;

      const dp = plan.downPaymentPercent ? (price * plan.downPaymentPercent / 100) : plan.downPayment;
      const fees = plan.adminFeesPercent ? (price * plan.adminFeesPercent / 100) : plan.adminFees;
      const interest = plan.interestRate ? (price * plan.interestRate / 100) : 0;
      const remaining = price - dp + fees + interest;
      const monthly = remaining / plan.months;
      const total = dp + remaining;

      rows.push({
        planId: plan.id, providerName: provider.name, logoUrl: provider.logoUrl,
        months: plan.months, downPayment: Math.round(dp), adminFees: Math.round(fees),
        interest: Math.round(interest), monthly: Math.round(monthly), total: Math.round(total),
      });
    }

    return rows.sort((a, b) => a.months - b.months || a.total - b.total);
  }

  togglePlan(planId: string): void {
    if (this.selectedPlanIds.has(planId)) this.selectedPlanIds.delete(planId);
    else this.selectedPlanIds.add(planId);
    // Keep selectedProviderIds in sync for backward compatibility
    this.syncProviderIdsFromPlans();
  }

  selectAllPlans(): void {
    for (const plan of this.getAllInstallmentPlans()) this.selectedPlanIds.add(plan.planId);
    this.syncProviderIdsFromPlans();
  }

  deselectAllPlans(): void {
    this.selectedPlanIds.clear();
    this.selectedProviderIds.clear();
  }

  private syncProviderIdsFromPlans(): void {
    this.selectedProviderIds.clear();
    for (const plan of this.installmentPlans()) {
      if (this.selectedPlanIds.has(plan.id)) this.selectedProviderIds.add(plan.providerId);
    }
  }

  addSpecEntry(): void { this.specsEntries.push({ label: '', value: '' }); }
  removeSpecEntry(idx: number): void { this.specsEntries.splice(idx, 1); }

  getSpecValue(label: string): string {
    return this.specsEntries.find(s => s.label.toLowerCase() === label.toLowerCase())?.value ?? '';
  }

  setSpecValue(label: string, value: string): void {
    this.syncSpecEntry(label, value);
  }

  isPresetSpec(label: string): boolean {
    return this.activePresetLabels.some(f => f.toLowerCase() === label.trim().toLowerCase());
  }

  hasCustomSpecs(): boolean {
    return this.specsEntries.some(s => !this.isPresetSpec(s.label));
  }

  syncSpecEntry(label: string, value: string): void {
    const existing = this.specsEntries.find(s => s.label.trim().toLowerCase() === label.toLowerCase());
    if (value) {
      if (existing) {
        existing.value = value;
      } else {
        // Insert near the top
        this.specsEntries.unshift({ label, value });
      }
    } else if (existing) {
      // Clear value but keep the row so user can fill it manually
      existing.value = '';
    }
  }

  selectColor(name: string): void {
    this.form.color = this.form.color === name ? '' : name;
    this.syncSpecEntry('Color', this.form.color);
  }

  selectStorage(s: string): void {
    this.form.storage = this.form.storage === s ? '' : s;
    this.syncSpecEntry('Storage', this.form.storage);
  }

  selectRam(r: string): void {
    this.form.ram = this.form.ram === r ? '' : r;
    this.syncSpecEntry('RAM', this.form.ram);
  }
  loadPresetSpecs(): void {
    // Sync device-detail fields into spec entries
    if (this.form.color) this.syncSpecEntry('Color', this.form.color);
    if (this.form.storage) this.syncSpecEntry('Storage', this.form.storage);
    if (this.form.ram) this.syncSpecEntry('RAM', this.form.ram);
    // Ensure all active preset fields have entries
    for (const field of this.activePresetLabels) {
      if (!this.specsEntries.some(s => s.label.toLowerCase() === field.toLowerCase())) {
        this.specsEntries.push({ label: field, value: '' });
      }
    }
  }

  /** Called when device type dropdown changes */
  onDeviceTypeChange(): void {
    // Auto-load preset specs for the new device type
    if (this.form.deviceType) {
      this.loadPresetSpecs();
    }
  }

  /** Save a custom spec field label to the database for future reuse */
  saveCustomSpecField(label: string): void {
    if (!label?.trim() || this.isPresetSpec(label)) return;
    this.api.post('/SpecFields', {
      label: label.trim(),
      deviceType: this.form.deviceType || null,
    }).subscribe({ error: () => {} }); // silent save — best effort
  }

  loadPresetBoxItems(): void {
    const cat = this.selectedCategory();
    const slug = (cat?.slug || '').toLowerCase();
    if (slug.includes('laptop')) {
      this.boxItems = ['1x Laptop', '1x Power Adapter', '1x Documentation'];
    } else if (slug.includes('tablet') || slug.includes('ipad')) {
      this.boxItems = ['1x Tablet', '1x USB-C Cable', '1x Power Adapter', '1x Documentation'];
    } else if (slug.includes('playstation') || slug.includes('gaming') || slug.includes('xbox')) {
      this.boxItems = ['1x Console', '1x Controller', '1x HDMI Cable', '1x Power Cable', '1x Documentation'];
    } else if (slug.includes('accessor')) {
      this.boxItems = ['1x Item', '1x Packaging'];
    } else {
      this.boxItems = ['1x Phone', '1x USB-C Cable', '1x Power Adapter', '1x Documentation'];
    }
  }

  addBoxItem(): void { this.boxItems.push(''); }
  removeBoxItem(idx: number): void { this.boxItems.splice(idx, 1); }

  private parseTextSpecs(text: string): { label: string; value: string }[] {
    return text.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          return { label: line.substring(0, colonIdx).trim(), value: line.substring(colonIdx + 1).trim() };
        }
        return { label: line.trim(), value: '' };
      });
  }

  private serializeSpecs(): string | undefined {
    const filtered = this.specsEntries.filter(s => s.label.trim());
    return filtered.length ? JSON.stringify(filtered) : undefined;
  }

  private serializeBoxItems(): string | undefined {
    const filtered = this.boxItems.filter(s => s.trim());
    return filtered.length ? JSON.stringify(filtered) : undefined;
  }

  addChecklistItem(): void {
    this.checklist.push({ key: '', label: '', passed: false, notes: '' });
  }

  loadPresetChecklist(): void {
    if (this.checklist.length && !confirm('Replace existing checklist with presets?')) return;
    this.checklist = [
      { key: 'screen', label: 'Screen / Display', passed: false, notes: '' },
      { key: 'touch', label: 'Touch Responsiveness', passed: false, notes: '' },
      { key: 'buttons', label: 'Buttons & Switches', passed: false, notes: '' },
      { key: 'charging', label: 'Charging Port & Cable', passed: false, notes: '' },
      { key: 'speakers', label: 'Speakers & Microphone', passed: false, notes: '' },
      { key: 'camera', label: 'Front & Rear Camera', passed: false, notes: '' },
      { key: 'wifi', label: 'Wi-Fi & Bluetooth', passed: false, notes: '' },
      { key: 'sim', label: 'SIM Card & Network', passed: false, notes: '' },
      { key: 'body', label: 'Body / Frame Condition', passed: false, notes: '' },
      { key: 'faceid', label: 'Face ID / Fingerprint', passed: false, notes: '' },
    ];
  }

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  onMainImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > this.MAX_FILE_SIZE) {
        this.toastService.error('Image must be under 5MB');
        return;
      }
      this.mainImageFile = file;
      const reader = new FileReader();
      reader.onload = () => this.mainImagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onGalleryChange(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      const validFiles = Array.from(files).filter(f => {
        if (f.size > this.MAX_FILE_SIZE) {
          this.toastService.error(`${f.name} exceeds 5MB limit`);
          return false;
        }
        return true;
      });
      this.galleryFiles = validFiles.slice(0, 5);
      const previews: string[] = [];
      for (const f of this.galleryFiles) {
        const reader = new FileReader();
        reader.onload = () => {
          previews.push(reader.result as string);
          if (previews.length === this.galleryFiles.length) this.galleryPreviews.set([...previews]);
        };
        reader.readAsDataURL(f);
      }
      if (!this.galleryFiles.length) this.galleryPreviews.set([]);
    }
  }

  removeGalleryFile(idx: number): void {
    this.galleryFiles.splice(idx, 1);
    const p = [...this.galleryPreviews()];
    p.splice(idx, 1);
    this.galleryPreviews.set(p);
  }

  deleteImage(imageUrl: string, isMain: boolean): void {
    if (!confirm(this.i18n.t('items.deleteImageConfirm'))) return;
    const parts = imageUrl.split('/');
    const imageKey = parts[parts.length - 1];
    this.api.delete(`/Items/${this.editId}/images?imageKey=${encodeURIComponent(imageKey)}`).subscribe({
      next: () => {
        if (isMain) this.existingMainImage.set(null);
        else this.existingGallery.set(this.existingGallery().filter(g => g.url !== imageUrl));
        this.toastService.success(this.i18n.t('items.imageDeleted'));
      },
      error: () => this.toastService.error(this.i18n.t('items.imageDeleteFailed')),
    });
  }

  // Save

  save(status: string): void {
    if (!this.form.title?.trim()) {
      this.toastService.error(this.i18n.t('items.validationTitle'));
      return;
    }
    if (!this.form.categoryId) {
      this.toastService.error(this.i18n.t('items.validationCategory') || 'Please select a category');
      return;
    }
    if (!this.form.price || this.form.price <= 0) {
      this.toastService.error(this.i18n.t('items.validationPrice'));
      return;
    }

    this.saving.set(true);

    const cfValues = Object.entries(this.customFieldValues)
      .filter(([, v]) => v)
      .map(([fieldId, value]) => ({ fieldId, value }));

    const clItems = this.checklist.filter(c => c.label.trim());
    clItems.forEach((c, i) => { if (!c.key) c.key = `check-${i}`; });

    // Build clean request body matching the API DTOs
    const body: Record<string, any> = {
      title: this.form.title.trim(),
      slug: this.form.slug?.trim() || undefined,
      description: this.form.description?.trim() || undefined,
      price: this.form.price,
      oldPrice: this.form.oldPrice || undefined,
      condition: this.form.condition || 'New',
      isFeatured: this.form.isFeatured || false,
      brandId: this.form.brandId || undefined,
      categoryId: this.form.categoryId,
      quantity: this.form.quantity ?? 1,
      imei: this.form.imei?.trim() || undefined,
      serialNumber: this.form.serialNumber?.trim() || undefined,
      taxStatus: this.form.taxStatus || 'Taxable',
      vatAmount: Math.max(this.form.vatAmount ?? 0, 0),
      deviceType: this.form.deviceType?.trim() || undefined,
      color: this.form.color?.trim() || undefined,
      storage: this.form.storage?.trim() || undefined,
      ram: this.form.ram?.trim() || undefined,
      batteryHealth: this.form.batteryHealth ?? undefined,
      warrantyType: this.form.warrantyType || undefined,
      warrantyMonths: this.form.warrantyMonths ?? undefined,
      installmentAvailable: this.form.installmentAvailable || false,
      specs: this.serializeSpecs(),
      whatsInTheBox: this.serializeBoxItems(),
      customFieldsJson: cfValues.length ? JSON.stringify(cfValues) : undefined,
      checklistJson: clItems.length ? JSON.stringify(clItems) : undefined,
    };

    const req$ = this.isEdit()
      ? this.api.put<any>(`/Items/${this.editId}`, body)
      : this.api.post<any>('/Items', body);

    req$.subscribe({
      next: (result: any) => {
        const itemId = result?.id || this.editId;

        // Update status via separate endpoint
        if (status) {
          this.api.patch(`/Items/${itemId}/status`, { status }).subscribe();
        }

        // Upload images
        if (this.mainImageFile) {
          const fd = new FormData();
          fd.append('file', this.mainImageFile);
          this.api.upload(`/Items/${itemId}/images?isMain=true`, fd).subscribe();
        }
        for (const file of this.galleryFiles) {
          const fd = new FormData();
          fd.append('file', file);
          this.api.upload(`/Items/${itemId}/images`, fd).subscribe();
        }

        this.toastService.success(this.isEdit() ? this.i18n.t('items.saved') : this.i18n.t('items.created'));
        this.saving.set(false);
        this.router.navigate([this.tenantService.adminUrl() + '/items']);
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.message || this.i18n.t('items.saveFailed');
        this.toastService.error(msg);
        this.saving.set(false);
      },
    });
  }
}
