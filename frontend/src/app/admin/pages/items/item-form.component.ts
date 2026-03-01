import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { TenantService } from '../../../core/services/tenant.service';
import { I18nService } from '../../../core/services/i18n.service';
import { Brand, Category, CustomFieldDefinition, ItemImage } from '../../../core/models/item.models';
import { resolveImageUrl } from '../../../core/utils/image.utils';

interface InstallmentProviderRef { id: string; name: string; }
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
            <label class="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
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

      <!-- 2. DEVICE SPECS -->
      <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
          <h2 class="font-semibold text-base text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">2</span>
            {{ i18n.t('items.deviceDetails') }}
          </h2>

          <!-- Color -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.color') }}</label>
            <div class="flex flex-wrap gap-1.5">
              @for (c of colorOptions; track c.name) {
                <button type="button" (click)="form.color = form.color === c.name ? '' : c.name"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                  [class]="form.color === c.name
                    ? 'border-gray-900 bg-gray-900 text-white ring-1 ring-gray-900/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'">
                  <span class="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0" [style.background-color]="c.hex"></span>
                  {{ c.name }}
                </button>
              }
            </div>
            <input [(ngModel)]="form.color" class="mt-2 w-full max-w-xs px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 outline-none" [placeholder]="i18n.t('items.customColor')" />
          </div>

          <!-- Storage -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.storage') }}</label>
            <div class="flex flex-wrap gap-2">
              @for (s of storageOptions; track s) {
                <button type="button" (click)="form.storage = form.storage === s ? '' : s"
                  class="px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all"
                  [class]="form.storage === s
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'">
                  {{ s }}
                </button>
              }
            </div>
            <input [(ngModel)]="form.storage" class="mt-2 w-full max-w-xs px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 outline-none" [placeholder]="i18n.t('items.customStorage')" />
          </div>

          <!-- RAM -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.ram') }}</label>
            <div class="flex flex-wrap gap-2">
              @for (r of ramOptions; track r) {
                <button type="button" (click)="form.ram = form.ram === r ? '' : r"
                  class="px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all"
                  [class]="form.ram === r
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'">
                  {{ r }}
                </button>
              }
            </div>
            <input [(ngModel)]="form.ram" class="mt-2 w-full max-w-xs px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 outline-none" [placeholder]="i18n.t('items.customRam')" />
          </div>
        </section>

      <!-- 3. CONDITION DETAILS & IDENTIFIERS -->
      <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
          <h2 class="font-semibold text-base text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">!</span>
            {{ i18n.t('items.conditionDetails') }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.batteryHealth') }} %</label>
                <div class="relative">
                  <input [(ngModel)]="form.batteryHealth" type="number" min="0" max="100" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition" placeholder="e.g. 95" />
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
                <input [(ngModel)]="form.imei" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition font-mono" placeholder="Optional" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.serialNumber') }}</label>
                <input [(ngModel)]="form.serialNumber" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition font-mono" placeholder="Optional" />
              </div>
          </div>
        </section>

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
                    <input [(ngModel)]="form.warrantyMonths" type="number" min="0" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none transition" placeholder="e.g. 12" />
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
              <span class="absolute inset-y-0 end-4 flex items-center text-xs text-gray-400 font-medium">EGP</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.oldPrice') }}</label>
            <div class="relative">
              <input [(ngModel)]="form.oldPrice" type="number" min="0" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 outline-none transition pe-14" />
              <span class="absolute inset-y-0 end-4 flex items-center text-xs text-gray-400 font-medium">EGP</span>
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
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.vatPercent') }}</label>
                <input [(ngModel)]="form.vatPercent" type="number" min="0" max="100" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none bg-white transition" />
              </div>
              @if (form.price && form.vatPercent) {
                <div class="flex items-end pb-1">
                  <span class="text-sm text-gray-500">{{ i18n.t('items.taxAmount') }}: <strong class="text-gray-900">{{ (form.price * form.vatPercent / 100) | number:'1.2-2' }}</strong></span>
                </div>
              }
            }
          </div>
        </div>
      </section>

      <!-- 6. INSTALLMENTS -->
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
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.selectProviders') }}</label>
              <div class="flex flex-wrap gap-2 mt-1">
                @for (pv of installmentProviders(); track pv.id) {
                  <button type="button" (click)="toggleProvider(pv.id)"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    [class]="selectedProviderIds.has(pv.id)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'">
                    {{ pv.name }}
                  </button>
                }
              </div>
            </div>
          }
        </section>
      }

      <!-- 7. DESCRIPTION & SPECS -->
      <section class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-in">
        <h2 class="font-semibold text-base text-gray-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">6</span>
          {{ i18n.t('items.descriptionAndSpecs') }}
        </h2>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.description') }}</label>
          <textarea [(ngModel)]="form.description" rows="3" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none resize-none transition" [placeholder]="i18n.t('items.descriptionPlaceholder')"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.specs') }}</label>
          <textarea [(ngModel)]="form.specs" rows="4" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none resize-none font-mono text-xs transition" placeholder="Display: 6.7 inch OLED&#10;Processor: A17 Pro&#10;Camera: 48MP Triple"></textarea>
          <p class="text-xs text-gray-400 mt-1">{{ i18n.t('items.specsHint') }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('items.whatsInTheBox') }}</label>
          <textarea [(ngModel)]="form.whatsInTheBox" rows="2" class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm outline-none resize-none transition" placeholder="1x Phone, 1x USB-C Cable, 1x Charger"></textarea>
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
            <p class="text-xs text-gray-500 mt-1">Inspect and document the product condition before listing. Check each item that passes inspection.</p>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="loadPresetChecklist()" type="button" class="text-xs text-gray-500 hover:text-gray-700 font-medium transition border border-gray-200 px-2.5 py-1 rounded-lg">Presets</button>
            <button (click)="addChecklistItem()" type="button" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition">+ {{ i18n.t('common.add') }}</button>
          </div>
        </div>
        @if (checklist.length) {
          <div class="space-y-2">
            <div class="flex items-center gap-2 px-2.5 pb-1 text-xs text-gray-400 font-medium">
              <span class="w-4 shrink-0"></span>
              <span class="flex-1">Check Item</span>
              <span class="flex-1">Notes (optional)</span>
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

  // State
  readonly isEdit = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly brands = signal<Brand[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly customFields = signal<CustomFieldDefinition[]>([]);
  readonly installmentProviders = signal<InstallmentProviderRef[]>([]);
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

  selectedProviderIds = new Set<string>();
  checklist: ChecklistEntry[] = [];
  customFieldValues: Record<string, string> = {};

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
    taxStatus: string; vatPercent: number;
    color: string; storage: string; ram: string;
    batteryHealth: number | null; warrantyType: string; warrantyMonths: number | null;
    installmentAvailable: boolean;
    specs: string; whatsInTheBox: string;
  } = {
    title: '', slug: '', description: '', price: 0, oldPrice: null,
    condition: 'New', isFeatured: false,
    brandId: '', categoryId: '',
    quantity: 1, lowStockThreshold: 2,
    imei: '', serialNumber: '',
    taxStatus: 'Taxable', vatPercent: 14,
    color: '', storage: '', ram: '',
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
    }).subscribe({
      next: (data) => {
        this.brands.set(data.brands || []);
        this.categories.set(data.categories || []);
        this.customFields.set(data.customFields || []);
        this.installmentProviders.set(data.providers || []);

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
        this.form.vatPercent = item.vatPercent ?? 14;
        this.form.color = item.color || '';
        this.form.storage = item.storage || '';
        this.form.ram = item.ram || '';
        this.form.batteryHealth = item.batteryHealth ?? null;
        this.form.warrantyType = item.warrantyType || '';
        this.form.warrantyMonths = item.warrantyMonths ?? null;
        this.form.installmentAvailable = item.installmentAvailable || false;
        this.form.specs = item.specs || '';
        this.form.whatsInTheBox = item.whatsInTheBox || '';

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
    this.form.vatPercent = this.form.taxStatus === 'Exempt' ? 0 : 14;
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

  onMainImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.mainImageFile = file;
      const reader = new FileReader();
      reader.onload = () => this.mainImagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onGalleryChange(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.galleryFiles = Array.from(files).slice(0, 5);
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
      vatPercent: this.form.vatPercent ?? 0,
      color: this.form.color?.trim() || undefined,
      storage: this.form.storage?.trim() || undefined,
      ram: this.form.ram?.trim() || undefined,
      batteryHealth: this.form.batteryHealth ?? undefined,
      warrantyType: this.form.warrantyType || undefined,
      warrantyMonths: this.form.warrantyMonths ?? undefined,
      installmentAvailable: this.form.installmentAvailable || false,
      specs: this.form.specs?.trim() || undefined,
      whatsInTheBox: this.form.whatsInTheBox?.trim() || undefined,
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
