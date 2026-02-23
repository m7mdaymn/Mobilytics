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
    <div class="max-w-4xl mx-auto space-y-6">
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

        <!-- Info Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Basic Info -->
          <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
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
          <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
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

        <!-- Subscription Card -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 class="font-semibold text-slate-800">Subscription</h3>
            <a routerLink="/superadmin/subscriptions" [queryParams]="{ tenantId: tenant()!.id }" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Manage</a>
          </div>
          @if (tenant()!.subscription) {
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p class="text-slate-500 text-xs uppercase">Plan</p>
                <p class="font-medium text-slate-800">{{ tenant()!.subscription!.planName }}</p>
              </div>
              <div>
                <p class="text-slate-500 text-xs uppercase">Status</p>
                <span class="text-xs px-2 py-1 rounded-full"
                  [class]="tenant()!.subscription!.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                           tenant()!.subscription!.status === 'Trial' ? 'bg-blue-100 text-blue-700' :
                           tenant()!.subscription!.status === 'Grace' ? 'bg-orange-100 text-orange-700' :
                           'bg-slate-100 text-slate-600'">
                  {{ tenant()!.subscription!.status }}
                </span>
              </div>
              <div>
                <p class="text-slate-500 text-xs uppercase">Start Date</p>
                <p class="text-slate-800">{{ tenant()!.subscription!.startDate | date:'mediumDate' }}</p>
              </div>
              <div>
                <p class="text-slate-500 text-xs uppercase">End Date</p>
                <p class="text-slate-800">{{ tenant()!.subscription!.endDate | date:'mediumDate' }}</p>
              </div>
            </div>
          } @else {
            <div class="text-center py-6">
              <p class="text-slate-400 mb-4">No active subscription</p>
              <a routerLink="/superadmin/subscriptions" [queryParams]="{ tenantId: tenant()!.id }" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Start Subscription</a>
            </div>
          }
        </div>

        <!-- ═══ STORE SETTINGS EDITOR ═══ -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 class="font-semibold text-slate-800">Store Settings</h3>
            @if (!editingSettings()) {
              <button (click)="startEditSettings()" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
            }
          </div>

          @if (editingSettings() && settingsForm) {
            <!-- Edit Mode -->
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
                <label class="block text-sm font-medium text-slate-700 mb-1">Theme ID</label>
                <select [(ngModel)]="settingsForm.themePresetId" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option [ngValue]="1">1 — Midnight Pro</option>
                  <option [ngValue]="2">2 — Ocean Blue</option>
                  <option [ngValue]="3">3 — Forest Green</option>
                  <option [ngValue]="4">4 — Royal Purple</option>
                  <option [ngValue]="5">5 — Sunset Orange</option>
                  <option [ngValue]="6">6 — Slate Minimal</option>
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
                <label class="block text-sm font-medium text-slate-700 mb-1">Social Links (JSON)</label>
                <textarea [(ngModel)]="settingsForm.socialLinksJson" rows="2" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" placeholder='{"facebook":"...","instagram":"..."}'></textarea>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">Policies (JSON)</label>
                <textarea [(ngModel)]="settingsForm.policiesJson" rows="2" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" placeholder='{"return":"...","privacy":"..."}'></textarea>
              </div>
            </div>

            @if (settingsError()) {
              <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{{ settingsError() }}</div>
            }

            <div class="flex gap-3 pt-2">
              <button (click)="saveSettings()" [disabled]="savingSettings()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {{ savingSettings() ? 'Saving...' : 'Save Settings' }}
              </button>
              <button (click)="cancelEditSettings()" class="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          } @else {
            <!-- Read Mode -->
            @if (tenant()!.storeSettings) {
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><span class="text-slate-500">Store Name:</span> <span class="font-medium">{{ tenant()!.storeSettings!.storeName }}</span></div>
                @if (tenant()!.storeSettings!.logoUrl) {
                  <div><span class="text-slate-500">Logo:</span> <img [src]="tenant()!.storeSettings!.logoUrl!" class="h-8 inline-block ml-1 rounded" /></div>
                }
                <div><span class="text-slate-500">Currency:</span> {{ tenant()!.storeSettings!.currencyCode }}</div>
                <div><span class="text-slate-500">Theme:</span> Preset #{{ tenant()!.storeSettings!.themePresetId }}</div>
                @if (tenant()!.storeSettings!.phoneNumber) {
                  <div><span class="text-slate-500">Phone:</span> {{ tenant()!.storeSettings!.phoneNumber }}</div>
                }
                @if (tenant()!.storeSettings!.whatsAppNumber) {
                  <div><span class="text-slate-500">WhatsApp:</span> {{ tenant()!.storeSettings!.whatsAppNumber }}</div>
                }
                @if (tenant()!.storeSettings!.footerAddress) {
                  <div class="col-span-2"><span class="text-slate-500">Address:</span> {{ tenant()!.storeSettings!.footerAddress }}</div>
                }
                @if (tenant()!.storeSettings!.workingHours) {
                  <div><span class="text-slate-500">Hours:</span> {{ tenant()!.storeSettings!.workingHours }}</div>
                }
                <div class="flex items-center gap-2"><span class="text-slate-500">Preset:</span>
                  <span class="text-sm font-medium">{{ tenant()!.storeSettings!.themePresetId }}</span>
                </div>
                @if (tenant()!.storeSettings!.mapUrl) {
                  <div><span class="text-slate-500">Map:</span> <a [href]="tenant()!.storeSettings!.mapUrl" target="_blank" class="text-indigo-600 hover:underline text-xs">View</a></div>
                }
              </div>
            } @else {
              <p class="text-slate-400 text-sm">No store settings configured. Click Edit to set them up.</p>
            }
          }
        </div>

        <!-- Access URLs -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 class="font-semibold text-slate-800 border-b border-slate-200 pb-2">Access URLs</h3>
          <div class="space-y-3 text-sm">
            <div class="bg-slate-50 rounded-lg p-3">
              <p class="text-xs text-slate-500 uppercase font-medium mb-1">Subdomain (Future)</p>
              <code class="text-indigo-600">https://{{ tenant()!.slug }}.mobilytics.com</code>
            </div>
            <div class="bg-slate-50 rounded-lg p-3">
              <p class="text-xs text-slate-500 uppercase font-medium mb-1">Vercel (Current)</p>
              <code class="text-indigo-600">https://{{ appDomain }}?tenant={{ tenant()!.slug }}</code>
            </div>
            <div class="bg-slate-50 rounded-lg p-3">
              <p class="text-xs text-slate-500 uppercase font-medium mb-1">Admin Panel</p>
              <code class="text-indigo-600">https://{{ appDomain }}/admin?tenant={{ tenant()!.slug }}</code>
            </div>
          </div>
        </div>

        <!-- ═══ INVOICES SECTION ═══ -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 class="font-semibold text-slate-800">Invoices</h3>
            <button (click)="loadInvoices()" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Refresh</button>
          </div>

          @if (loadingInvoices()) {
            <div class="flex justify-center py-4">
              <div class="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
          } @else if (invoices().length === 0) {
            <p class="text-slate-400 text-sm text-center py-4">No invoices found for this tenant.</p>
          } @else {
            @for (inv of invoices(); track inv.id) {
              <div class="bg-slate-50 rounded-xl p-5 space-y-3">
                <div class="grid grid-cols-2 gap-3 text-sm">
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
                </div>
              </div>
            }
          }
        </div>

        <!-- ═══ QUICK ACTION BUTTONS ═══ -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 class="font-semibold text-slate-800 border-b border-slate-200 pb-2">Quick Actions</h3>
          <div class="flex flex-wrap gap-3">
            <button (click)="sendCredentialsWhatsApp()" class="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.574-1.503A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.198 0-4.247-.6-6.008-1.64l-.43-.255-3.244 1.065 1.084-3.16-.278-.443A9.724 9.724 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/></svg>
              Send Credentials via WhatsApp
            </button>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-red-50 rounded-xl p-6 border border-red-200 space-y-4">
          <h3 class="font-semibold text-red-800">Danger Zone</h3>
          <p class="text-red-600 text-sm">Deleting a tenant will permanently remove all associated data.</p>
          <button (click)="deleteTenant()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Delete Tenant</button>
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
    };
    this.settingsError.set(null);
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

  // ─── Invoice PDF (print-based) ───────────────────────

  printInvoice(inv: PlatformInvoice): void {
    const tenant = this.tenant();
    if (!inv || !tenant) return;

    const html = `<!DOCTYPE html>
<html><head>
  <title>Invoice ${inv.invoiceNumber}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 40px; color: #1e293b; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 24px; margin: 0; }
    .header p { color: #64748b; margin: 4px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .section h3 { font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
    .section .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
    .section .row .label { color: #64748b; }
    .totals { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals .total-row { border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; font-size: 18px; font-weight: bold; }
    .footer { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 12px; }
    @media print { body { margin: 20px; } }
  </style>
</head><body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>${inv.invoiceNumber}</p>
    <p>${new Date(inv.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  <div class="grid">
    <div class="section">
      <h3>Bill To</h3>
      <div class="row"><span class="label">Store</span><span>${tenant.name}</span></div>
      <div class="row"><span class="label">Slug</span><span>${tenant.slug}</span></div>
      ${tenant.owner ? `<div class="row"><span class="label">Owner</span><span>${tenant.owner.name}</span></div>` : ''}
      ${tenant.owner ? `<div class="row"><span class="label">Email</span><span>${tenant.owner.email}</span></div>` : ''}
    </div>
    <div class="section">
      <h3>Invoice Details</h3>
      <div class="row"><span class="label">Type</span><span>${inv.invoiceType}</span></div>
      <div class="row"><span class="label">Plan</span><span>${inv.planName || '\u2014'}</span></div>
      <div class="row"><span class="label">Duration</span><span>${inv.months} month(s)</span></div>
      <div class="row"><span class="label">Payment</span><span>${inv.paymentMethod}</span></div>
      <div class="row"><span class="label">Status</span><span>${inv.paymentStatus}</span></div>
    </div>
  </div>
  <div class="totals">
    <div class="row"><span>Activation Fee</span><span>${inv.activationFee.toLocaleString()} EGP</span></div>
    <div class="row"><span>Subscription Amount</span><span>${inv.subscriptionAmount.toLocaleString()} EGP</span></div>
    ${inv.discount > 0 ? `<div class="row" style="color: #dc2626;"><span>Discount</span><span>-${inv.discount.toLocaleString()} EGP</span></div>` : ''}
    <div class="row total-row"><span>TOTAL</span><span>${inv.total.toLocaleString()} EGP</span></div>
  </div>
  <div class="footer">
    <p>Mobilytics Platform &mdash; Generated on ${new Date().toLocaleString()}</p>
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

  sendCredentialsWhatsApp(): void {
    const tenant = this.tenant();
    if (!tenant) return;

    const storeUrl = `https://${environment.appDomain}/store?tenant=${tenant.slug}`;
    const adminUrl = `https://${environment.appDomain}/admin?tenant=${tenant.slug}`;

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
