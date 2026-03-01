import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { OnboardTenantRequest, OnboardTenantResponse, Plan } from '../../../core/models/platform.models';
import { DatePipe, DecimalPipe } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-tenant-create',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe],
  template: `
    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <button (click)="goBack()" class="text-slate-500 hover:text-slate-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-slate-800">Onboard New Tenant</h1>
      </div>

      @if (result()) {
        <!-- ═══════════════════════════════════════════════ -->
        <!--  POST-CREATION SUMMARY                         -->
        <!-- ═══════════════════════════════════════════════ -->
        <div class="bg-white rounded-xl p-8 shadow-sm border border-slate-200 space-y-6">
          <!-- Success Header -->
          <div class="text-center space-y-3">
            <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-800">Tenant Onboarded Successfully!</h2>
            <p class="text-slate-500">{{ result()!.tenant.name }} is now live.</p>
          </div>

          <!-- Store Info Card -->
          <div class="bg-slate-50 rounded-xl p-5 space-y-3">
            <h3 class="font-semibold text-slate-800 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">Store Details</h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><span class="text-slate-500">Store Name:</span> <span class="font-medium">{{ result()!.tenant.name }}</span></div>
              <div><span class="text-slate-500">Slug:</span> <code class="text-indigo-600 font-mono">{{ result()!.tenant.slug }}</code></div>
              <div><span class="text-slate-500">Status:</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  [class]="result()!.tenant.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                  {{ result()!.tenant.status }}
                </span>
              </div>
              <div><span class="text-slate-500">Created:</span> {{ result()!.tenant.createdAt | date:'medium' }}</div>
              @if (result()!.tenant.supportPhone) {
                <div><span class="text-slate-500">Phone:</span> {{ result()!.tenant.supportPhone }}</div>
              }
              @if (result()!.tenant.supportWhatsApp) {
                <div><span class="text-slate-500">WhatsApp:</span> {{ result()!.tenant.supportWhatsApp }}</div>
              }
              @if (result()!.tenant.address) {
                <div class="col-span-2"><span class="text-slate-500">Address:</span> {{ result()!.tenant.address }}</div>
              }
              @if (result()!.tenant.storeSettings?.logoUrl) {
                <div class="col-span-2"><span class="text-slate-500">Logo:</span> <img [src]="result()!.tenant.storeSettings!.logoUrl" class="h-10 inline-block ml-2 rounded" /></div>
              }
            </div>
          </div>

          <!-- Owner Info Card -->
          @if (result()!.tenant.owner) {
            <div class="bg-slate-50 rounded-xl p-5 space-y-3">
              <h3 class="font-semibold text-slate-800 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">Owner Details</h3>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div><span class="text-slate-500">Name:</span> <span class="font-medium">{{ result()!.tenant.owner!.name }}</span></div>
                <div><span class="text-slate-500">Email:</span> {{ result()!.tenant.owner!.email }}</div>
                @if (result()!.tenant.owner!.phone) {
                  <div><span class="text-slate-500">Phone:</span> {{ result()!.tenant.owner!.phone }}</div>
                }
              </div>
            </div>
          }

          <!-- Subscription Info Card -->
          @if (result()!.tenant.subscription) {
            <div class="bg-slate-50 rounded-xl p-5 space-y-3">
              <h3 class="font-semibold text-slate-800 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">Subscription</h3>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div><span class="text-slate-500">Plan:</span> <span class="font-medium">{{ result()!.tenant.subscription!.planName }}</span></div>
                <div><span class="text-slate-500">Status:</span>
                  <span class="text-xs px-2 py-0.5 rounded-full"
                    [class]="result()!.tenant.subscription!.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                             result()!.tenant.subscription!.status === 'Trial' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'">
                    {{ result()!.tenant.subscription!.status }}
                  </span>
                </div>
                @if (result()!.tenant.subscription!.startDate) {
                  <div><span class="text-slate-500">Start:</span> {{ result()!.tenant.subscription!.startDate | date:'mediumDate' }}</div>
                }
                @if (result()!.tenant.subscription!.endDate) {
                  <div><span class="text-slate-500">End:</span> {{ result()!.tenant.subscription!.endDate | date:'mediumDate' }}</div>
                }
                @if (result()!.tenant.subscription!.trialEndsAt) {
                  <div><span class="text-slate-500">Trial Ends:</span> {{ result()!.tenant.subscription!.trialEndsAt | date:'mediumDate' }}</div>
                }
              </div>
            </div>
          }

          <!-- Invoice Card -->
          @if (result()!.invoice) {
            <div class="bg-slate-50 rounded-xl p-5 space-y-3" id="invoice-section">
              <h3 class="font-semibold text-slate-800 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">Invoice</h3>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div><span class="text-slate-500">Invoice #:</span> <span class="font-mono font-medium">{{ result()!.invoice!.invoiceNumber }}</span></div>
                <div><span class="text-slate-500">Type:</span> {{ result()!.invoice!.invoiceType }}</div>
                <div><span class="text-slate-500">Duration:</span> {{ result()!.invoice!.months }} month(s)</div>
                <div><span class="text-slate-500">Payment:</span> {{ result()!.invoice!.paymentMethod }}</div>
                <div><span class="text-slate-500">Status:</span>
                  <span class="text-xs px-2 py-0.5 rounded-full"
                    [class]="result()!.invoice!.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                    {{ result()!.invoice!.paymentStatus }}
                  </span>
                </div>
                <div><span class="text-slate-500">Date:</span> {{ result()!.invoice!.createdAt | date:'medium' }}</div>
              </div>
              <div class="bg-white rounded-lg p-3 space-y-2 text-sm mt-3">
                <div class="flex justify-between"><span class="text-slate-500">Activation Fee</span><span>{{ result()!.invoice!.activationFee | number:'1.0-0' }} EGP</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Subscription</span><span>{{ result()!.invoice!.subscriptionAmount | number:'1.0-0' }} EGP</span></div>
                @if (result()!.invoice!.discount > 0) {
                  <div class="flex justify-between text-red-600"><span>Discount</span><span>-{{ result()!.invoice!.discount | number:'1.0-0' }} EGP</span></div>
                }
                <div class="flex justify-between border-t border-slate-200 pt-2 font-bold text-base">
                  <span>Total</span>
                  <span class="text-indigo-600">{{ result()!.invoice!.total | number:'1.0-0' }} EGP</span>
                </div>
              </div>
            </div>
          }

          <!-- Access URLs -->
          <div class="bg-slate-50 rounded-xl p-5 space-y-3">
            <h3 class="font-semibold text-slate-800 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">Access URLs</h3>
            <div class="space-y-2 text-sm">
              <div class="bg-white rounded-lg p-3">
                <p class="text-xs text-slate-500 uppercase">Store URL</p>
                <code class="text-indigo-600">https://{{ appDomain }}/store?tenant={{ result()!.tenant.slug }}</code>
              </div>
              <div class="bg-white rounded-lg p-3">
                <p class="text-xs text-slate-500 uppercase">Admin Panel</p>
                <code class="text-indigo-600">https://{{ appDomain }}/admin?tenant={{ result()!.tenant.slug }}</code>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-3 justify-center pt-2 border-t border-slate-200">
            @if (result()!.invoice) {
              <button (click)="printInvoice()" class="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                Print Invoice PDF
              </button>
              <button (click)="sendInvoiceWhatsApp()" class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.574-1.503A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.198 0-4.247-.6-6.008-1.64l-.43-.255-3.244 1.065 1.084-3.16-.278-.443A9.724 9.724 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/></svg>
                Send Invoice via WhatsApp
              </button>
            }
            <button (click)="sendCredentialsWhatsApp()" class="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.574-1.503A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.198 0-4.247-.6-6.008-1.64l-.43-.255-3.244 1.065 1.084-3.16-.278-.443A9.724 9.724 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/></svg>
              Send Credentials via WhatsApp
            </button>
            <button (click)="resetForm()" class="bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium">Onboard Another</button>
            <button (click)="goToList()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">View All Tenants</button>
          </div>
        </div>
      } @else {
        <!-- ═══ STEP INDICATORS ═══ -->
        <div class="flex items-center justify-between max-w-md mx-auto">
          @for (s of steps; track s.num) {
            <div class="flex flex-col items-center gap-1">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                [class]="step() >= s.num ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'">
                {{ s.num }}
              </div>
              <span class="text-xs text-slate-500">{{ s.label }}</span>
            </div>
            @if (s.num < 4) {
              <div class="flex-1 h-0.5 mx-2" [class]="step() > s.num ? 'bg-indigo-600' : 'bg-slate-200'"></div>
            }
          }
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-6">
          <!-- ═══ STEP 1: STORE INFO ═══ -->
          @if (step() === 1) {
            <h2 class="text-lg font-semibold text-slate-800">Store Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">Store Name <span class="text-red-500">*</span></label>
                <input [(ngModel)]="form.storeName" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="TechHub Electronics" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">Slug <span class="text-red-500">*</span></label>
                <div class="flex items-center gap-2">
                  <code class="text-sm text-slate-400">https://</code>
                  <input [(ngModel)]="form.slug" (ngModelChange)="normalizeSlug()" class="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="techhub" />
                  <code class="text-sm text-slate-400">.mobilytics.com</code>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input [(ngModel)]="form.storePhone" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="+201000000000" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                <input [(ngModel)]="form.storeWhatsApp" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="+201000000000" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input [(ngModel)]="form.address" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="123 Main St, Cairo" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
                <input [(ngModel)]="form.logoUrl" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="https://example.com/logo.png" />
                @if (form.logoUrl) {
                  <img [src]="form.logoUrl" class="mt-2 h-12 rounded border border-slate-200" alt="Logo preview" />
                }
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">Google Maps URL</label>
                <input [(ngModel)]="form.mapUrl" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="https://maps.google.com/..." />
              </div>
              <!-- Theme, Currency, Hours -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Theme</label>
                <select [(ngModel)]="form.themePresetId" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white">
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
                <label class="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                <input [(ngModel)]="form.currencyCode" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="EGP" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">Working Hours</label>
                <input [(ngModel)]="form.workingHours" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="9:00 AM - 10:00 PM" />
              </div>
              <!-- Social Links -->
              <div class="md:col-span-2 space-y-3">
                <label class="block text-sm font-medium text-slate-700">Social Links</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs text-slate-500">Facebook</label>
                    <input [(ngModel)]="socialLinks.facebook" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="https://facebook.com/..." />
                  </div>
                  <div>
                    <label class="text-xs text-slate-500">Instagram</label>
                    <input [(ngModel)]="socialLinks.instagram" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="https://instagram.com/..." />
                  </div>
                  <div>
                    <label class="text-xs text-slate-500">TikTok</label>
                    <input [(ngModel)]="socialLinks.tiktok" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="https://tiktok.com/@..." />
                  </div>
                  <div>
                    <label class="text-xs text-slate-500">Twitter / X</label>
                    <input [(ngModel)]="socialLinks.twitter" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="https://x.com/..." />
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- ═══ STEP 2: OWNER INFO ═══ -->
          @if (step() === 2) {
            <h2 class="text-lg font-semibold text-slate-800">Owner Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Owner Name <span class="text-red-500">*</span></label>
                <input [(ngModel)]="form.ownerName" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ahmed Hassan" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Owner Email <span class="text-red-500">*</span></label>
                <input type="email" [(ngModel)]="form.ownerEmail" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="owner@store.com" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Owner Phone</label>
                <input [(ngModel)]="form.ownerPhone" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="+201000000000" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Owner WhatsApp</label>
                <input [(ngModel)]="form.ownerWhatsApp" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="+201000000000" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Password <span class="text-red-500">*</span></label>
                <input type="password" [(ngModel)]="form.ownerPassword" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Min 6 characters" />
                <p class="text-xs text-slate-500 mt-1">Min 6 characters.</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Confirm Password <span class="text-red-500">*</span></label>
                <input type="password" [(ngModel)]="confirmPassword" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Re-enter password" />
                @if (confirmPassword && confirmPassword !== form.ownerPassword) {
                  <p class="text-xs text-red-500 mt-1">Passwords do not match.</p>
                }
              </div>
            </div>
          }

          <!-- ═══ STEP 3: PLAN & PAYMENT ═══ -->
          @if (step() === 3) {
            <h2 class="text-lg font-semibold text-slate-800">Plan & Payment</h2>
            @if (loadingPlans()) {
              <p class="text-slate-500 text-sm">Loading plans...</p>
            } @else {
              <!-- Plan Selection -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (plan of plans(); track plan.id) {
                  <button
                    (click)="selectPlan(plan)"
                    class="p-4 border-2 rounded-xl text-left transition-all"
                    [class]="form.planId === plan.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'"
                  >
                    <div class="font-semibold text-slate-800">{{ plan.name }}</div>
                    <div class="text-indigo-600 font-bold text-lg">{{ plan.priceMonthly | number:'1.0-0' }} EGP<span class="text-xs text-slate-500 font-normal">/mo</span></div>
                    <div class="text-xs text-slate-500 mt-1">Activation: {{ plan.activationFee | number:'1.0-0' }} EGP</div>
                  </button>
                }
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Duration (Months) <span class="text-red-500">*</span></label>
                  <input type="number" [(ngModel)]="form.durationMonths" min="1" max="24" (ngModelChange)="recalcTotal()" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
                </div>
                <div class="flex items-center gap-3">
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" [(ngModel)]="form.isTrial" class="sr-only peer" (ngModelChange)="recalcTotal()" />
                    <div class="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                  <span class="text-sm font-medium text-slate-700">Start as Trial</span>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Activation Fee Paid</label>
                  <input type="number" [(ngModel)]="form.activationFeePaid" min="0" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Subscription Paid
                    @if (calculatedSubscription() !== form.subscriptionAmountPaid) {
                      <button (click)="resetSubscriptionAmount()" class="text-xs text-indigo-600 hover:text-indigo-800 ml-2">(reset to {{ calculatedSubscription() | number:'1.0-0' }})</button>
                    }
                  </label>
                  <input type="number" [(ngModel)]="form.subscriptionAmountPaid" min="0" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
                  <p class="text-xs text-slate-400 mt-1">Auto: {{ calculatedSubscription() | number:'1.0-0' }} EGP ({{ selectedPlanPrice() | number:'1.0-0' }} × {{ form.durationMonths }} mo)</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Discount</label>
                  <input type="number" [(ngModel)]="form.discount" min="0" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                  <select [(ngModel)]="form.paymentMethod" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white">
                    <option value="Cash">Cash</option>
                    <option value="Instapay">Instapay</option>
                    <option value="BankTransfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <input [(ngModel)]="form.paymentNotes" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="Payment reference..." />
                </div>
              </div>

              <!-- Total Summary -->
              <div class="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-slate-500">Activation Fee</span><span class="font-medium">{{ form.activationFeePaid | number:'1.0-0' }} EGP</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Subscription ({{ form.durationMonths }} mo)</span><span class="font-medium">{{ form.subscriptionAmountPaid | number:'1.0-0' }} EGP</span></div>
                @if (form.discount > 0) {
                  <div class="flex justify-between text-red-600"><span>Discount</span><span>-{{ form.discount | number:'1.0-0' }} EGP</span></div>
                }
                <div class="flex justify-between border-t border-slate-300 pt-2 font-bold text-base"><span>Total</span><span class="text-indigo-600">{{ computedTotal() | number:'1.0-0' }} EGP</span></div>
              </div>
            }
          }

          <!-- ═══ STEP 4: REVIEW ═══ -->
          @if (step() === 4) {
            <h2 class="text-lg font-semibold text-slate-800">Review & Confirm</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div class="space-y-3">
                <h3 class="font-semibold text-slate-700 uppercase text-xs tracking-wide">Store</h3>
                <div><span class="text-slate-500">Name:</span> {{ form.storeName }}</div>
                <div><span class="text-slate-500">Slug:</span> <code class="font-mono text-indigo-600">{{ form.slug }}</code></div>
                @if (form.storePhone) { <div><span class="text-slate-500">Phone:</span> {{ form.storePhone }}</div> }
                @if (form.storeWhatsApp) { <div><span class="text-slate-500">WhatsApp:</span> {{ form.storeWhatsApp }}</div> }
                @if (form.address) { <div><span class="text-slate-500">Address:</span> {{ form.address }}</div> }
                @if (form.logoUrl) { <div><span class="text-slate-500">Logo:</span> <img [src]="form.logoUrl" class="h-8 inline-block ml-1 rounded" /></div> }
                @if (form.mapUrl) { <div><span class="text-slate-500">Maps:</span> <span class="text-indigo-600 text-xs break-all">{{ form.mapUrl }}</span></div> }
                @if (hasSocialLinks()) { <div><span class="text-slate-500">Social:</span> {{ socialLinksSummary() }}</div> }
                <div><span class="text-slate-500">Theme:</span> Preset #{{ form.themePresetId }}</div>
                <div><span class="text-slate-500">Currency:</span> {{ form.currencyCode }}</div>
                @if (form.workingHours) { <div><span class="text-slate-500">Hours:</span> {{ form.workingHours }}</div> }
              </div>
              <div class="space-y-3">
                <h3 class="font-semibold text-slate-700 uppercase text-xs tracking-wide">Owner</h3>
                <div><span class="text-slate-500">Name:</span> {{ form.ownerName }}</div>
                <div><span class="text-slate-500">Email:</span> {{ form.ownerEmail }}</div>
                @if (form.ownerPhone) { <div><span class="text-slate-500">Phone:</span> {{ form.ownerPhone }}</div> }
                @if (form.ownerWhatsApp) { <div><span class="text-slate-500">WhatsApp:</span> {{ form.ownerWhatsApp }}</div> }
              </div>
              <div class="space-y-3 md:col-span-2">
                <h3 class="font-semibold text-slate-700 uppercase text-xs tracking-wide">Plan & Payment</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><span class="text-slate-500">Plan:</span> {{ selectedPlanName() }}</div>
                  <div><span class="text-slate-500">Duration:</span> {{ form.durationMonths }} months</div>
                  <div><span class="text-slate-500">Trial:</span> {{ form.isTrial ? 'Yes' : 'No' }}</div>
                  <div><span class="text-slate-500">Payment:</span> {{ form.paymentMethod }}</div>
                </div>
                <div class="bg-indigo-50 rounded-lg p-3 flex justify-between items-center">
                  <span class="font-medium text-slate-700">Total Invoice Amount</span>
                  <span class="text-xl font-bold text-indigo-600">{{ computedTotal() | number:'1.0-0' }} EGP</span>
                </div>
              </div>
            </div>
          }

          @if (error()) {
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{{ error() }}</div>
          }

          <!-- Navigation Buttons -->
          <div class="flex justify-between pt-4 border-t border-slate-200">
            <button
              (click)="step() === 1 ? goBack() : prevStep()"
              class="bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-lg text-sm font-medium"
            >
              {{ step() === 1 ? 'Cancel' : 'Back' }}
            </button>
            @if (step() < 4) {
              <button (click)="nextStep()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
                Next
              </button>
            } @else {
              <button (click)="submit()" [disabled]="saving()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                {{ saving() ? 'Onboarding...' : 'Confirm & Onboard' }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class TenantCreateComponent implements OnInit {
  private readonly api = inject(PlatformApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly appDomain = environment.appDomain;

  readonly step = signal(1);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<OnboardTenantResponse | null>(null);
  readonly plans = signal<Plan[]>([]);
  readonly loadingPlans = signal(false);

  readonly steps = [
    { num: 1, label: 'Store' },
    { num: 2, label: 'Owner' },
    { num: 3, label: 'Plan' },
    { num: 4, label: 'Review' },
  ];

  form: OnboardTenantRequest = {
    storeName: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    planId: '',
    durationMonths: 1,
    isTrial: false,
    activationFeePaid: 0,
    subscriptionAmountPaid: 0,
    discount: 0,
    paymentMethod: 'Cash',
    themePresetId: 1,
    currencyCode: 'EGP',
  };

  confirmPassword = '';

  socialLinks = {
    facebook: '',
    instagram: '',
    tiktok: '',
    twitter: '',
  };

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loadingPlans.set(true);
    this.api.getPlans().subscribe({
      next: plans => {
        this.plans.set(plans.filter(p => p.isActive));
        this.loadingPlans.set(false);
      },
      error: () => this.loadingPlans.set(false),
    });
  }

  selectPlan(plan: Plan): void {
    this.form.planId = plan.id;
    this.form.activationFeePaid = plan.activationFee;
    this.form.subscriptionAmountPaid = plan.priceMonthly * this.form.durationMonths;
    // Auto-toggle trial mode for zero-cost plans
    if (plan.priceMonthly === 0 && plan.activationFee === 0) {
      this.form.isTrial = true;
    }
  }

  recalcTotal(): void {
    // Only auto-recalculate when duration or plan changes (called from duration input)
    const plan = this.plans().find(p => p.id === this.form.planId);
    if (plan) {
      this.form.subscriptionAmountPaid = plan.priceMonthly * this.form.durationMonths;
    }
  }

  calculatedSubscription(): number {
    const plan = this.plans().find(p => p.id === this.form.planId);
    return plan ? plan.priceMonthly * this.form.durationMonths : 0;
  }

  selectedPlanPrice(): number {
    return this.plans().find(p => p.id === this.form.planId)?.priceMonthly ?? 0;
  }

  resetSubscriptionAmount(): void {
    this.form.subscriptionAmountPaid = this.calculatedSubscription();
  }

  computedTotal(): number {
    return this.form.activationFeePaid + this.form.subscriptionAmountPaid - this.form.discount;
  }

  selectedPlanName(): string {
    return this.plans().find(p => p.id === this.form.planId)?.name ?? '—';
  }

  normalizeSlug(): void {
    this.form.slug = this.form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  }

  hasSocialLinks(): boolean {
    return !!(this.socialLinks.facebook || this.socialLinks.instagram || this.socialLinks.tiktok || this.socialLinks.twitter);
  }

  socialLinksSummary(): string {
    const links: string[] = [];
    if (this.socialLinks.facebook) links.push('Facebook');
    if (this.socialLinks.instagram) links.push('Instagram');
    if (this.socialLinks.tiktok) links.push('TikTok');
    if (this.socialLinks.twitter) links.push('Twitter/X');
    return links.join(', ');
  }

  private buildSocialLinksJson(): string | undefined {
    if (!this.hasSocialLinks()) return undefined;
    const obj: Record<string, string> = {};
    if (this.socialLinks.facebook) obj['facebook'] = this.socialLinks.facebook;
    if (this.socialLinks.instagram) obj['instagram'] = this.socialLinks.instagram;
    if (this.socialLinks.tiktok) obj['tiktok'] = this.socialLinks.tiktok;
    if (this.socialLinks.twitter) obj['twitter'] = this.socialLinks.twitter;
    return JSON.stringify(obj);
  }

  nextStep(): void {
    this.error.set(null);
    if (this.step() === 1 && (!this.form.storeName || !this.form.slug)) {
      this.error.set('Store Name and Slug are required.');
      return;
    }
    if (this.step() === 2) {
      if (!this.form.ownerName || !this.form.ownerEmail || !this.form.ownerPassword) {
        this.error.set('Owner Name, Email, and Password are required.');
        return;
      }
      if (this.form.ownerPassword.length < 6) {
        this.error.set('Password must be at least 6 characters.');
        return;
      }
      if (this.confirmPassword !== this.form.ownerPassword) {
        this.error.set('Passwords do not match.');
        return;
      }
    }
    if (this.step() === 3 && !this.form.planId) {
      this.error.set('Please select a plan.');
      return;
    }
    this.step.update(s => s + 1);
  }

  prevStep(): void {
    this.error.set(null);
    this.step.update(s => s - 1);
  }

  submit(): void {
    this.saving.set(true);
    this.error.set(null);
    this.form.socialLinksJson = this.buildSocialLinksJson();
    this.api.onboardTenant(this.form).subscribe({
      next: res => {
        this.saving.set(false);
        this.result.set(res);
        this.toast.success('Tenant onboarded successfully!');
      },
      error: (err: any) => {
        this.saving.set(false);
        let msg = err?.message || 'Failed to onboard tenant';
        // If errors is an array of strings, append them
        if (Array.isArray(err?.errors)) {
          msg = err.errors.join(', ') || msg;
        }
        // If errors is a Record<string, string[]> (ProblemDetails), flatten
        else if (err?.errors && typeof err.errors === 'object') {
          const flat = Object.values(err.errors as Record<string, string[]>).flat();
          if (flat.length) msg = flat.join(', ');
        }
        this.error.set(msg);
      },
    });
  }

  // ─── Invoice PDF (print-based) ───────────────────────

  printInvoice(): void {
    const inv = this.result()?.invoice;
    const tenant = this.result()?.tenant;
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

  sendInvoiceWhatsApp(): void {
    const inv = this.result()?.invoice;
    const tenant = this.result()?.tenant;
    if (!inv || !tenant) return;

    const msg = encodeURIComponent(
      `📄 Invoice: ${inv.invoiceNumber}\n` +
      `🏪 Store: ${tenant.name} (${tenant.slug})\n` +
      `💰 Total: ${inv.total.toLocaleString()} EGP\n` +
      `📋 Type: ${inv.invoiceType}\n` +
      `💳 Payment: ${inv.paymentMethod} — ${inv.paymentStatus}\n` +
      `📅 Date: ${new Date(inv.createdAt).toLocaleDateString()}\n` +
      `\nActivation Fee: ${inv.activationFee.toLocaleString()} EGP\n` +
      `Subscription: ${inv.subscriptionAmount.toLocaleString()} EGP\n` +
      (inv.discount > 0 ? `Discount: -${inv.discount.toLocaleString()} EGP\n` : '')
    );
    const phone = this.form.ownerWhatsApp || this.form.ownerPhone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  }

  sendCredentialsWhatsApp(): void {
    const tenant = this.result()?.tenant;
    if (!tenant) return;

    const storeUrl = `https://${environment.appDomain}/store?tenant=${tenant.slug}`;
    const adminUrl = `https://${environment.appDomain}/admin?tenant=${tenant.slug}`;

    const msg = encodeURIComponent(
      `🎉 Welcome to Mobilytics!\n\n` +
      `🏪 Store: ${tenant.name}\n` +
      `🔗 Store URL: ${storeUrl}\n` +
      `🔑 Admin Panel: ${adminUrl}\n\n` +
      `📧 Email: ${this.form.ownerEmail}\n` +
      `🔒 Password: ${this.form.ownerPassword}\n\n` +
      `Please change your password after first login.`
    );
    const phone = this.form.ownerWhatsApp || this.form.ownerPhone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  }

  resetForm(): void {
    this.form = {
      storeName: '', slug: '', ownerName: '', ownerEmail: '', ownerPassword: '',
      planId: '', durationMonths: 1, isTrial: false,
      activationFeePaid: 0, subscriptionAmountPaid: 0, discount: 0, paymentMethod: 'Cash',
      themePresetId: 1, currencyCode: 'EGP',
    };
    this.confirmPassword = '';
    this.socialLinks = { facebook: '', instagram: '', tiktok: '', twitter: '' };
    this.result.set(null);
    this.error.set(null);
    this.step.set(1);
  }

  goBack(): void {
    this.router.navigate(['/superadmin/tenants']);
  }

  goToList(): void {
    this.router.navigate(['/superadmin/tenants']);
  }
}
