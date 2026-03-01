import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Expense, ExpenseCategory } from '../../../core/models/item.models';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsStore } from '../../../core/stores/settings.store';
import { I18nService } from '../../../core/services/i18n.service';

interface PagedExpenses {
  items: Expense[];
  totalCount: number;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">{{ i18n.t('expenses.title') }}</h1>
        <div class="flex gap-2">
          <button (click)="showCategoryForm.set(true)" class="btn-outline text-sm">{{ i18n.t('expenses.manageCategories') }}</button>
          <button (click)="openExpenseForm()" class="btn-primary">+ {{ i18n.t('expenses.addNew') }}</button>
        </div>
      </div>

      <!-- Category Manager -->
      @if (showCategoryForm()) {
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold">{{ i18n.t('expenses.categoriesTitle') }}</h2>
          <div class="flex gap-2">
            <input [(ngModel)]="newCatName" class="input-field flex-1" [placeholder]="i18n.t('expenses.categoryNamePlaceholder')" />
            <button (click)="addCategory()" class="btn-primary">{{ i18n.t('common.add') }}</button>
          </div>
          <div class="flex flex-wrap gap-2">
            @for (cat of expenseCategories(); track cat.id) {
              <span class="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                {{ cat.name }}
                <button (click)="deleteCategory(cat)" class="text-red-500 hover:text-red-700 ms-1">✕</button>
              </span>
            }
          </div>
          <button (click)="showCategoryForm.set(false)" class="btn-outline text-sm">{{ i18n.t('common.close') }}</button>
        </div>
      }

