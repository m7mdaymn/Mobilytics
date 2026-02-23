import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Expense, ExpenseCategory } from '../../../core/models/item.models';
import { AuthService } from '../../../core/services/auth.service';

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
        <h1 class="text-2xl font-bold">Expenses</h1>
        <div class="flex gap-2">
          <button (click)="showCategoryForm.set(true)" class="btn-outline text-sm">Manage Categories</button>
          <button (click)="openExpenseForm()" class="btn-primary">+ Add Expense</button>
        </div>
      </div>

      <!-- Category Manager -->
      @if (showCategoryForm()) {
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold">Expense Categories</h2>
          <div class="flex gap-2">
            <input [(ngModel)]="newCatName" class="input-field flex-1" placeholder="Category name" />
            <button (click)="addCategory()" class="btn-primary">Add</button>
          </div>
          <div class="flex flex-wrap gap-2">
            @for (cat of expenseCategories(); track cat.id) {
              <span class="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                {{ cat.name }}
                <button (click)="deleteCategory(cat)" class="text-red-500 hover:text-red-700 ml-1">✕</button>
              </span>
            }
          </div>
          <button (click)="showCategoryForm.set(false)" class="btn-outline text-sm">Close</button>
        </div>
      }

      <!-- Expense Form -->
      @if (showExpenseForm()) {
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold">{{ editExpenseId() ? 'Edit' : 'New' }} Expense</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Category <span class="text-red-500">*</span></label>
              <select [(ngModel)]="expenseForm.categoryId" class="input-field">
                <option value="">Select...</option>
                @for (cat of expenseCategories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Amount <span class="text-red-500">*</span></label>
              <input [(ngModel)]="expenseForm.amount" type="number" min="0" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Date</label>
              <input [(ngModel)]="expenseForm.occurredAt" type="date" class="input-field" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-1">Title / Description</label>
              <input [(ngModel)]="expenseForm.title" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Notes</label>
              <input [(ngModel)]="expenseForm.notes" class="input-field" placeholder="Optional notes" />
            </div>
          </div>
          <div class="flex gap-2">
            <button (click)="saveExpense()" class="btn-primary" [disabled]="saving()">Save</button>
            <button (click)="showExpenseForm.set(false)" class="btn-outline">Cancel</button>
          </div>
        </div>
      }

      <!-- Salary Generation -->
      @if (authService.hasPermission('expenses.manage')) {
        <div class="card p-4 flex items-center gap-4">
          <span class="text-sm font-medium">Generate Monthly Salaries</span>
          <select [(ngModel)]="salaryMonth" class="input-field w-40">
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <button (click)="generateSalaries()" class="btn-accent text-sm" [disabled]="generatingSalaries()">Generate</button>
        </div>
      }

      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">From</label>
          <input [(ngModel)]="dateFrom" type="date" class="input-field" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">To</label>
          <input [(ngModel)]="dateTo" type="date" class="input-field" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Category</label>
          <select [(ngModel)]="categoryFilter" class="input-field">
            <option value="">All</option>
            @for (cat of expenseCategories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>
        </div>
        <button (click)="load()" class="btn-primary mt-auto">Filter</button>
      </div>

      <!-- Summary -->
      <div class="card p-4 flex items-center justify-between">
        <span class="text-sm text-gray-500">Total Expenses (filtered)</span>
        <span class="text-xl font-bold text-red-600">{{ totalExpenses() | currency }}</span>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Date</th>
              <th class="px-4 py-3 text-left font-medium">Category</th>
              <th class="px-4 py-3 text-left font-medium">Title</th>
              <th class="px-4 py-3 text-right font-medium">Amount</th>
              <th class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (exp of expenses(); track exp.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">{{ exp.occurredAt | date:'mediumDate' }}</td>
                <td class="px-4 py-3">{{ exp.categoryName }}</td>
                <td class="px-4 py-3 text-gray-600">{{ exp.title || '—' }}</td>
                <td class="px-4 py-3 text-right font-medium">{{ exp.amount | currency }}</td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button (click)="editExpense(exp)" class="text-blue-600 hover:underline">Edit</button>
                  <button (click)="deleteExpense(exp)" class="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">No expenses found</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalCount() > pageSize) {
        <div class="flex justify-center gap-2 pt-2">
          <button (click)="page = page - 1; load()" [disabled]="page <= 1" class="btn-outline text-sm">Prev</button>
          <span class="text-sm py-2">Page {{ page }} of {{ totalPages() }}</span>
          <button (click)="page = page + 1; load()" [disabled]="page >= totalPages()" class="btn-outline text-sm">Next</button>
        </div>
      }
    </div>
  `,
})
export class ExpensesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);

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
      next: () => { this.newCatName = ''; this.loadCategories(); this.toastService.success('Category added'); },
      error: () => this.toastService.error('Failed'),
    });
  }

  deleteCategory(cat: ExpenseCategory): void {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    this.api.delete(`/Expenses/categories/${cat.id}`).subscribe({
      next: () => { this.loadCategories(); this.toastService.success('Deleted'); },
      error: () => this.toastService.error('Failed'),
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
    if (!confirm('Delete this expense?')) return;
    this.api.delete(`/Expenses/${exp.id}`).subscribe({
      next: () => { this.toastService.success('Deleted'); this.load(); },
      error: () => this.toastService.error('Failed'),
    });
  }

  saveExpense(): void {
    if (!this.expenseForm.categoryId || !this.expenseForm.amount) {
      this.toastService.error('Category and amount required');
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
      next: () => { this.saving.set(false); this.showExpenseForm.set(false); this.toastService.success('Saved'); this.load(); },
      error: () => { this.saving.set(false); this.toastService.error('Failed'); },
    });
  }

  generateSalaries(): void {
    if (!confirm(`Generate salary expenses for ${this.salaryMonth}?`)) return;
    this.generatingSalaries.set(true);
    this.api.post('/Employees/generate-salary-expenses', { month: this.salaryMonth }).subscribe({
      next: () => { this.generatingSalaries.set(false); this.toastService.success('Salaries generated'); this.load(); },
      error: () => { this.generatingSalaries.set(false); this.toastService.error('Failed'); },
    });
  }
}
