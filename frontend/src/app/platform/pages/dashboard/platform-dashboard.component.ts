import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { PlatformDashboard, TenantRevenueBreakdown } from '../../../core/models/platform.models';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule],
  template: `
    <div class="space-y-6 max-w-[1440px] mx-auto">

      <!-- ═══ Header ═══ -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-black tracking-tight">{{ i18n.t('platform.nav.dashboard') }}</h1>
          <p class="text-sm text-neutral-500 mt-0.5">{{ greeting() }} — {{ today | date:'fullDate' }}</p>
        </div>
        <div class="flex items-center gap-2">
          @for (opt of rangeOptions; track opt.value) {
            <button (click)="range = opt.value; load()"
              class="text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all"
              [class]="range === opt.value
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-600 border-neutral-300 hover:border-black'">
              {{ opt.label }}
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <!-- Skeleton loader -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for(_ of [1,2,3,4]; track _) {
            <div class="bg-white rounded-2xl p-5 border border-neutral-200 animate-pulse">
              <div class="h-4 bg-neutral-200 rounded w-20 mb-3"></div>
              <div class="h-8 bg-neutral-200 rounded w-16 mb-2"></div>
              <div class="h-3 bg-neutral-100 rounded w-24"></div>
            </div>
          }
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for(_ of [1,2,3]; track _) {
            <div class="bg-white rounded-2xl p-6 border border-neutral-200 animate-pulse h-40"></div>
          }
        </div>
      } @else if (error()) {
        <!-- Error state -->
        <div class="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div class="text-4xl mb-3">⚠️</div>
          <p class="text-red-800 font-semibold text-lg">Failed to load dashboard</p>
          <p class="text-red-600 text-sm mt-1 mb-4">{{ error() }}</p>
          <button (click)="load()" class="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
            Retry
          </button>
        </div>
      } @else if (dashboard()) {

        <!-- ═══ Revenue Hero Banner ═══ -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Monthly Revenue - Hero Card -->
          <div class="lg:col-span-2 bg-black rounded-2xl p-6 text-white relative overflow-hidden">
            <div class="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full"></div>
            <div class="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full"></div>
            <div class="relative z-10">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <p class="text-neutral-400 text-sm font-medium uppercase tracking-wider">{{ i18n.t('platform.monthlyRevenue') }}</p>
              </div>
              <p class="text-4xl lg:text-5xl font-black mt-2 tracking-tight">{{ dashboard()!.monthlyRevenue | number:'1.0-0' }}
                <span class="text-lg font-medium text-neutral-400 ml-1">EGP</span>
              </p>
              <div class="flex items-center gap-6 mt-4 pt-4 border-t border-white/10">
                <div>
                  <p class="text-xs text-neutral-500 uppercase tracking-wider">Total All-Time</p>
                  <p class="text-xl font-bold mt-0.5">{{ dashboard()!.totalRevenue | number:'1.0-0' }} <span class="text-sm font-normal text-neutral-400">EGP</span></p>
                </div>
                <div class="w-px h-10 bg-white/10"></div>
                <div>
                  <p class="text-xs text-neutral-500 uppercase tracking-wider">Avg / Tenant</p>
                  <p class="text-xl font-bold mt-0.5">{{ avgRevenuePerTenant() | number:'1.0-0' }} <span class="text-sm font-normal text-neutral-400">EGP</span></p>
                </div>
              </div>
            </div>
          </div>

          <!-- Tenant Distribution Donut -->
          <div class="bg-white rounded-2xl p-6 border border-neutral-200">
            <p class="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-4">Tenant Overview</p>
            <div class="flex items-center justify-center">
              <div class="relative w-36 h-36">
                <!-- Donut ring via conic-gradient -->
                <div class="w-full h-full rounded-full"
                  [style.background]="donutGradient()">
                </div>
                <div class="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center">
                  <span class="text-3xl font-black text-black leading-none">{{ dashboard()!.totalTenants }}</span>
                  <span class="text-[10px] text-neutral-500 font-medium uppercase tracking-wider mt-0.5">Total</span>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-2 mt-5 text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-black"></span>
                <span class="text-neutral-600">Active</span>
                <span class="ml-auto font-bold text-black">{{ dashboard()!.activeTenants }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-neutral-400"></span>
                <span class="text-neutral-600">Trial</span>
                <span class="ml-auto font-bold text-black">{{ dashboard()!.trialTenants }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span class="text-neutral-600">Suspended</span>
                <span class="ml-auto font-bold text-black">{{ dashboard()!.suspendedTenants }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-neutral-200"></span>
                <span class="text-neutral-600">Expired</span>
                <span class="ml-auto font-bold text-black">{{ dashboard()!.expiredTenants }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ KPI Stat Cards ═══ -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
          @for (stat of statCards(); track stat.label) {
            <div class="group bg-white rounded-2xl p-5 border border-neutral-200 hover:border-neutral-400 hover:shadow-lg transition-all duration-200 cursor-default">
              <div class="flex items-center justify-between mb-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  [class]="stat.bgClass">
                  {{ stat.icon }}
                </div>
                @if (stat.route) {
                  <a [routerLink]="stat.route" class="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-black transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </a>
                }
              </div>
              <p class="text-2xl font-black text-black tracking-tight">{{ stat.value }}</p>
              <p class="text-xs text-neutral-500 font-medium mt-1">{{ stat.label }}</p>
              @if (stat.badge) {
                <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-2"
                  [class]="stat.badgeClass!">{{ stat.badge }}</span>
              }
            </div>
          }
        </div>

        <!-- ═══ Revenue Chart + Quick Actions Row ═══ -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Revenue Chart -->
          <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-neutral-200">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="font-bold text-black text-base">Revenue Trend</h2>
                <p class="text-xs text-neutral-500 mt-0.5">Last 6 months performance</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-neutral-500">Peak Month</p>
                <p class="text-sm font-bold text-black">{{ peakMonth() }}</p>
              </div>
            </div>
            @if (dashboard()!.revenueChart && dashboard()!.revenueChart.length > 0) {
              <div class="flex items-end gap-2 h-52">
                @for (point of dashboard()!.revenueChart; track point.label; let i = $index) {
                  <div class="flex-1 flex flex-col items-center gap-1.5 group/bar cursor-default">
                    <span class="text-[10px] text-neutral-400 font-semibold opacity-0 group-hover/bar:opacity-100 transition-opacity">
                      {{ point.amount | number:'1.0-0' }}
                    </span>
                    <div class="w-full rounded-xl transition-all duration-300 group-hover/bar:scale-105"
                      [style.height.%]="chartBarHeight(point.amount)"
                      [style.min-height.px]="6"
                      [class]="point.amount === maxRevenue()
                        ? 'bg-black shadow-lg shadow-black/20'
                        : 'bg-neutral-200 group-hover/bar:bg-neutral-400'">
                    </div>
                    <span class="text-[10px] text-neutral-500 font-medium mt-1">{{ chartLabel(point.label) }}</span>
                  </div>
                }
              </div>
            } @else {
              <div class="h-52 flex items-center justify-center text-neutral-400 text-sm">
                No revenue data available yet
              </div>
            }
          </div>

          <!-- Quick Actions Panel -->
          <div class="bg-white rounded-2xl p-6 border border-neutral-200 flex flex-col">
            <h2 class="font-bold text-black text-base mb-1">{{ i18n.t('common.quickActions') }}</h2>
            <p class="text-xs text-neutral-500 mb-5">Shortcuts to common tasks</p>
            <div class="flex flex-col gap-2.5 flex-1">
              <a routerLink="/superadmin/tenants/create"
                class="flex items-center gap-3 p-3.5 rounded-xl bg-black text-white hover:bg-neutral-800 transition-colors group">
                <div class="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-lg group-hover:bg-white/20 transition-colors">+</div>
                <div>
                  <p class="text-sm font-semibold">{{ i18n.t('platform.createTenant') }}</p>
                  <p class="text-xs text-neutral-400">Onboard a new store</p>
                </div>
              </a>
              <a routerLink="/superadmin/subscriptions"
                class="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-all group">
                <div class="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-lg group-hover:bg-neutral-200 transition-colors">📋</div>
                <div>
                  <p class="text-sm font-semibold text-black">{{ i18n.t('platform.manageSubscriptions') }}</p>
                  <p class="text-xs text-neutral-500">Trials, renewals & activations</p>
                </div>
              </a>
              <a routerLink="/superadmin/plans"
                class="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-all group">
                <div class="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-lg group-hover:bg-neutral-200 transition-colors">💎</div>
                <div>
                  <p class="text-sm font-semibold text-black">{{ i18n.t('platform.editPlans') }}</p>
                  <p class="text-xs text-neutral-500">Pricing & features</p>
                </div>
              </a>
              <a routerLink="/superadmin/tenants"
                class="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-all group">
                <div class="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-lg group-hover:bg-neutral-200 transition-colors">🏢</div>
                <div>
                  <p class="text-sm font-semibold text-black">All Tenants</p>
                  <p class="text-xs text-neutral-500">Search & manage stores</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <!-- ═══ Expiring Soon Alert ═══ -->
        @if (dashboard()!.expiringSubscriptions > 0) {
          <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">⏰</div>
            <div class="flex-1">
              <p class="font-bold text-amber-900">{{ dashboard()!.expiringSubscriptions }} subscription{{ dashboard()!.expiringSubscriptions > 1 ? 's' : '' }} expiring within 7 days</p>
              <p class="text-sm text-amber-700 mt-0.5">These tenants need attention to avoid service interruption.</p>
            </div>
            <a routerLink="/superadmin/subscriptions" class="bg-amber-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-800 transition-colors shrink-0">
              Review Now
            </a>
          </div>
        }

        <!-- ═══ Recent Invoices Table ═══ -->
        <div class="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h2 class="font-bold text-black text-base">Recent Invoices</h2>
              <p class="text-xs text-neutral-500 mt-0.5">Latest billing activity</p>
            </div>
            <span class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Last 5</span>
          </div>
          @if (dashboard()!.recentInvoices && dashboard()!.recentInvoices.length > 0) {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-[11px] text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                    <th class="px-6 py-3 font-semibold">Invoice</th>
                    <th class="px-6 py-3 font-semibold">Tenant</th>
                    <th class="px-6 py-3 font-semibold">Type</th>
                    <th class="px-6 py-3 font-semibold text-right">Amount</th>
                    <th class="px-6 py-3 font-semibold">Status</th>
                    <th class="px-6 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-50">
                  @for (inv of dashboard()!.recentInvoices; track inv.id) {
                    <tr class="hover:bg-neutral-50/50 transition-colors">
                      <td class="px-6 py-4">
                        <span class="font-mono text-xs font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">{{ inv.invoiceNumber }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                            {{ inv.tenantName?.charAt(0) || '?' }}
                          </div>
                          <div>
                            <p class="font-medium text-black text-sm">{{ inv.tenantName }}</p>
                            @if (inv.tenantSlug) {
                              <p class="text-[11px] text-neutral-400">{{ inv.tenantSlug }}</p>
                            }
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                          [class]="inv.invoiceType === 'Activation' ? 'bg-blue-50 text-blue-700' :
                                   inv.invoiceType === 'Renewal' ? 'bg-purple-50 text-purple-700' :
                                   'bg-neutral-100 text-neutral-600'">
                          {{ inv.invoiceType }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <span class="font-bold text-black">{{ inv.total | number:'1.0-0' }}</span>
                        <span class="text-neutral-400 text-xs ml-0.5">EGP</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                          [class]="inv.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                                   inv.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'">
                          <span class="w-1.5 h-1.5 rounded-full"
                            [class]="inv.paymentStatus === 'Paid' ? 'bg-emerald-500' :
                                     inv.paymentStatus === 'Partial' ? 'bg-amber-500' : 'bg-red-500'"></span>
                          {{ inv.paymentStatus }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-neutral-500 text-xs">{{ inv.createdAt | date:'mediumDate' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="px-6 py-12 text-center text-neutral-400 text-sm">
              No invoices yet — they'll appear once subscriptions are activated.
            </div>
          }
        </div>

        <!-- ═══ Tenant Revenue Breakdown ═══ -->
        <div class="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h2 class="font-bold text-black text-base">Revenue per Tenant</h2>
              <p class="text-xs text-neutral-500 mt-0.5">Fees, subscription revenue, months & subscription period</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                <span class="w-2 h-2 rounded-full bg-blue-500 ml-2"></span> Trial
                <span class="w-2 h-2 rounded-full bg-red-500 ml-2"></span> Other
              </div>
            </div>
          </div>
          @if (dashboard()!.tenantRevenueBreakdown && dashboard()!.tenantRevenueBreakdown.length > 0) {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-[11px] text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                    <th class="px-5 py-3 font-semibold">Tenant</th>
                    <th class="px-5 py-3 font-semibold">Plan</th>
                    <th class="px-5 py-3 font-semibold">Status</th>
                    <th class="px-5 py-3 font-semibold text-right">Fees</th>
                    <th class="px-5 py-3 font-semibold text-right">Subscription</th>
                    <th class="px-5 py-3 font-semibold text-right">Discount</th>
                    <th class="px-5 py-3 font-semibold text-right">Total Paid</th>
                    <th class="px-5 py-3 font-semibold text-center">Months</th>
                    <th class="px-5 py-3 font-semibold">Period</th>
                    <th class="px-5 py-3 font-semibold text-center">Invoices</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-50">
                  @for (row of dashboard()!.tenantRevenueBreakdown; track row.tenantId) {
                    <tr class="hover:bg-neutral-50/50 transition-colors">
                      <td class="px-5 py-3.5">
                        <a [routerLink]="['/superadmin/tenants', row.tenantId]" class="flex items-center gap-2.5 group">
                          <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                            [class]="row.subscriptionStatus === 'Active' ? 'bg-black text-white' :
                                     row.subscriptionStatus === 'Trial' ? 'bg-blue-100 text-blue-700' :
                                     'bg-neutral-100 text-neutral-600'">
                            {{ row.tenantName.charAt(0) }}
                          </div>
                          <div class="min-w-0">
                            <p class="font-semibold text-black text-sm truncate group-hover:underline">{{ row.tenantName }}</p>
                            <p class="text-[11px] text-neutral-400 truncate">{{ row.tenantSlug }}</p>
                          </div>
                        </a>
                      </td>
                      <td class="px-5 py-3.5">
                        <span class="text-xs font-medium text-neutral-700">{{ row.planName }}</span>
                      </td>
                      <td class="px-5 py-3.5">
                        <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                          [class]="row.subscriptionStatus === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                                   row.subscriptionStatus === 'Trial' ? 'bg-blue-50 text-blue-700' :
                                   row.subscriptionStatus === 'Expired' ? 'bg-red-50 text-red-700' :
                                   row.subscriptionStatus === 'Suspended' ? 'bg-amber-50 text-amber-700' :
                                   'bg-neutral-100 text-neutral-600'">
                          <span class="w-1.5 h-1.5 rounded-full"
                            [class]="row.subscriptionStatus === 'Active' ? 'bg-emerald-500' :
                                     row.subscriptionStatus === 'Trial' ? 'bg-blue-500' :
                                     row.subscriptionStatus === 'Expired' ? 'bg-red-500' :
                                     row.subscriptionStatus === 'Suspended' ? 'bg-amber-500' :
                                     'bg-neutral-400'"></span>
                          {{ row.subscriptionStatus }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5 text-right">
                        <span class="font-semibold" [class]="row.totalFees > 0 ? 'text-black' : 'text-neutral-300'">
                          {{ row.totalFees | number:'1.0-0' }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5 text-right">
                        <span class="font-semibold" [class]="row.totalSubscriptionRevenue > 0 ? 'text-black' : 'text-neutral-300'">
                          {{ row.totalSubscriptionRevenue | number:'1.0-0' }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5 text-right">
                        <span [class]="row.totalDiscount > 0 ? 'text-red-600 font-semibold' : 'text-neutral-300'">
                          {{ row.totalDiscount > 0 ? '-' : '' }}{{ row.totalDiscount | number:'1.0-0' }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5 text-right">
                        <span class="font-black text-black">{{ row.totalPaid | number:'1.0-0' }}</span>
                        <span class="text-neutral-400 text-[10px] ml-0.5">EGP</span>
                      </td>
                      <td class="px-5 py-3.5 text-center">
                        <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                          [class]="row.totalMonths > 0 ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-400'">
                          {{ row.totalMonths }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5">
                        @if (row.subscriptionStart && row.subscriptionEnd) {
                          <div class="text-xs">
                            <span class="text-neutral-500">{{ row.subscriptionStart | date:'MMM d, yy' }}</span>
                            <span class="text-neutral-300 mx-1">→</span>
                            <span class="font-semibold" [class]="isExpiringSoon(row.subscriptionEnd) ? 'text-amber-600' : 'text-black'">
                              {{ row.subscriptionEnd | date:'MMM d, yy' }}
                            </span>
                          </div>
                        } @else {
                          <span class="text-neutral-300 text-xs">—</span>
                        }
                      </td>
                      <td class="px-5 py-3.5 text-center">
                        <span class="text-xs font-semibold text-neutral-500">{{ row.invoiceCount }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
                <!-- Totals row -->
                <tfoot>
                  <tr class="border-t-2 border-neutral-200 bg-neutral-50/50">
                    <td class="px-5 py-3 font-bold text-black text-xs" colspan="3">TOTALS</td>
                    <td class="px-5 py-3 text-right font-bold text-black text-sm">{{ breakdownTotalFees() | number:'1.0-0' }}</td>
                    <td class="px-5 py-3 text-right font-bold text-black text-sm">{{ breakdownTotalSubscription() | number:'1.0-0' }}</td>
                    <td class="px-5 py-3 text-right font-bold text-red-600 text-sm">{{ breakdownTotalDiscount() > 0 ? '-' : '' }}{{ breakdownTotalDiscount() | number:'1.0-0' }}</td>
                    <td class="px-5 py-3 text-right font-black text-black text-sm">{{ breakdownGrandTotal() | number:'1.0-0' }} <span class="text-neutral-400 text-[10px]">EGP</span></td>
                    <td class="px-5 py-3 text-center font-bold text-black text-sm">{{ breakdownTotalMonths() }}</td>
                    <td class="px-5 py-3"></td>
                    <td class="px-5 py-3 text-center font-bold text-black text-sm">{{ breakdownTotalInvoices() }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          } @else {
            <div class="px-6 py-12 text-center text-neutral-400 text-sm">
              No revenue data — create tenants and activate subscriptions to see the breakdown.
            </div>
          }
        </div>

        <!-- ═══ Recent Tenants ═══ -->
        <div class="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h2 class="font-bold text-black text-base">{{ i18n.t('platform.recentTenants') }}</h2>
              <p class="text-xs text-neutral-500 mt-0.5">Recently onboarded stores</p>
            </div>
            <a routerLink="/superadmin/tenants" class="text-xs font-semibold text-neutral-400 hover:text-black transition-colors uppercase tracking-wider">
              View All →
            </a>
          </div>
          @if (dashboard()!.recentTenants.length) {
            <div class="divide-y divide-neutral-50">
              @for (tenant of dashboard()!.recentTenants; track tenant.id) {
                <a [routerLink]="['/superadmin/tenants', tenant.id]"
                  class="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors group cursor-pointer block">
                  <div class="flex items-center gap-4">
                    <div class="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold transition-colors"
                      [class]="tenant.status === 'Active' ? 'bg-black text-white' :
                               tenant.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                               'bg-neutral-100 text-neutral-600'">
                      {{ tenant.name.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-semibold text-black text-sm group-hover:underline">{{ tenant.name }}</p>
                      <p class="text-xs text-neutral-500">{{ tenant.slug }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    @if (tenant.subscription) {
                      <span class="text-xs text-neutral-400 hidden sm:inline">{{ tenant.subscription.planName }}</span>
                    }
                    <span class="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                      [class]="tenant.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                               tenant.status === 'Suspended' ? 'bg-red-50 text-red-700' :
                               'bg-neutral-100 text-neutral-600'">
                      {{ tenant.status }}
                    </span>
                    <span class="text-xs text-neutral-400 hidden sm:inline">{{ tenant.createdAt | date:'mediumDate' }}</span>
                    <svg class="w-4 h-4 text-neutral-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </a>
              }
            </div>
          } @else {
            <div class="px-6 py-12 text-center text-neutral-400 text-sm">
              No tenants yet — create your first store to get started.
            </div>
          }
        </div>

        <!-- ═══ Footer Stats Bar ═══ -->
        <div class="bg-neutral-900 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 text-white">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <p class="text-xs text-neutral-400">Platform Status</p>
              <p class="text-sm font-bold text-emerald-400">All Systems Operational</p>
            </div>
          </div>
          <div class="flex items-center gap-6 text-center">
            <div>
              <p class="text-lg font-black">{{ dashboard()!.totalLeads }}</p>
              <p class="text-[10px] text-neutral-400 uppercase tracking-wider">{{ i18n.t('platform.totalLeads') }}</p>
            </div>
            <div class="w-px h-8 bg-white/10"></div>
            <div>
              <p class="text-lg font-black">{{ activePct() }}%</p>
              <p class="text-[10px] text-neutral-400 uppercase tracking-wider">Active Rate</p>
            </div>
            <div class="w-px h-8 bg-white/10"></div>
            <div>
              <p class="text-lg font-black">{{ dashboard()!.totalTenants }}</p>
              <p class="text-[10px] text-neutral-400 uppercase tracking-wider">{{ i18n.t('platform.totalTenants') }}</p>
            </div>
          </div>
        </div>

      }
    </div>
  `,
})
export class PlatformDashboardComponent implements OnInit {
  private readonly api = inject(PlatformApiService);
  readonly i18n = inject(I18nService);

