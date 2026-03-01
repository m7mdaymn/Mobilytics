export interface Item {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  oldPrice: number | null;
  condition: 'New' | 'Used' | 'Refurbished';
  status: 'Available' | 'Sold' | 'Reserved' | 'Hidden';
  isFeatured: boolean;

  // Relations
  brandId: string | null;
  brandName: string;
  categoryId: string;
  categoryName: string;
  itemTypeId: string | null;
  itemTypeName: string;

  // Inventory
  quantity: number;
  lowStockThreshold: number;
  isDevice: boolean;
  isStockItem: boolean;

  // Identifiers
  imei: string | null;
  serialNumber: string | null;

  // Device-specific
  color: string | null;
  storage: string | null;
  ram: string | null;
  installmentAvailable: boolean;
  batteryHealth: number | null;
  warrantyType: string | null;
  warrantyMonths: number | null;

  // Tax
  taxStatus: 'Taxable' | 'Exempt';
  vatPercent: number;

  // Rich content
  specs: string | null;
  whatsInTheBox: string | null;

  // Images
  mainImageUrl: string | null;
  galleryImagesJson: string | null; // JSON array of URL strings

  // Custom fields
  customFieldsJson: string | null; // JSON array of {fieldId, value}

  // Checklist
  checklistJson: string | null; // JSON array of {key, passed, notes}

  createdAt: string;
  updatedAt: string;
}

export interface ItemImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface CustomFieldValue {
  fieldId: string;
  fieldName: string;
  fieldType: 'Text' | 'Number' | 'Boolean' | 'Select';
  value: string;
}

export interface ChecklistItem {
  key: string;
  label: string;
  passed: boolean;
  notes: string;
}

export interface ItemCreateDto {
  title: string;
  slug?: string;
  description?: string;
  price: number;
  oldPrice?: number;
  condition: string;
  isFeatured?: boolean;
  brandId?: string;
  categoryId: string;
  itemTypeId?: string;
  quantity?: number;
  imei?: string;
  serialNumber?: string;
  color?: string;
  storage?: string;
  ram?: string;
  installmentAvailable?: boolean;
  batteryHealth?: number;
  warrantyType?: string;
  warrantyMonths?: number;
  taxStatus: string;
  vatPercent?: number;
  specs?: string;
  whatsInTheBox?: string;
  customFieldsJson?: string;
  checklistJson?: string;
}

export type ItemUpdateDto = Partial<ItemCreateDto>;

export interface ItemQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string; // price_asc, price_desc, newest, oldest
  typeId?: string;
  categoryId?: string;
  brandId?: string;
  itemTypeSlug?: string;
  categorySlug?: string;
  brandSlug?: string;
  condition?: string;
  status?: string;
  priceMin?: number;
  priceMax?: number;
  featured?: boolean;
  color?: string;
  storage?: string;
  ram?: string;
  installmentAvailable?: boolean;
  warrantyType?: string;
}

export interface ItemType {
  id: string;
  name: string;
  slug: string;
  isDevice: boolean;
  isStockItem: boolean;
  supportsIMEI: boolean;
  supportsSerial: boolean;
  supportsBatteryHealth: boolean;
  supportsWarranty: boolean;
  isActive: boolean;
  isVisibleInNav: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isVisibleInNav: boolean;
  itemCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
  parentName: string | null;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
  isVisibleInNav: boolean;
  sortOrder: number;
  children: Category[];
  itemCount: number;
  createdAt: string;
  // Capability flags (merged from ItemType)
  isDevice: boolean;
  isStockItem: boolean;
  supportsIMEI: boolean;
  supportsSerial: boolean;
  supportsBatteryHealth: boolean;
  supportsWarranty: boolean;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  fieldType: 'Text' | 'Number' | 'Boolean' | 'Select';
  options: string[];
  isRequired: boolean;
  sortOrder: number;
}

// HomeSection interfaces removed — feature deprecated

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  discount: number;
  vatAmount: number;
  total: number;
  paymentMethod: string;
  notes: string;
  isRefund: boolean;
  originalInvoiceId: string | null;
  createdAt: string;
  createdByName: string;
  items: InvoiceLine[];
}

export interface InvoiceLine {
  id: string;
  itemId: string;
  itemTitleSnapshot: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxStatusSnapshot: string;
  vatPercentSnapshot: number | null;
}

export interface InvoiceCreateDto {
  customerName?: string;
  customerPhone?: string;
  items: { itemId?: string; itemTitleOverride?: string; unitPrice: number; quantity: number }[];
  discount?: number;
  paymentMethod?: string;
  notes?: string;
}

export interface RefundDto {
  items: { invoiceItemId: string; quantity: number }[];
  notes?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  occurredAt: string;
  notes: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Owner' | 'Manager' | 'Employee';
  salaryMonthly: number;
  isActive: boolean;
  permissions: PermissionEntry[];
  createdAt: string;
}

export interface PermissionEntry {
  id?: string;
  key: string;
  isEnabled: boolean;
}

export interface Lead {
  id: string;
  customerName: string;
  customerPhone: string;
  source: 'WhatsAppClick' | 'FollowUpRequest' | 'Inquiry';
  status: 'New' | 'Interested' | 'NoResponse' | 'Sold';
  targetItemId: string | null;
  targetTitleSnapshot: string;
  targetPriceSnapshot: number | null;
  pageUrl: string | null;
  buttonLocation: string | null;
  createdAt: string;
}

export interface DashboardData {
  totalSales: number;
  totalExpenses: number;
  netAfterExpenses: number;
  invoicesCount: number;
  devicesSoldCount: number;
  accessoriesSoldQty: number;
  leadsCount: number;
  itemsInStock: number;
  salesTrend: TrendPoint[];
  leadsTrend: TrendPoint[];
  topItemTypes: TopItemType[];
  topLeadsTargets: TopLeadTarget[];
  lowStockItems: AlertItem[];
  missingImagesItems: AlertItem[];
  missingPriceItems: AlertItem[];
  recentInvoices: RecentInvoice[];
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TopItemType {
  name: string;
  soldCount: number;
  revenue: number;
}

export interface TopLeadTarget {
  itemTitle: string;
  leadCount: number;
}

export interface AlertItem {
  id: string;
  title: string;
  quantity?: number;
}

export interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  total: number;
  paymentMethod: string;
  isRefund: boolean;
  createdAt: string;
}

export interface WhatsAppClickDto {
  targetType: 'Item' | 'General';
  targetId?: string;
  targetTitle?: string;
  pageUrl: string;
}

export interface FollowUpRequest {
  phone: string;
  name?: string;
  message?: string;
  targetItemId?: string;
}
