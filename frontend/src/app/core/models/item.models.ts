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
  categoryId: string | null;
  categoryName: string;
  itemTypeId: string;
  itemTypeName: string;

  // Inventory
  quantity: number;
  lowStockThreshold: number;
  isDevice: boolean;
  isStockItem: boolean;

  // Identifiers
  imei: string | null;
  serialNumber: string | null;

  // Tax
  taxStatus: 'Taxable' | 'Exempt';
  vatPercent: number;

  // Images
  mainImageUrl: string | null;
  galleryImages: ItemImage[];

  // Custom fields
  customFieldValues: CustomFieldValue[];

  // Checklist
  checklist: ChecklistItem[];

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
  status: string;
  isFeatured?: boolean;
  brandId?: string;
  categoryId?: string;
  itemTypeId: string;
  quantity?: number;
  lowStockThreshold?: number;
  imei?: string;
  serialNumber?: string;
  taxStatus: string;
  vatPercent?: number;
  customFieldValues?: { fieldId: string; value: string }[];
  checklist?: { key: string; passed: boolean; notes?: string }[];
}

export type ItemUpdateDto = Partial<ItemCreateDto>;

export interface ItemQueryParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDescending?: boolean;
  itemTypeSlug?: string;
  categorySlug?: string;
  brandSlug?: string;
  condition?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
}

export interface ItemType {
  id: string;
  name: string;
  slug: string;
  isDevice: boolean;
  isStockItem: boolean;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
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
  sortOrder: number;
  children: Category[];
  itemCount: number;
  createdAt: string;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  fieldType: 'Text' | 'Number' | 'Boolean' | 'Select';
  options: string[];
  isRequired: boolean;
  sortOrder: number;
}

export interface HomeSection {
  id: string;
  type: 'BannerSlider' | 'FeaturedItems' | 'NewArrivals' | 'CategoriesShowcase' | 'BrandsCarousel' | 'Testimonials' | 'CustomHtml';
  sectionType: string;
  title: string;
  isActive: boolean;
  isVisible: boolean;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  htmlContent: string | null;
  items: HomeSectionItem[];
}

export interface HomeSectionItem {
  id: string;
  title: string;
  imageUrl: string;
  linkType: 'Item' | 'Category' | 'Brand' | 'Url';
  linkValue: string;
  ctaText: string;
  sortOrder: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  netAmount: number;
  paymentMethod: string;
  notes: string;
  status: 'Paid' | 'Pending' | 'Completed' | 'Refunded' | 'PartialRefund';
  lines: InvoiceLine[];
  createdAt: string;
  createdByName: string;
}

export interface InvoiceLine {
  id: string;
  itemId: string;
  itemTitle: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceCreateDto {
  customerName?: string;
  customerPhone?: string;
  lines: { itemId: string; quantity: number; unitPrice: number }[];
  discountAmount?: number;
  paymentMethod: string;
  notes?: string;
}

export interface RefundDto {
  type: 'Full' | 'Partial';
  reason: string;
  lineIds?: string[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  date: string;
  reference: string;
  notes: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  fullName: string;
  name: string;
  email: string;
  phone: string;
  role: 'Owner' | 'Manager' | 'Employee';
  salary: number;
  salaryMonthly: number;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
}

export interface Lead {
  id: string;
  phone: string;
  name: string;
  message: string;
  itemTitle: string;
  source: 'WhatsApp' | 'FollowUp' | 'WalkIn' | 'Referral' | 'WhatsAppClick' | 'FollowUpRequest';
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost' | 'Interested' | 'NoResponse' | 'Sold';
  targetItemId: string | null;
  targetItemTitle: string;
  createdAt: string;
}

export interface DashboardData {
  salesToday: number;
  invoicesCount: number;
  devicesSold: number;
  accessoriesSoldQty: number;
  leadsToday: number;
  expensesToday: number;
  netAfterExpenses: number;
  salesTrend: TrendPoint[];
  leadsTrend: TrendPoint[];
  topItemTypes: TopItemType[];
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TopItemType {
  name: string;
  count: number;
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