  readonly dashboard = signal<PlatformDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  range = 'month';
  readonly today = new Date();

  readonly rangeOptions = [
    { value: 'week', label: '7D' },
    { value: 'month', label: '30D' },
    { value: 'year', label: '1Y' },
  ];

  readonly maxRevenue = computed(() => {
    const chart = this.dashboard()?.revenueChart;
    if (!chart || chart.length === 0) return 1;
    return Math.max(...chart.map(p => p.amount), 1);
  });

  readonly avgRevenuePerTenant = computed(() => {
    const d = this.dashboard();
    if (!d || d.activeTenants === 0) return 0;
    return Math.round(d.totalRevenue / d.activeTenants);
  });

  readonly activePct = computed(() => {
    const d = this.dashboard();
    if (!d || d.totalTenants === 0) return 0;
    return Math.round((d.activeTenants / d.totalTenants) * 100);
  });

  readonly peakMonth = computed(() => {
    const chart = this.dashboard()?.revenueChart;
    if (!chart || chart.length === 0) return '—';
    const peak = chart.reduce((a, b) => a.amount > b.amount ? a : b);
    return `${peak.label} (${Math.round(peak.amount).toLocaleString()} EGP)`;
  });

  readonly donutGradient = computed(() => {
    const d = this.dashboard();
    if (!d || d.totalTenants === 0) return 'conic-gradient(#e5e5e5 0% 100%)';
    const total = d.totalTenants || 1;
    const active = (d.activeTenants / total) * 100;
    const trial = (d.trialTenants / total) * 100;
    const suspended = (d.suspendedTenants / total) * 100;
    // rest = expired + pending
    return `conic-gradient(#000 0% ${active}%, #a3a3a3 ${active}% ${active + trial}%, #f87171 ${active + trial}% ${active + trial + suspended}%, #e5e5e5 ${active + trial + suspended}% 100%)`;
  });