      <!-- Expense Form -->
      @if (showExpenseForm()) {
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold">{{ editExpenseId() ? i18n.t('expenses.editExpense') : i18n.t('expenses.newExpense') }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">{{ i18n.t('expenses.category') }} <span class="text-red-500">*</span></label>
              <select [(ngModel)]="expenseForm.categoryId" class="input-field">
                <option value="">{{ i18n.t('common.select') }}</option>
                @for (cat of expenseCategories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">{{ i18n.t('expenses.amount') }} <span class="text-red-500">*</span></label>
              <input [(ngModel)]="expenseForm.amount" type="number" min="0" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">{{ i18n.t('expenses.date') }}</label>
              <input [(ngModel)]="expenseForm.occurredAt" type="date" class="input-field" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-1">{{ i18n.t('expenses.titleDescription') }}</label>
              <input [(ngModel)]="expenseForm.title" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">{{ i18n.t('expenses.notes') }}</label>
              <input [(ngModel)]="expenseForm.notes" class="input-field" [placeholder]="i18n.t('expenses.notesPlaceholder')" />
            </div>
          </div>
          <div class="flex gap-2">
            <button (click)="saveExpense()" class="btn-primary" [disabled]="saving()">{{ saving() ? i18n.t('common.saving') : i18n.t('common.save') }}</button>
            <button (click)="showExpenseForm.set(false)" class="btn-outline">{{ i18n.t('common.cancel') }}</button>
          </div>
        </div>
      }

      <!-- Salary Generation -->
      @if (authService.hasPermission('expenses.manage')) {
        <div class="card p-4 flex items-center gap-4">
          <span class="text-sm font-medium">{{ i18n.t('expenses.generateSalaries') }}</span>
          <select [(ngModel)]="salaryMonth" class="input-field w-40">
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <button (click)="generateSalaries()" class="btn-accent text-sm" [disabled]="generatingSalaries()">{{ i18n.t('expenses.generate') }}</button>
        </div>
      }

      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">{{ i18n.t('common.from') }}</label>
          <input [(ngModel)]="dateFrom" type="date" class="input-field" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">{{ i18n.t('common.to') }}</label>
          <input [(ngModel)]="dateTo" type="date" class="input-field" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">{{ i18n.t('expenses.category') }}</label>
          <select [(ngModel)]="categoryFilter" class="input-field">
            <option value="">{{ i18n.t('common.all') }}</option>
            @for (cat of expenseCategories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>
        </div>
        <button (click)="load()" class="btn-primary mt-auto">{{ i18n.t('common.filter') }}</button>
      </div>

      <!-- Summary -->
      <div class="card p-4 flex items-center justify-between">
        <span class="text-sm text-gray-500">{{ i18n.t('expenses.totalFiltered') }}</span>
        <span class="text-xl font-bold text-red-600">{{ totalExpenses() | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</span>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-start font-medium">{{ i18n.t('expenses.date') }}</th>
              <th class="px-4 py-3 text-start font-medium">{{ i18n.t('expenses.category') }}</th>
              <th class="px-4 py-3 text-start font-medium">{{ i18n.t('expenses.titleDescription') }}</th>
              <th class="px-4 py-3 text-end font-medium">{{ i18n.t('expenses.amount') }}</th>
              <th class="px-4 py-3 text-end font-medium">{{ i18n.t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (exp of expenses(); track exp.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">{{ exp.occurredAt | date:'mediumDate' }}</td>
                <td class="px-4 py-3">{{ exp.categoryName }}</td>
                <td class="px-4 py-3 text-gray-600">{{ exp.title || '—' }}</td>
                <td class="px-4 py-3 text-end font-medium">{{ exp.amount | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}</td>
                <td class="px-4 py-3 text-end space-x-2">
                  <button (click)="editExpense(exp)" class="text-blue-600 hover:underline">{{ i18n.t('common.edit') }}</button>
                  <button (click)="deleteExpense(exp)" class="text-red-600 hover:underline">{{ i18n.t('common.delete') }}</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">{{ i18n.t('expenses.noData') }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalCount() > pageSize) {
        <div class="flex justify-center gap-2 pt-2">
          <button (click)="page = page - 1; load()" [disabled]="page <= 1" class="btn-outline text-sm">{{ i18n.t('common.prev') }}</button>
          <span class="text-sm py-2">{{ i18n.t('common.pageOf').replace('{0}', '' + page).replace('{1}', '' + totalPages()) }}</span>
          <button (click)="page = page + 1; load()" [disabled]="page >= totalPages()" class="btn-outline text-sm">{{ i18n.t('common.next') }}</button>
        </div>
      }
    </div>
  `,
})
export class ExpensesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);
  readonly settingsStore = inject(SettingsStore);
  readonly i18n = inject(I18nService);

  readonly expenses = signal<Expense[]>([]);
  readonly expenseCategories = signal<ExpenseCategory[]>([]);
  readonly totalExpenses = signal(0);
  readonly totalCount = signal(0);
  readonly showCategoryForm = signal(false);
  readonly showExpenseForm = signal(false);
  readonly editExpenseId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly generatingSalaries = signal(false);
  readonly totalPages = signal(1);

  newCatName = '';
  dateFrom = '';
  dateTo = '';
  categoryFilter = '';
  salaryMonth = '';
  page = 1;
  readonly pageSize = 20;

  expenseForm = { categoryId: '', amount: 0, occurredAt: '', title: '', notes: '' };

  months = Array.from({ length: 12 }, (_, i) => ({
    value: `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`,
    label: new Date(2024, i).toLocaleString('en', { month: 'long' }),
  }));

  ngOnInit(): void {
    this.loadCategories();
    this.load();
    const now = new Date();
    this.salaryMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  loadCategories(): void {
    this.api.get<ExpenseCategory[]>('/Expenses/categories').subscribe(d => this.expenseCategories.set(d || []));
  }

  load(): void {
    const params: Record<string, string | number | boolean> = { page: this.page, pageSize: this.pageSize };
    if (this.dateFrom) params['from'] = this.dateFrom;
    if (this.dateTo) params['to'] = this.dateTo;
    if (this.categoryFilter) params['categoryId'] = this.categoryFilter;

    this.api.get<PagedExpenses>('/Expenses', params).subscribe(d => {
      const items = d?.items || [];
      this.expenses.set(items);
      this.totalCount.set(d?.totalCount || 0);
      this.totalPages.set(Math.max(1, Math.ceil((d?.totalCount || 0) / this.pageSize)));
      this.totalExpenses.set(items.reduce((s, e) => s + e.amount, 0));
    });
  }

  addCategory(): void {
    if (!this.newCatName) return;
    this.api.post('/Expenses/categories', { name: this.newCatName }).subscribe({
      next: () => { this.newCatName = ''; this.loadCategories(); this.toastService.success(this.i18n.t('expenses.categoryAdded')); },
      error: () => this.toastService.error(this.i18n.t('expenses.failed')),
    });
  }

  deleteCategory(cat: ExpenseCategory): void {
    if (!confirm(this.i18n.t('expenses.confirmDeleteCategory'))) return;
    this.api.delete(`/Expenses/categories/${cat.id}`).subscribe({
      next: () => { this.loadCategories(); this.toastService.success(this.i18n.t('expenses.deleted')); },
      error: () => this.toastService.error(this.i18n.t('expenses.failed')),
    });
  }

  openExpenseForm(): void {
    this.expenseForm = { categoryId: '', amount: 0, occurredAt: new Date().toISOString().split('T')[0], title: '', notes: '' };
    this.editExpenseId.set(null);
    this.showExpenseForm.set(true);
  }

  editExpense(exp: Expense): void {
    this.expenseForm = {
      categoryId: exp.categoryId, amount: exp.amount,
      occurredAt: exp.occurredAt?.split('T')[0] || '', title: exp.title || '', notes: exp.notes || '',
    };
    this.editExpenseId.set(exp.id);
    this.showExpenseForm.set(true);
  }

  deleteExpense(exp: Expense): void {
    if (!confirm(this.i18n.t('expenses.confirmDeleteExpense'))) return;
    this.api.delete(`/Expenses/${exp.id}`).subscribe({
      next: () => { this.toastService.success(this.i18n.t('expenses.deleted')); this.load(); },
      error: () => this.toastService.error(this.i18n.t('expenses.failed')),
    });
  }

  saveExpense(): void {
    if (!this.expenseForm.categoryId || !this.expenseForm.amount) {
      this.toastService.error(this.i18n.t('expenses.categoryAndAmountRequired'));
      return;
    }
    this.saving.set(true);
    const body = {
      categoryId: this.expenseForm.categoryId,
      title: this.expenseForm.title,
      amount: this.expenseForm.amount,
      occurredAt: this.expenseForm.occurredAt || new Date().toISOString(),
      notes: this.expenseForm.notes || null,
    };
    const req$ = this.editExpenseId()
      ? this.api.put(`/Expenses/${this.editExpenseId()}`, body)
      : this.api.post('/Expenses', body);
    req$.subscribe({
      next: () => { this.saving.set(false); this.showExpenseForm.set(false); this.toastService.success(this.i18n.t('expenses.saved')); this.load(); },
      error: () => { this.saving.set(false); this.toastService.error(this.i18n.t('expenses.failed')); },
    });
  }

  generateSalaries(): void {
    if (!confirm(this.i18n.t('expenses.confirmGenerateSalaries'))) return;
    this.generatingSalaries.set(true);
    this.api.post('/Employees/generate-salary-expenses', { month: this.salaryMonth }).subscribe({
      next: () => { this.generatingSalaries.set(false); this.toastService.success(this.i18n.t('expenses.salariesGenerated')); this.load(); },
      error: () => { this.generatingSalaries.set(false); this.toastService.error(this.i18n.t('expenses.failed')); },
    });
  }
}
