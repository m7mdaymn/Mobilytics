import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Tenant, TenantStoreSettings, UpdateStoreSettingsRequest, PlatformInvoice } from '../../../core/models/platform.models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="max-w-5xl mx-auto space-y-6">
      <div class="flex items-center gap-4">
        <a routerLink="/superadmin/tenants" class="text-slate-500 hover:text-slate-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 class="text-2xl font-bold text-slate-800">Tenant Detail</h1>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      } @else if (tenant()) {
        <!-- Header Card -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            @if (tenant()!.storeSettings?.logoUrl) {
              <img [src]="tenant()!.storeSettings!.logoUrl!" class="w-16 h-16 rounded-xl object-cover" />
            } @else {
              <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                {{ tenant()!.name.charAt(0) }}
              </div>
            }
            <div class="flex-1">
              <h2 class="text-xl font-bold text-slate-800">{{ tenant()!.name }}</h2>
              <p class="text-slate-500"><code>{{ tenant()!.slug }}</code></p>
            </div>
            <div class="flex gap-2">
              <span class="text-sm px-3 py-1 rounded-full font-medium"
                [class]="tenant()!.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                         tenant()!.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                         'bg-amber-100 text-amber-700'">
                {{ tenant()!.status }}
              </span>
              @if (tenant()!.status === 'Active') {
                <button (click)="suspend()" class="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 border border-red-300 rounded-full hover:bg-red-50">
                  Suspend
                </button>
              } @else {
                <button (click)="activate()" class="text-emerald-600 hover:text-emerald-800 text-sm font-medium px-3 py-1 border border-emerald-300 rounded-full hover:bg-emerald-50">
                  Activate
                </button>
              }
            </div>
          </div>
        </div>

        <!-- ═══ TAB NAVIGATION ═══ -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="flex border-b border-slate-200 overflow-x-auto">
            @for (tab of pageTabs; track tab.key) {
              <button (click)="activePageTab.set(tab.key)"
                class="flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
                [class]="activePageTab() === tab.key
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'">
                <span>{{ tab.icon }}</span>
                <span>{{ tab.label }}</span>
              </button>
            }
          </div>

          <div class="p-6">
            <!-- ─── TAB: Overview ─── -->
            @if (activePageTab() === 'overview') {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Basic Info -->
                <div class="space-y-4">
                  <h3 class="font-semibold text-slate-800 border-b border-slate-200 pb-2">Basic Info</h3>
                  <div class="space-y-3 text-sm">
                    <div class="flex justify-between"><span class="text-slate-500">Slug</span><span class="font-mono text-slate-800">{{ tenant()!.slug }}</span></div>
                    <div class="flex justify-between"><span class="text-slate-500">Created</span><span class="text-slate-800">{{ tenant()!.createdAt | date:'medium' }}</span></div>
                    <div class="flex justify-between"><span class="text-slate-500">Updated</span><span class="text-slate-800">{{ tenant()!.updatedAt | date:'medium' }}</span></div>
                    @if (tenant()!.supportPhone) {
                      <div class="flex justify-between"><span class="text-slate-500">Phone</span><span class="text-slate-800">{{ tenant()!.supportPhone }}</span></div>
                    }
                    @if (tenant()!.supportWhatsApp) {
                      <div class="flex justify-between"><span class="text-slate-500">WhatsApp</span><span class="text-slate-800">{{ tenant()!.supportWhatsApp }}</span></div>
                    }
                    @if (tenant()!.address) {
                      <div class="flex justify-between"><span class="text-slate-500">Address</span><span class="text-slate-800">{{ tenant()!.address }}</span></div>
                    }
                    @if (tenant()!.mapUrl) {
                      <div class="flex justify-between"><span class="text-slate-500">Maps</span><a [href]="tenant()!.mapUrl" target="_blank" class="text-indigo-600 hover:underline text-xs">View Map</a></div>
                    }
                  </div>
                </div>

                <!-- Owner Info -->
                <div class="space-y-4">
                  <h3 class="font-semibold text-slate-800 border-b border-slate-200 pb-2">Owner</h3>
                  @if (tenant()!.owner) {
                    <div class="space-y-3 text-sm">
                      <div class="flex justify-between"><span class="text-slate-500">Name</span><span class="text-slate-800">{{ tenant()!.owner!.name }}</span></div>
                      <div class="flex justify-between"><span class="text-slate-500">Email</span><span class="text-slate-800">{{ tenant()!.owner!.email }}</span></div>
                      @if (tenant()!.owner!.phone) {
                        <div class="flex justify-between"><span class="text-slate-500">Phone</span><span class="text-slate-800">{{ tenant()!.owner!.phone }}</span></div>
                      }
                      @if (tenant()!.owner!.whatsApp) {
                        <div class="flex justify-between"><span class="text-slate-500">WhatsApp</span><span class="text-slate-800">{{ tenant()!.owner!.whatsApp }}</span></div>
                      }
                    </div>
                  } @else {
                    <p class="text-slate-400 text-sm">No owner assigned</p>
                  }
                </div>
              </div>

              <!-- Access URLs -->
              <div class="mt-6 space-y-4">
                <h3 class="font-semibold text-slate-800 border-b border-slate-200 pb-2">Access URLs</h3>
                <div class="space-y-3 text-sm">
                  <div class="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p class="text-xs text-slate-500 uppercase font-medium mb-1">Store Front</p>
                      <code class="text-indigo-600 text-xs">https://{{ appDomain }}/store?tenant={{ tenant()!.slug }}</code>
                    </div>
                    <a [href]="'https://' + appDomain + '/store?tenant=' + tenant()!.slug" target="_blank" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Open Store</a>
                  </div>
                  <div class="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p class="text-xs text-slate-500 uppercase font-medium mb-1">Admin Panel</p>
                      <code class="text-indigo-600 text-xs">https://{{ appDomain }}/admin/login?tenant={{ tenant()!.slug }}</code>
                    </div>
                    <a [href]="'https://' + appDomain + '/admin/login?tenant=' + tenant()!.slug" target="_blank" class="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Open Admin</a>
                  </div>
                  <div class="bg-slate-50 rounded-lg p-3">
                    <p class="text-xs text-slate-500 uppercase font-medium mb-1">Subdomain (Future)</p>
                    <code class="text-indigo-600 text-xs">https://{{ tenant()!.slug }}.mobilytics.com</code>
                  </div>
                </div>
              </div>
            }

            <!-- ─── TAB: Subscription ─── -->
            @if (activePageTab() === 'subscription') {
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-slate-800">Subscription</h3>
                  <div class="flex gap-2">
                    @if (tenant()!.subscription) {
                      <button (click)="startEditSubscription()" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit Months</button>
                      <button (click)="deleteSubscription()" class="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    }
                    <a routerLink="/superadmin/subscriptions" [queryParams]="{ tenantId: tenant()!.id }" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Manage</a>
                  </div>
                </div>
                @if (editingSubscription()) {
                  <div class="bg-slate-50 rounded-lg p-4 space-y-3">
                    <p class="text-sm text-slate-600 font-medium">Change Subscription Duration</p>
                    <div class="flex items-center gap-3">
                      <label class="text-sm text-slate-500">Months:</label>
                      <input type="number" min="1" max="36" [(ngModel)]="subEditMonths" class="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
                    </div>
                    <div class="flex gap-2">
                      <button (click)="saveSubscription()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Save</button>
                      <button (click)="editingSubscription.set(false)" class="bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium">Cancel</button>
                    </div>
                  </div>
                }
                @if (tenant()!.subscription) {
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div class="bg-slate-50 rounded-lg p-4">
                      <p class="text-slate-500 text-xs uppercase mb-1">Plan</p>
                      <p class="font-medium text-slate-800">{{ tenant()!.subscription!.planName }}</p>
                    </div>
                    <div class="bg-slate-50 rounded-lg p-4">
                      <p class="text-slate-500 text-xs uppercase mb-1">Status</p>
                      <span class="text-xs px-2 py-1 rounded-full"
                        [class]="tenant()!.subscription!.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                 tenant()!.subscription!.status === 'Trial' ? 'bg-blue-100 text-blue-700' :
                                 tenant()!.subscription!.status === 'Grace' ? 'bg-orange-100 text-orange-700' :
                                 'bg-slate-100 text-slate-600'">
                        {{ tenant()!.subscription!.status }}
                      </span>
                    </div>
                    <div class="bg-slate-50 rounded-lg p-4">
                      <p class="text-slate-500 text-xs uppercase mb-1">Start Date</p>
                      <p class="text-slate-800">{{ tenant()!.subscription!.startDate | date:'mediumDate' }}</p>
                    </div>
                    <div class="bg-slate-50 rounded-lg p-4">
                      <p class="text-slate-500 text-xs uppercase mb-1">End Date</p>
                      <p class="text-slate-800">{{ tenant()!.subscription!.endDate | date:'mediumDate' }}</p>
                    </div>
                  </div>
                } @else {
                  <div class="text-center py-10">
                    <svg class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    <p class="text-slate-400 mb-4">No active subscription</p>
                    <a routerLink="/superadmin/subscriptions" [queryParams]="{ tenantId: tenant()!.id }" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Start Subscription</a>
                  </div>
                }
              </div>
            }

            <!-- ─── TAB: Store Settings ─── -->
            @if (activePageTab() === 'settings') {
              <div class="space-y-5">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-slate-800">Store Settings</h3>
                  @if (!editingSettings()) {
                    <button (click)="startEditSettings()" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                  }
                </div>

                @if (editingSettings() && settingsForm) {
                  <!-- Settings Sub-Tab Navigation -->
                  <div class="flex flex-wrap gap-1 border-b border-slate-200 pb-1">
                    @for (tab of settingsTabs; track tab.key) {
                      <button (click)="activeSettingsTab.set(tab.key)"
                        class="px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors"
                        [class]="activeSettingsTab() === tab.key ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'">
                        {{ tab.label }}
                      </button>
                    }
                  </div>

                  <!-- TAB: General -->
                  @if (activeSettingsTab() === 'general') {
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-slate-700 mb-1">Store Name</label>
                        <input [(ngModel)]="settingsForm.storeName" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
                        <input [(ngModel)]="settingsForm.logoUrl" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="https://..." />
                        @if (settingsForm.logoUrl) {
                          <img [src]="settingsForm.logoUrl" class="mt-1 h-10 rounded" />
                        }
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Banner URL</label>
                        <input [(ngModel)]="settingsForm.bannerUrl" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="https://..." />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">WhatsApp Number</label>
                        <input [(ngModel)]="settingsForm.whatsAppNumber" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="+201000000000" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input [(ngModel)]="settingsForm.phoneNumber" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="+201000000000" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Currency Code</label>
                        <input [(ngModel)]="settingsForm.currencyCode" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="EGP" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Theme</label>
                        <select [(ngModel)]="settingsForm.themePresetId" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                          <option [ngValue]="1">1 — Midnight Pro</option>
                          <option [ngValue]="2">2 — Ocean Blue</option>
                          <option [ngValue]="3">3 — Forest Green</option>
                          <option [ngValue]="4">4 — Royal Purple</option>
                          <option [ngValue]="5">5 — Sunset Orange</option>
                          <option [ngValue]="6">6 — Slate Minimal</option>
                          <option [ngValue]="7">7 — Rose Gold</option>
                          <option [ngValue]="8">8 — Arctic Blue</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Working Hours</label>
                        <input [(ngModel)]="settingsForm.workingHours" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="9:00 AM - 10:00 PM" />
                      </div>
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-slate-700 mb-1">Footer Address</label>
                        <input [(ngModel)]="settingsForm.footerAddress" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="123 Main St, Cairo" />
                      </div>
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-slate-700 mb-1">Map URL</label>
                        <input [(ngModel)]="settingsForm.mapUrl" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="https://maps.google.com/..." />
                      </div>
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-slate-700 mb-1">Header Notice Text</label>
                        <input [(ngModel)]="settingsForm.headerNoticeText" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Free shipping on orders over 500 EGP!" />
                      </div>
                    </div>
                  }

                  <!-- TAB: About -->
                  @if (activeSettingsTab() === 'about') {
                    <div class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">About Title</label>
                        <input [(ngModel)]="settingsForm.aboutTitle" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="About Our Store" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">About Description</label>
                        <textarea [(ngModel)]="settingsForm.aboutDescription" rows="5" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Tell your customers about your store..."></textarea>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">About Image URL</label>
                        <input [(ngModel)]="settingsForm.aboutImageUrl" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="https://..." />
                        @if (settingsForm.aboutImageUrl) {
                          <img [src]="settingsForm.aboutImageUrl" class="mt-2 h-24 rounded-lg object-cover" />
                        }
                      </div>
                    </div>
                  }

                  <!-- TAB: Banners -->
                  @if (activeSettingsTab() === 'banners') {
                    <div class="space-y-3">
                      <p class="text-xs text-slate-500">JSON array of hero banners. Each object: {{ '{' }} "title", "subtitle", "imageUrl", "buttonText", "buttonLink" {{ '}' }}</p>
                      <textarea [(ngModel)]="settingsForm.heroBannersJson" rows="10" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" placeholder='[{"title":"Welcome","subtitle":"Best deals","imageUrl":"...","buttonText":"Shop Now","buttonLink":"/shop"}]'></textarea>
                      <button (click)="formatJsonField('heroBannersJson')" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Format JSON</button>
                    </div>
                  }

                  <!-- TAB: Testimonials -->
                  @if (activeSettingsTab() === 'testimonials') {
                    <div class="space-y-3">
                      <p class="text-xs text-slate-500">JSON array. Each: {{ '{' }} "name", "role", "text", "rating" (1-5) {{ '}' }}</p>
                      <textarea [(ngModel)]="settingsForm.testimonialsJson" rows="10" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" placeholder='[{"name":"Ahmed","role":"Customer","text":"Great store!","rating":5}]'></textarea>
                      <button (click)="formatJsonField('testimonialsJson')" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Format JSON</button>
                    </div>
                  }

                  <!-- TAB: FAQ -->
                  @if (activeSettingsTab() === 'faq') {
                    <div class="space-y-3">
                      <p class="text-xs text-slate-500">JSON array. Each: {{ '{' }} "question", "answer" {{ '}' }}</p>
                      <textarea [(ngModel)]="settingsForm.faqJson" rows="10" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" placeholder='[{"question":"Do you deliver?","answer":"Yes, we deliver nationwide."}]'></textarea>
                      <button (click)="formatJsonField('faqJson')" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Format JSON</button>
                    </div>
                  }

                  <!-- TAB: Trust & Social -->
                  @if (activeSettingsTab() === 'trust') {
                    <div class="space-y-5">
                      <div class="space-y-3">
                        <label class="block text-sm font-medium text-slate-700">Trust Badges (JSON)</label>
                        <p class="text-xs text-slate-500">JSON array. Each: {{ '{' }} "icon", "title", "description" {{ '}' }}</p>
                        <textarea [(ngModel)]="settingsForm.trustBadgesJson" rows="6" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" placeholder='[{"icon":"🚀","title":"Fast Shipping","description":"Delivered in 2-3 days"}]'></textarea>
                        <button (click)="formatJsonField('trustBadgesJson')" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Format JSON</button>
                      </div>
                      <div class="space-y-3">
                        <label class="block text-sm font-medium text-slate-700">Social Links (JSON)</label>
                        <textarea [(ngModel)]="settingsForm.socialLinksJson" rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" placeholder='{"facebook":"...","instagram":"...","twitter":"...","tiktok":"..."}'></textarea>
                        <button (click)="formatJsonField('socialLinksJson')" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Format JSON</button>
                      </div>
                    </div>
                  }

                  <!-- TAB: Policies -->
                  @if (activeSettingsTab() === 'policies') {
                    <div class="space-y-3">
                      <p class="text-xs text-slate-500">JSON object with policy keys: return, warranty, privacy, shipping, terms</p>
                      <textarea [(ngModel)]="settingsForm.policiesJson" rows="12" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" placeholder='{"return":"...","warranty":"...","privacy":"...","shipping":"...","terms":"..."}'></textarea>
                      <button (click)="formatJsonField('policiesJson')" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Format JSON</button>
                    </div>
                  }

                  <!-- TAB: WhatsApp Templates -->
                  @if (activeSettingsTab() === 'whatsapp') {
                    <div class="space-y-3">
                      <p class="text-xs text-slate-500">JSON object with template keys: orderConfirmation, orderShipped, orderDelivered, paymentReminder, welcomeMessage</p>
                      <textarea [(ngModel)]="settingsForm.whatsAppTemplatesJson" rows="10" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" placeholder='{"orderConfirmation":"Hi {name}, your order #{orderId} is confirmed!"}'></textarea>
                      <button (click)="formatJsonField('whatsAppTemplatesJson')" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Format JSON</button>
                    </div>
                  }

                  @if (settingsError()) {
                    <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{{ settingsError() }}</div>
                  }

                  <div class="flex gap-3 pt-2">
                    <button (click)="saveSettings()" [disabled]="savingSettings()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                      {{ savingSettings() ? 'Saving...' : 'Save All Settings' }}
                    </button>
                    <button (click)="cancelEditSettings()" class="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
                  </div>
                } @else {
                  <!-- Read Mode -->
                  @if (tenant()!.storeSettings) {
                    @let ss = tenant()!.storeSettings!;
                    <div class="space-y-5">
                      <!-- General Info -->
                      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div><span class="text-slate-500">Store Name:</span> <span class="font-medium">{{ ss.storeName }}</span></div>
                        @if (ss.logoUrl) {
                          <div><span class="text-slate-500">Logo:</span> <img [src]="ss.logoUrl!" class="h-8 inline-block ml-1 rounded" /></div>
                        }
                        <div><span class="text-slate-500">Currency:</span> {{ ss.currencyCode }}</div>
                        <div><span class="text-slate-500">Theme:</span> Preset #{{ ss.themePresetId }}</div>
                        @if (ss.phoneNumber) {
                          <div><span class="text-slate-500">Phone:</span> {{ ss.phoneNumber }}</div>
                        }
                        @if (ss.whatsAppNumber) {
                          <div><span class="text-slate-500">WhatsApp:</span> {{ ss.whatsAppNumber }}</div>
                        }
                        @if (ss.footerAddress) {
                          <div class="col-span-2"><span class="text-slate-500">Address:</span> {{ ss.footerAddress }}</div>
                        }
                        @if (ss.workingHours) {
                          <div><span class="text-slate-500">Hours:</span> {{ ss.workingHours }}</div>
                        }
                        @if (ss.mapUrl) {
                          <div><span class="text-slate-500">Map:</span> <a [href]="ss.mapUrl" target="_blank" class="text-indigo-600 hover:underline text-xs">View</a></div>
                        }
                        @if (ss.headerNoticeText) {
                          <div class="col-span-2 md:col-span-3"><span class="text-slate-500">Header Notice:</span> {{ ss.headerNoticeText }}</div>
                        }
                      </div>

                      <!-- Content Summary -->
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div class="bg-slate-50 rounded-lg p-3 text-center">
                          <p class="text-lg font-bold text-indigo-600">{{ countJsonArray(ss.heroBannersJson) }}</p>
                          <p class="text-xs text-slate-500">Banners</p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3 text-center">
                          <p class="text-lg font-bold text-indigo-600">{{ countJsonArray(ss.testimonialsJson) }}</p>
                          <p class="text-xs text-slate-500">Testimonials</p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3 text-center">
                          <p class="text-lg font-bold text-indigo-600">{{ countJsonArray(ss.faqJson) }}</p>
                          <p class="text-xs text-slate-500">FAQs</p>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-3 text-center">
                          <p class="text-lg font-bold text-indigo-600">{{ countJsonArray(ss.trustBadgesJson) }}</p>
                          <p class="text-xs text-slate-500">Trust Badges</p>
                        </div>
                      </div>

                      <!-- About Preview -->
                      @if (ss.aboutTitle || ss.aboutDescription) {
                        <div class="bg-slate-50 rounded-lg p-4">
                          <p class="text-xs text-slate-400 uppercase font-medium mb-1">About</p>
                          @if (ss.aboutTitle) { <p class="font-medium text-slate-800">{{ ss.aboutTitle }}</p> }
                          @if (ss.aboutDescription) { <p class="text-sm text-slate-600 mt-1 line-clamp-3">{{ ss.aboutDescription }}</p> }
                        </div>
                      }

                      <!-- Policies keys preview -->
                      @if (ss.policiesJson) {
                        <div class="bg-slate-50 rounded-lg p-4">
                          <p class="text-xs text-slate-400 uppercase font-medium mb-1">Policies Configured</p>
                          <p class="text-sm text-slate-600">{{ getPolicyKeys(ss.policiesJson) }}</p>
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="text-slate-400 text-sm">No store settings configured. Click Edit to set them up.</p>
                  }
                }
              </div>
            }

            <!-- ─── TAB: Invoices ─── -->
            @if (activePageTab() === 'invoices') {
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-slate-800">Invoices</h3>
                  <button (click)="loadInvoices()" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Refresh</button>
                </div>

                @if (loadingInvoices()) {
                  <div class="flex justify-center py-8">
                    <div class="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                  </div>
                } @else if (invoices().length === 0) {
                  <div class="text-center py-10">
                    <svg class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>
                    <p class="text-slate-400 text-sm">No invoices found for this tenant.</p>
                  </div>
                } @else {
                  <div class="space-y-4">
                    @for (inv of invoices(); track inv.id) {
                      <div class="bg-slate-50 rounded-xl p-5 space-y-3">
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div><span class="text-slate-500">Invoice #:</span> <span class="font-mono font-medium">{{ inv.invoiceNumber }}</span></div>
                          <div><span class="text-slate-500">Type:</span> {{ inv.invoiceType }}</div>
                          <div><span class="text-slate-500">Duration:</span> {{ inv.months }} month(s)</div>
                          <div><span class="text-slate-500">Payment:</span> {{ inv.paymentMethod }}</div>
                          <div><span class="text-slate-500">Status:</span>
                            <span class="text-xs px-2 py-0.5 rounded-full"
                              [class]="inv.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                              {{ inv.paymentStatus }}
                            </span>
                          </div>
                          <div><span class="text-slate-500">Date:</span> {{ inv.createdAt | date:'medium' }}</div>
                        </div>
                        <div class="bg-white rounded-lg p-3 space-y-2 text-sm">
                          <div class="flex justify-between"><span class="text-slate-500">Activation Fee</span><span>{{ inv.activationFee | number:'1.0-0' }} EGP</span></div>
                          <div class="flex justify-between"><span class="text-slate-500">Subscription</span><span>{{ inv.subscriptionAmount | number:'1.0-0' }} EGP</span></div>
                          @if (inv.discount > 0) {
                            <div class="flex justify-between text-red-600"><span>Discount</span><span>-{{ inv.discount | number:'1.0-0' }} EGP</span></div>
                          }
                          <div class="flex justify-between border-t border-slate-200 pt-2 font-bold text-base">
                            <span>Total</span>
                            <span class="text-indigo-600">{{ inv.total | number:'1.0-0' }} EGP</span>
                          </div>
                        </div>
                        <!-- Invoice Actions -->
                        <div class="flex flex-wrap gap-2 pt-1">
                          <button (click)="printInvoice(inv)" class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                            Print PDF
                          </button>
                          <button (click)="sendInvoiceWhatsApp(inv)" class="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.574-1.503A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.198 0-4.247-.6-6.008-1.64l-.43-.255-3.244 1.065 1.084-3.16-.278-.443A9.724 9.724 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/></svg>
                            Invoice WhatsApp
                          </button>
                          <button (click)="deleteInvoice(inv)" class="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- ─── TAB: Actions ─── -->
            @if (activePageTab() === 'actions') {
              <div class="space-y-6">
                <!-- Quick Actions -->
                <div class="space-y-4">
                  <h3 class="font-semibold text-slate-800">Quick Actions</h3>
                  <div class="flex flex-wrap gap-3">
                    <button (click)="sendCredentialsWhatsApp()" class="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.574-1.503A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.198 0-4.247-.6-6.008-1.64l-.43-.255-3.244 1.065 1.084-3.16-.278-.443A9.724 9.724 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/></svg>
                      Send Credentials via WhatsApp
                    </button>
                  </div>
                </div>

                <!-- Danger Zone -->
                <div class="mt-8 bg-red-50 rounded-xl p-6 border border-red-200 space-y-4">
                  <h3 class="font-semibold text-red-800">Danger Zone</h3>
                  <p class="text-red-600 text-sm">Deleting a tenant will permanently remove all associated data.</p>
                  <button (click)="deleteTenant()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Delete Tenant</button>
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="text-center py-12 text-slate-400">Tenant not found</div>
      }
    </div>
  `,
})
export class TenantDetailComponent implements OnInit {
  private readonly api = inject(PlatformApiService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly appDomain = environment.appDomain;

  readonly tenant = signal<Tenant | null>(null);
  readonly loading = signal(true);
  readonly editingSettings = signal(false);
  readonly savingSettings = signal(false);
  readonly settingsError = signal<string | null>(null);
  readonly invoices = signal<PlatformInvoice[]>([]);
  readonly loadingInvoices = signal(false);
  readonly editingSubscription = signal(false);
  readonly activeSettingsTab = signal('general');
  readonly activePageTab = signal('overview');
  subEditMonths = 1;

  readonly pageTabs = [
    { key: 'overview', icon: '📋', label: 'Overview' },
    { key: 'subscription', icon: '💎', label: 'Subscription' },
    { key: 'settings', icon: '⚙️', label: 'Store Settings' },
    { key: 'invoices', icon: '🧾', label: 'Invoices' },
    { key: 'actions', icon: '⚡', label: 'Actions' },
  ];

  readonly settingsTabs = [
    { key: 'general', label: 'General' },
    { key: 'about', label: 'About' },
    { key: 'banners', label: 'Banners' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'faq', label: 'FAQ' },
    { key: 'trust', label: 'Trust & Social' },
    { key: 'policies', label: 'Policies' },
    { key: 'whatsapp', label: 'WhatsApp' },
  ];

  settingsForm: UpdateStoreSettingsRequest = {
    storeName: '',
    themePresetId: 1,
    currencyCode: 'EGP',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.api.getTenant(id).subscribe({
      next: data => {
        this.tenant.set(data);
        this.loading.set(false);
        this.loadInvoices();
      },
      error: () => {
        this.tenant.set(null);
        this.loading.set(false);
      },
    });
  }

  loadInvoices(): void {
    const t = this.tenant();
    if (!t) return;
    this.loadingInvoices.set(true);
    this.api.getInvoices(t.id).subscribe({
      next: data => {
        this.invoices.set(data);
        this.loadingInvoices.set(false);
      },
      error: () => this.loadingInvoices.set(false),
    });
  }

  startEditSettings(): void {
    const s = this.tenant()?.storeSettings;
    this.settingsForm = {
      storeName: s?.storeName || this.tenant()?.name || '',
      logoUrl: s?.logoUrl,
      bannerUrl: s?.bannerUrl,
      whatsAppNumber: s?.whatsAppNumber,
      phoneNumber: s?.phoneNumber,
      themePresetId: s?.themePresetId ?? 1,
      currencyCode: s?.currencyCode ?? 'EGP',
      footerAddress: s?.footerAddress,
      workingHours: s?.workingHours,
      socialLinksJson: s?.socialLinksJson,
      policiesJson: s?.policiesJson,
      mapUrl: s?.mapUrl,
      headerNoticeText: s?.headerNoticeText,
      aboutTitle: s?.aboutTitle,
      aboutDescription: s?.aboutDescription,
      aboutImageUrl: s?.aboutImageUrl,
      heroBannersJson: s?.heroBannersJson,
      testimonialsJson: s?.testimonialsJson,
      faqJson: s?.faqJson,
      trustBadgesJson: s?.trustBadgesJson,
      whatsAppTemplatesJson: s?.whatsAppTemplatesJson,
    };
    this.settingsError.set(null);
    this.activeSettingsTab.set('general');
    this.editingSettings.set(true);
  }

  cancelEditSettings(): void {
    this.editingSettings.set(false);
    this.settingsError.set(null);
  }

  saveSettings(): void {
    if (!this.tenant()) return;
    if (!this.settingsForm.storeName) {
      this.settingsError.set('Store name is required.');
      return;
    }
    this.savingSettings.set(true);
    this.settingsError.set(null);
    this.api.updateStoreSettings(this.tenant()!.id, this.settingsForm).subscribe({
      next: () => {
        this.savingSettings.set(false);
        this.editingSettings.set(false);
        this.toast.success('Store settings updated');
        this.load(this.tenant()!.id);
      },
      error: (err: any) => {
        this.savingSettings.set(false);
        this.settingsError.set(err?.message || 'Failed to update store settings');
      },
    });
  }

  suspend(): void {
    if (!this.tenant()) return;
    if (!confirm(`Suspend "${this.tenant()!.name}"?`)) return;
    this.api.suspendTenant(this.tenant()!.id).subscribe({
      next: () => {
        this.toast.success('Tenant suspended');
        this.load(this.tenant()!.id);
      },
      error: () => this.toast.error('Failed to suspend'),
    });
  }

  activate(): void {
    if (!this.tenant()) return;
    this.api.activateTenant(this.tenant()!.id).subscribe({
      next: () => {
        this.toast.success('Tenant activated');
        this.load(this.tenant()!.id);
      },
      error: () => this.toast.error('Failed to activate'),
    });
  }

  deleteTenant(): void {
    if (!this.tenant()) return;
    if (!confirm(`DELETE "${this.tenant()!.name}"? This cannot be undone!`)) return;
    if (!confirm('Are you absolutely sure? All data will be lost.')) return;
    this.api.deleteTenant(this.tenant()!.id).subscribe({
      next: () => {
        this.toast.success('Tenant deleted');
        this.router.navigate(['/superadmin/tenants']);
      },
      error: () => this.toast.error('Failed to delete'),
    });
  }

  // ─── Subscription Management ──────────────────────────

  startEditSubscription(): void {
    const sub = this.tenant()?.subscription;
    if (sub?.startDate && sub?.endDate) {
      const start = new Date(sub.startDate);
      const end = new Date(sub.endDate);
      const diffMs = end.getTime() - start.getTime();
      this.subEditMonths = Math.max(1, Math.round(diffMs / (30.44 * 24 * 60 * 60 * 1000)));
    } else {
      this.subEditMonths = 1;
    }
    this.editingSubscription.set(true);
  }

  saveSubscription(): void {
    const tenant = this.tenant();
    if (!tenant) return;
    this.api.updateSubscription(tenant.id, { months: this.subEditMonths }).subscribe({
      next: () => {
        this.toast.success('Subscription updated');
        this.editingSubscription.set(false);
        this.load(tenant.id);
      },
      error: () => this.toast.error('Failed to update subscription'),
    });
  }

  deleteSubscription(): void {
    const tenant = this.tenant();
    if (!tenant) return;
    if (!confirm(`Delete all subscriptions for "${tenant.name}"? Revenue will be recalculated.`)) return;
    this.api.deleteSubscription(tenant.id).subscribe({
      next: () => {
        this.toast.success('Subscription deleted — revenue recalculated');
        this.load(tenant.id);
      },
      error: () => this.toast.error('Failed to delete subscription'),
    });
  }

  deleteInvoice(inv: PlatformInvoice): void {
    if (!confirm(`Delete invoice ${inv.invoiceNumber}?`)) return;
    this.api.deleteInvoice(inv.id).subscribe({
      next: () => {
        this.toast.success('Invoice deleted');
        if (this.tenant()) this.loadInvoices();
      },
      error: () => this.toast.error('Failed to delete invoice'),
    });
  }

  // ─── Invoice PDF (print-based) ───────────────────────

  printInvoice(inv: PlatformInvoice): void {
    const tenant = this.tenant();
    if (!inv || !tenant) return;

    const html = `<!DOCTYPE html>
<html><head>
  <title>Invoice ${inv.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; color: #1e293b; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    .brand-bar { background: #000; color: #fff; padding: 16px 40px; display: flex; justify-content: space-between; align-items: center; }
    .brand-bar .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .brand-bar .logo span { color: #818cf8; }
    .brand-bar .company { text-align: right; font-size: 11px; color: #a1a1aa; line-height: 1.6; }
    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 30px 0; border-bottom: 1px solid #e2e8f0; }
    .invoice-header .title { font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -1px; }
    .invoice-header .number { font-size: 14px; color: #64748b; margin-top: 4px; }
    .invoice-header .date-block { text-align: right; }
    .invoice-header .date-block .date { font-size: 14px; color: #0f172a; font-weight: 600; }
    .invoice-header .date-block .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 30px 0; }
    .section-label { font-size: 10px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 12px; }
    .info-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
    .info-row .label { color: #64748b; }
    .info-row .value { color: #0f172a; font-weight: 500; }
    .line-items { border-top: 2px solid #0f172a; margin-top: 10px; }
    .line-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .line-item.discount { color: #dc2626; }
    .total-row { display: flex; justify-content: space-between; padding: 16px 0; border-top: 2px solid #0f172a; margin-top: 8px; font-size: 20px; font-weight: 800; }
    .total-row .amount { color: #4f46e5; }
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-unpaid { background: #fee2e2; color: #991b1b; }
    .footer-bar { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px; margin-top: 40px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8; }
    .footer-bar a { color: #6366f1; text-decoration: none; }
    @media print { body { margin: 0; } .page { padding: 20px; } .brand-bar, .footer-bar { padding-left: 20px; padding-right: 20px; } }
  </style>
</head><body>
  <div class="brand-bar">
    <div class="logo">Mobily<span>tics</span></div>
    <div class="company">Powered by Nova Node<br>mobilytics.app | novanode.dev</div>
  </div>
  <div class="page">
    <div class="invoice-header">
      <div>
        <div class="title">INVOICE</div>
        <div class="number">${inv.invoiceNumber}</div>
      </div>
      <div class="date-block">
        <div class="label">Issue Date</div>
        <div class="date">${new Date(inv.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>
    <div class="grid">
      <div>
        <div class="section-label">Bill To</div>
        <div class="info-row"><span class="label">Store</span><span class="value">${tenant.name}</span></div>
        <div class="info-row"><span class="label">Slug</span><span class="value">${tenant.slug}</span></div>
        ${tenant.owner ? `<div class="info-row"><span class="label">Owner</span><span class="value">${tenant.owner.name}</span></div>` : ''}
        ${tenant.owner ? `<div class="info-row"><span class="label">Email</span><span class="value">${tenant.owner.email}</span></div>` : ''}
        ${tenant.supportPhone ? `<div class="info-row"><span class="label">Phone</span><span class="value">${tenant.supportPhone}</span></div>` : ''}
      </div>
      <div>
        <div class="section-label">Invoice Details</div>
        <div class="info-row"><span class="label">Type</span><span class="value">${inv.invoiceType}</span></div>
        <div class="info-row"><span class="label">Plan</span><span class="value">${inv.planName || '\u2014'}</span></div>
        <div class="info-row"><span class="label">Duration</span><span class="value">${inv.months} month(s)</span></div>
        <div class="info-row"><span class="label">Payment</span><span class="value">${inv.paymentMethod}</span></div>
        <div class="info-row"><span class="label">Status</span><span class="status-badge ${inv.paymentStatus === 'Paid' ? 'status-paid' : 'status-unpaid'}">${inv.paymentStatus}</span></div>
      </div>
    </div>
    <div class="line-items">
      <div class="line-item"><span>Activation Fee</span><span>${inv.activationFee.toLocaleString()} EGP</span></div>
      <div class="line-item"><span>Subscription Amount (${inv.months} mo)</span><span>${inv.subscriptionAmount.toLocaleString()} EGP</span></div>
      ${inv.discount > 0 ? `<div class="line-item discount"><span>Discount</span><span>-${inv.discount.toLocaleString()} EGP</span></div>` : ''}
      <div class="total-row"><span>TOTAL DUE</span><span class="amount">${inv.total.toLocaleString()} EGP</span></div>
    </div>
    ${inv.notes ? `<div style="margin-top:20px;padding:16px;background:#fffbeb;border-radius:8px;font-size:13px;color:#92400e;"><strong>Notes:</strong> ${inv.notes}</div>` : ''}
  </div>
  <div class="footer-bar">
    <div>Mobilytics &mdash; SaaS Store Management Platform by <strong>Nova Node</strong></div>
    <div>Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} &bull; <a href="https://mobilytics.app">mobilytics.app</a></div>
  </div>
</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
  }

  // ─── WhatsApp Sharing ────────────────────────────────

  sendInvoiceWhatsApp(inv: PlatformInvoice): void {
    const tenant = this.tenant();
    if (!inv || !tenant) return;

    const msg = encodeURIComponent(
      `\u{1F4C4} Invoice: ${inv.invoiceNumber}\n` +
      `\u{1F3EA} Store: ${tenant.name} (${tenant.slug})\n` +
      `\u{1F4B0} Total: ${inv.total.toLocaleString()} EGP\n` +
      `\u{1F4CB} Type: ${inv.invoiceType}\n` +
      `\u{1F4B3} Payment: ${inv.paymentMethod} \u2014 ${inv.paymentStatus}\n` +
      `\u{1F4C5} Date: ${new Date(inv.createdAt).toLocaleDateString()}\n` +
      `\nActivation Fee: ${inv.activationFee.toLocaleString()} EGP\n` +
      `Subscription: ${inv.subscriptionAmount.toLocaleString()} EGP\n` +
      (inv.discount > 0 ? `Discount: -${inv.discount.toLocaleString()} EGP\n` : '')
    );
    const phone = tenant.owner?.whatsApp || tenant.owner?.phone || tenant.supportWhatsApp || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  }

  // ─── JSON Helpers ─────────────────────────────────

  countJsonArray(json?: string): number {
    if (!json) return 0;
    try { const arr = JSON.parse(json); return Array.isArray(arr) ? arr.length : 0; }
    catch { return 0; }
  }

  getPolicyKeys(json?: string): string {
    if (!json) return 'None';
    try { return Object.keys(JSON.parse(json)).join(', '); }
    catch { return 'Invalid JSON'; }
  }

  formatJsonField(field: keyof UpdateStoreSettingsRequest): void {
    const val = this.settingsForm[field];
    if (typeof val !== 'string' || !val) return;
    try { (this.settingsForm as any)[field] = JSON.stringify(JSON.parse(val), null, 2); }
    catch { this.toast.error('Invalid JSON — cannot format'); }
  }

  sendCredentialsWhatsApp(): void {
    const tenant = this.tenant();
    if (!tenant) return;

    const storeUrl = `https://${environment.appDomain}/store?tenant=${tenant.slug}`;
    const adminUrl = `https://${environment.appDomain}/admin/login?tenant=${tenant.slug}`;

    const msg = encodeURIComponent(
      `\u{1F389} Welcome to Mobilytics!\n\n` +
      `\u{1F3EA} Store: ${tenant.name}\n` +
      `\u{1F517} Store URL: ${storeUrl}\n` +
      `\u{1F511} Admin Panel: ${adminUrl}\n\n` +
      `\u{1F4E7} Email: ${tenant.owner?.email || 'N/A'}\n` +
      `\u{1F512} Password: (as set during onboarding)\n\n` +
      `Please change your password after first login.`
    );
    const phone = tenant.owner?.whatsApp || tenant.owner?.phone || tenant.supportWhatsApp || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  }
}