  readonly statCards = computed(() => {
    const d = this.dashboard();
    if (!d) return [];
    return [
      { icon: '🏢', label: 'Active Tenants', value: d.activeTenants, bgClass: 'bg-emerald-50', route: '/superadmin/tenants', badge: null, badgeClass: '' },
      { icon: '⏳', label: 'On Trial', value: d.trialTenants, bgClass: 'bg-blue-50', route: '/superadmin/subscriptions', badge: d.trialTenants > 0 ? 'NEEDS ACTION' : null, badgeClass: 'bg-blue-100 text-blue-700' },
      { icon: '⚠️', label: 'Suspended', value: d.suspendedTenants, bgClass: 'bg-red-50', route: '/superadmin/tenants', badge: d.suspendedTenants > 0 ? 'ATTENTION' : null, badgeClass: 'bg-red-100 text-red-700' },
      { icon: '📅', label: 'Expiring Soon', value: d.expiringSubscriptions, bgClass: 'bg-amber-50', route: '/superadmin/subscriptions', badge: d.expiringSubscriptions > 0 ? 'WITHIN 7 DAYS' : null, badgeClass: 'bg-amber-100 text-amber-700' },
      { icon: '🚫', label: 'Expired', value: d.expiredTenants, bgClass: 'bg-neutral-100', route: '/superadmin/tenants', badge: null, badgeClass: '' },
    ];
  });

  // Revenue breakdown totals
  readonly breakdownTotalFees = computed(() =>
    this.dashboard()?.tenantRevenueBreakdown?.reduce((s, r) => s + r.totalFees, 0) ?? 0);
  readonly breakdownTotalSubscription = computed(() =>
    this.dashboard()?.tenantRevenueBreakdown?.reduce((s, r) => s + r.totalSubscriptionRevenue, 0) ?? 0);
  readonly breakdownTotalDiscount = computed(() =>
    this.dashboard()?.tenantRevenueBreakdown?.reduce((s, r) => s + r.totalDiscount, 0) ?? 0);
  readonly breakdownGrandTotal = computed(() =>
    this.dashboard()?.tenantRevenueBreakdown?.reduce((s, r) => s + r.totalPaid, 0) ?? 0);
  readonly breakdownTotalMonths = computed(() =>
    this.dashboard()?.tenantRevenueBreakdown?.reduce((s, r) => s + r.totalMonths, 0) ?? 0);
  readonly breakdownTotalInvoices = computed(() =>
    this.dashboard()?.tenantRevenueBreakdown?.reduce((s, r) => s + r.invoiceCount, 0) ?? 0);

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  ngOnInit(): void {
    this.load();
  }

  chartBarHeight(amount: number): number {
    const max = this.maxRevenue();
    if (max === 0) return 5;
    return Math.max((amount / max) * 100, 3);
  }

  chartLabel(label: string): string {
    // Convert "Jun 2025" → "Jun"
    return label?.split(' ')[0] ?? label;
  }

  isExpiringSoon(dateStr: string): boolean {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 14;
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getDashboard(this.range).subscribe({
      next: data => {
        console.log('[Dashboard] Loaded:', data);
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[Dashboard] Error:', err);
        this.error.set(err?.message || err?.error?.message || 'Could not connect to the server.');
        this.loading.set(false);
      },
    });
  }
}
