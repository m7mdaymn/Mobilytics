import { Injectable, signal, computed, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Lang = 'en' | 'ar';

const LANG_KEY = 'MOBILYTICS_LANG';

// ────────────────────────────────────────
// Translation dictionary: EN + AR
// ────────────────────────────────────────
const TRANSLATIONS: Record<string, Record<Lang, string>> = {
  // ── Common ──
  'app.name': { en: 'Mobilytics', ar: 'موبيليتكس' },
  'app.tagline': { en: 'The Smart Platform for Phone Stores', ar: 'المنصة الذكية لمحلات الموبايل' },
  'common.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
  'common.save': { en: 'Save', ar: 'حفظ' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'common.delete': { en: 'Delete', ar: 'حذف' },
  'common.edit': { en: 'Edit', ar: 'تعديل' },
  'common.create': { en: 'Create', ar: 'إنشاء' },
  'common.search': { en: 'Search...', ar: 'بحث...' },
  'common.close': { en: 'Close', ar: 'إغلاق' },
  'common.confirm': { en: 'Confirm', ar: 'تأكيد' },
  'common.back': { en: 'Back', ar: 'رجوع' },
  'common.next': { en: 'Next', ar: 'التالي' },
  'common.yes': { en: 'Yes', ar: 'نعم' },
  'common.no': { en: 'No', ar: 'لا' },
  'common.actions': { en: 'Actions', ar: 'إجراءات' },
  'common.status': { en: 'Status', ar: 'الحالة' },
  'common.name': { en: 'Name', ar: 'الاسم' },
  'common.email': { en: 'Email', ar: 'البريد الإلكتروني' },
  'common.phone': { en: 'Phone', ar: 'الهاتف' },
  'common.password': { en: 'Password', ar: 'كلمة المرور' },
  'common.submit': { en: 'Submit', ar: 'إرسال' },
  'common.required': { en: 'This field is required', ar: 'هذا الحقل مطلوب' },
  'common.noData': { en: 'No data found', ar: 'لا توجد بيانات' },
  'common.success': { en: 'Success', ar: 'تم بنجاح' },
  'common.error': { en: 'Error', ar: 'خطأ' },
  'common.all': { en: 'All', ar: 'الكل' },
  'common.active': { en: 'Active', ar: 'نشط' },
  'common.inactive': { en: 'Inactive', ar: 'غير نشط' },

  // ── Auth ──
  'auth.login': { en: 'Login', ar: 'تسجيل الدخول' },
  'auth.logout': { en: 'Logout', ar: 'تسجيل الخروج' },
  'auth.email': { en: 'Email Address', ar: 'البريد الإلكتروني' },
  'auth.password': { en: 'Password', ar: 'كلمة المرور' },
  'auth.loginTitle': { en: 'Sign in to your store', ar: 'تسجيل الدخول للمتجر' },
  'auth.loginBtn': { en: 'Sign In', ar: 'دخول' },
  'auth.loginError': { en: 'Invalid email or password', ar: 'بريد أو كلمة مرور غير صحيحة' },
  'auth.platformLoginTitle': { en: 'Platform Admin Login', ar: 'دخول إدارة المنصة' },
  'auth.unauthorized': { en: 'Unauthorized', ar: 'غير مصرح' },

  // ── Landing ──
  'landing.hero.title': { en: 'Your Phone Store,\nDigitally Empowered', ar: 'محلك للموبايلات،\nبقوة رقمية' },
  'landing.hero.subtitle': { en: 'Complete management platform for phone stores — inventory, invoicing, and a professional online storefront.', ar: 'منصة إدارة متكاملة لمحلات الموبايل — مخزون، فواتير، وواجهة متجر احترافية.' },
  'landing.hero.cta': { en: 'Start Free Trial', ar: 'ابدأ تجربة مجانية' },
  'landing.hero.login': { en: 'Login', ar: 'دخول' },
  'landing.nav.features': { en: 'Features', ar: 'المميزات' },
  'landing.nav.pricing': { en: 'Pricing', ar: 'الأسعار' },
  'landing.nav.faq': { en: 'FAQ', ar: 'الأسئلة الشائعة' },
  'landing.benefits.title': { en: 'Everything you need to run your store', ar: 'كل ما تحتاجه لإدارة محلك' },
  'landing.benefits.inventory': { en: 'Smart Inventory', ar: 'مخزون ذكي' },
  'landing.benefits.inventoryDesc': { en: 'Track phones, accessories, and repairs with IMEI tracking and low-stock alerts.', ar: 'تتبع الموبايلات والإكسسوارات مع متابعة IMEI وتنبيهات المخزون.' },
  'landing.benefits.invoicing': { en: 'Fast Invoicing', ar: 'فواتير سريعة' },
  'landing.benefits.invoicingDesc': { en: 'Create professional invoices in seconds. Tax-ready with automatic calculations.', ar: 'أنشئ فواتير احترافية في ثوانٍ. جاهزة للضرائب مع حساب تلقائي.' },
  'landing.benefits.storefront': { en: 'Online Storefront', ar: 'واجهة متجر أونلاين' },
  'landing.benefits.storefrontDesc': { en: 'Let customers browse your products online and inquire via WhatsApp.', ar: 'اسمح للعملاء بتصفح منتجاتك واستفسارهم عبر واتساب.' },
  'landing.benefits.leads': { en: 'Lead Tracking', ar: 'تتبع العملاء' },
  'landing.benefits.leadsDesc': { en: 'Capture every customer inquiry — WhatsApp clicks, follow-ups, and walk-ins.', ar: 'سجّل كل استفسار عميل — نقرات واتساب، متابعات، وزيارات.' },
  'landing.benefits.employees': { en: 'Team Management', ar: 'إدارة الفريق' },
  'landing.benefits.employeesDesc': { en: 'Manage employees with roles, permissions, and salary tracking.', ar: 'أدِر موظفيك بصلاحيات وأدوار وتتبع رواتب.' },
  'landing.benefits.reports': { en: 'Live Dashboard', ar: 'لوحة تحكم مباشرة' },
  'landing.benefits.reportsDesc': { en: 'Real-time sales, expenses, and trends at a glance.', ar: 'مبيعات ومصاريف واتجاهات لحظية في نظرة واحدة.' },
  'landing.pricing.title': { en: 'Simple, transparent pricing', ar: 'أسعار بسيطة وشفافة' },
  'landing.pricing.activation': { en: 'Activation fee', ar: 'رسوم التفعيل' },
  'landing.pricing.monthly': { en: '/month', ar: '/شهر' },
  'landing.pricing.currency': { en: 'EGP', ar: 'ج.م' },
  'landing.pricing.trial': { en: '14-day free trial', ar: 'تجربة مجانية ١٤ يوم' },
  'landing.faq.title': { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة' },
  'landing.cta.title': { en: 'Ready to modernize your store?', ar: 'مستعد لتطوير محلك؟' },
  'landing.cta.subtitle': { en: 'Join hundreds of phone stores already using Mobilytics.', ar: 'انضم لمئات المحلات التي تستخدم موبيليتكس.' },
  'landing.footer.brand': { en: 'Mobilytics', ar: 'موبيليتكس' },
  'landing.footer.tagline': { en: 'The smart platform for phone stores.', ar: 'المنصة الذكية لمحلات الموبايل.' },
  'landing.footer.product': { en: 'Product', ar: 'المنتج' },
  'landing.footer.legal': { en: 'Legal', ar: 'قانوني' },
  'landing.footer.account': { en: 'Account', ar: 'الحساب' },
  'landing.footer.rights': { en: 'All rights reserved.', ar: 'جميع الحقوق محفوظة.' },

  // ── Signup Modal ──
  'signup.title': { en: 'Open your store', ar: 'افتح متجرك' },
  'signup.storeName': { en: 'Store Name', ar: 'اسم المتجر' },
  'signup.ownerName': { en: 'Owner Name', ar: 'اسم المالك' },
  'signup.phone': { en: 'Phone Number', ar: 'رقم الهاتف' },
  'signup.city': { en: 'City', ar: 'المدينة' },
  'signup.storeType': { en: 'Store Type', ar: 'نوع المتجر' },
  'signup.storeType.phones': { en: 'Phones & Devices', ar: 'موبايلات وأجهزة' },
  'signup.storeType.accessories': { en: 'Accessories', ar: 'إكسسوارات' },
  'signup.storeType.both': { en: 'Both', ar: 'الاثنين' },
  'signup.storeType.repair': { en: 'Repair Center', ar: 'مركز صيانة' },
  'signup.agree': { en: 'I agree to the terms and conditions', ar: 'أوافق على الشروط والأحكام' },
  'signup.submit': { en: 'Register Store', ar: 'تسجيل المتجر' },
  'signup.submitting': { en: 'Sending...', ar: 'جاري الإرسال...' },
  'signup.success': { en: 'Registration submitted! We will contact you soon.', ar: 'تم التسجيل بنجاح! سنتواصل معك قريباً.' },
  'signup.error': { en: 'Error submitting registration. Please try again.', ar: 'خطأ في التسجيل. حاول مرة أخرى.' },

  // ── Admin Nav ──
  'admin.nav.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'admin.nav.items': { en: 'Items', ar: 'المنتجات' },
  'admin.nav.itemTypes': { en: 'Item Types', ar: 'أنواع المنتجات' },
  'admin.nav.brands': { en: 'Brands', ar: 'الماركات' },
  'admin.nav.categories': { en: 'Categories', ar: 'التصنيفات' },
  'admin.nav.homeSections': { en: 'Home Sections', ar: 'أقسام الرئيسية' },
  'admin.nav.invoices': { en: 'Invoices', ar: 'الفواتير' },
  'admin.nav.expenses': { en: 'Expenses', ar: 'المصاريف' },
  'admin.nav.employees': { en: 'Employees', ar: 'الموظفين' },
  'admin.nav.leads': { en: 'Leads', ar: 'العملاء المحتملين' },
  'admin.nav.settings': { en: 'Settings', ar: 'الإعدادات' },

  // ── Admin Dashboard ──
  'dashboard.salesToday': { en: 'Total Sales', ar: 'إجمالي المبيعات' },
  'dashboard.invoices': { en: 'Invoices', ar: 'الفواتير' },
  'dashboard.devicesSold': { en: 'Devices Sold', ar: 'أجهزة مباعة' },
  'dashboard.accessoriesSold': { en: 'Accessories Sold', ar: 'إكسسوارات مباعة' },
  'dashboard.leadsToday': { en: 'Leads', ar: 'عملاء محتملين' },
  'dashboard.expenses': { en: 'Expenses', ar: 'المصاريف' },
  'dashboard.netProfit': { en: 'Net Profit', ar: 'صافي الربح' },
  'dashboard.salesTrend': { en: 'Sales Trend', ar: 'اتجاه المبيعات' },
  'dashboard.topTypes': { en: 'Top Item Types', ar: 'أكثر الأنواع مبيعاً' },
  'dashboard.itemsInStock': { en: 'Items In Stock', ar: 'المنتجات في المخزون' },
  'dashboard.recentInvoices': { en: 'Recent Invoices', ar: 'أحدث الفواتير' },
  'dashboard.lowStock': { en: 'Low Stock Alerts', ar: 'تنبيهات المخزون' },
  'dashboard.missingImages': { en: 'Missing Images', ar: 'صور مفقودة' },
  'dashboard.missingPrices': { en: 'Missing Prices', ar: 'أسعار مفقودة' },
  'dashboard.operationalAlerts': { en: 'Operational Alerts', ar: 'تنبيهات تشغيلية' },
  'dashboard.topLeadTargets': { en: 'Most Inquired Items', ar: 'أكثر المنتجات استفساراً' },
  'dashboard.customer': { en: 'Customer', ar: 'العميل' },
  'dashboard.total': { en: 'Total', ar: 'الإجمالي' },
  'dashboard.payment': { en: 'Payment', ar: 'الدفع' },
  'dashboard.date': { en: 'Date', ar: 'التاريخ' },
  'dashboard.refund': { en: 'Refund', ar: 'مسترجع' },
  'dashboard.viewAll': { en: 'View All', ar: 'عرض الكل' },

  // ── SuperAdmin Nav ──
  'platform.nav.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'platform.nav.tenants': { en: 'Tenants', ar: 'المتاجر' },
  'platform.nav.plans': { en: 'Plans', ar: 'الخطط' },
  'platform.nav.subscriptions': { en: 'Subscriptions', ar: 'الاشتراكات' },
  'platform.nav.storeRequests': { en: 'Store Requests', ar: 'طلبات المتاجر' },
  'platform.nav.features': { en: 'Features', ar: 'المميزات' },

  // ── Platform Dashboard ──
  'platform.totalTenants': { en: 'Total Tenants', ar: 'إجمالي المتاجر' },
  'platform.activeTenants': { en: 'Active Tenants', ar: 'متاجر نشطة' },
  'platform.suspendedTenants': { en: 'Suspended', ar: 'موقوفة' },
  'platform.trialTenants': { en: 'Trial', ar: 'تجريبية' },
  'platform.monthlyRevenue': { en: 'Monthly Revenue', ar: 'الإيراد الشهري' },
  'platform.expiringSubscriptions': { en: 'Expiring Soon', ar: 'تنتهي قريباً' },

  // ── Storefront ──
  'store.home': { en: 'Home', ar: 'الرئيسية' },
  'store.catalog': { en: 'Catalog', ar: 'المنتجات' },
  'store.brands': { en: 'Brands', ar: 'الماركات' },
  'store.compare': { en: 'Compare', ar: 'مقارنة' },
  'store.addToCompare': { en: 'Add to Compare', ar: 'أضف للمقارنة' },
  'store.whatsapp': { en: 'WhatsApp Inquiry', ar: 'استفسار واتساب' },
  'store.followUp': { en: 'Request Follow-up', ar: 'طلب متابعة' },
  'store.price': { en: 'Price', ar: 'السعر' },
  'store.condition': { en: 'Condition', ar: 'الحالة' },
  'store.new': { en: 'New', ar: 'جديد' },
  'store.used': { en: 'Used', ar: 'مستعمل' },
  'store.refurbished': { en: 'Refurbished', ar: 'مجدد' },
  'store.available': { en: 'Available', ar: 'متوفر' },
  'store.sold': { en: 'Sold', ar: 'مباع' },
  'store.poweredBy': { en: 'Powered by Mobilytics', ar: 'مدعوم بواسطة موبيليتكس' },
  'store.installApp': { en: 'Install App', ar: 'تثبيت التطبيق' },
  'store.followUs': { en: 'Follow Us', ar: 'تابعنا' },
  'store.showMap': { en: 'Show Map', ar: 'عرض الخريطة' },
  'store.location': { en: 'Location', ar: 'الموقع' },
  'store.shopNow': { en: 'Shop Now', ar: 'تسوق الآن' },
  'store.viewAll': { en: 'View all', ar: 'عرض الكل' },
  'store.exploreCatalog': { en: 'Explore Full Catalog', ar: 'استكشف الكتالوج الكامل' },
  'store.browseByCategory': { en: 'Browse by category', ar: 'تصفح حسب التصنيف' },
  'store.topBrands': { en: 'Top brands available', ar: 'أفضل الماركات المتوفرة' },
  'store.handPicked': { en: 'Hand-picked products just for you', ar: 'منتجات مختارة لك' },
  'store.latestProducts': { en: 'Latest products in stock', ar: 'أحدث المنتجات' },
  'store.notFound': { en: "Didn't find what you're looking for?", ar: 'لم تجد ما تبحث عنه؟' },
  'store.browseAll': { en: 'Browse our complete collection', ar: 'تصفح مجموعتنا الكاملة' },
  'store.searchItems': { en: 'Search items...', ar: 'بحث عن منتجات...' },
  'store.newest': { en: 'Newest', ar: 'الأحدث' },
  'store.priceLowHigh': { en: 'Price: Low → High', ar: 'السعر: من الأقل' },
  'store.priceHighLow': { en: 'Price: High → Low', ar: 'السعر: من الأعلى' },
  'store.allCategories': { en: 'All Categories', ar: 'كل التصنيفات' },
  'store.allBrands': { en: 'All Brands', ar: 'كل الماركات' },
  'store.allConditions': { en: 'All Conditions', ar: 'كل الحالات' },
  'store.clear': { en: 'Clear', ar: 'مسح' },
  'store.noItems': { en: 'No items found', ar: 'لا توجد منتجات' },
  'store.clearFilters': { en: 'Clear Filters', ar: 'مسح التصفية' },

  // ── Items ──
  'items.title': { en: 'Items', ar: 'المنتجات' },
  'items.addNew': { en: 'Add Item', ar: 'إضافة منتج' },
  'items.editItem': { en: 'Edit Item', ar: 'تعديل منتج' },
  'items.price': { en: 'Price', ar: 'السعر' },
  'items.oldPrice': { en: 'Old Price', ar: 'السعر القديم' },
  'items.condition': { en: 'Condition', ar: 'الحالة' },
  'items.brand': { en: 'Brand', ar: 'الماركة' },
  'items.category': { en: 'Category', ar: 'التصنيف' },
  'items.type': { en: 'Type', ar: 'النوع' },
  'items.quantity': { en: 'Quantity', ar: 'الكمية' },
  'items.featured': { en: 'Featured', ar: 'مميز' },

  // ── Invoices ──
  'invoices.title': { en: 'Invoices', ar: 'الفواتير' },
  'invoices.create': { en: 'Create Invoice', ar: 'إنشاء فاتورة' },
  'invoices.customer': { en: 'Customer Name', ar: 'اسم العميل' },
  'invoices.total': { en: 'Total', ar: 'الإجمالي' },
  'invoices.paid': { en: 'Paid', ar: 'مدفوع' },
  'invoices.refund': { en: 'Refund', ar: 'استرجاع' },

  // ── Expenses ──
  'expenses.title': { en: 'Expenses', ar: 'المصاريف' },
  'expenses.addNew': { en: 'Add Expense', ar: 'إضافة مصروف' },
  'expenses.amount': { en: 'Amount', ar: 'المبلغ' },
  'expenses.category': { en: 'Category', ar: 'التصنيف' },

  // ── Employees ──
  'employees.title': { en: 'Employees', ar: 'الموظفين' },
  'employees.addNew': { en: 'Add Employee', ar: 'إضافة موظف' },
  'employees.role': { en: 'Role', ar: 'الدور' },
  'employees.salary': { en: 'Salary', ar: 'الراتب' },

  // ── Leads ──
  'leads.title': { en: 'Leads', ar: 'العملاء المحتملين' },
  'leads.source': { en: 'Source', ar: 'المصدر' },
  'leads.message': { en: 'Message', ar: 'الرسالة' },

  // ── Settings ──
  'settings.title': { en: 'Store Settings', ar: 'إعدادات المتجر' },
  'settings.general': { en: 'General', ar: 'عام' },
  'settings.theme': { en: 'Theme', ar: 'المظهر' },
  'settings.footer': { en: 'Footer', ar: 'التذييل' },
  'settings.whatsapp': { en: 'WhatsApp', ar: 'واتساب' },
  'settings.pwa': { en: 'PWA', ar: 'تطبيق الويب' },

  // ── Common ──
  'common.quickActions': { en: 'Quick Actions', ar: 'إجراءات سريعة' },
  'common.view': { en: 'View', ar: 'عرض' },
  'common.last7days': { en: 'Last 7 days', ar: 'آخر 7 أيام' },
  'common.last30days': { en: 'Last 30 days', ar: 'آخر 30 يوم' },
  'common.lastYear': { en: 'Last year', ar: 'آخر سنة' },
  'common.custom': { en: 'Custom', ar: 'مخصص' },

  // ── Platform Dashboard Extra ──
  'platform.totalLeads': { en: 'Total Leads (All Tenants)', ar: 'إجمالي العملاء (كل المتاجر)' },
  'platform.recentTenants': { en: 'Recent Tenants', ar: 'أحدث المتاجر' },
  'platform.createTenant': { en: 'Create Tenant', ar: 'إنشاء متجر' },
  'platform.manageSubscriptions': { en: 'Manage Subscriptions', ar: 'إدارة الاشتراكات' },
  'platform.editPlans': { en: 'Edit Plans', ar: 'تعديل الخطط' },

  // ── Admin Dashboard Extra ──
  'dashboard.title': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'dashboard.leadsTrend': { en: 'Leads Trend', ar: 'اتجاه العملاء' },
  'dashboard.newItem': { en: '+ New Item', ar: '+ منتج جديد' },
  'dashboard.createInvoice': { en: '+ Create Invoice', ar: '+ إنشاء فاتورة' },
  'dashboard.addExpense': { en: '+ Add Expense', ar: '+ إضافة مصروف' },

  // ── Language ──
  'lang.switch': { en: 'العربية', ar: 'English' },
  'lang.current': { en: 'EN', ar: 'ع' },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _lang = signal<Lang>('en');

  readonly lang = this._lang.asReadonly();
  readonly isRtl = computed(() => this._lang() === 'ar');
  readonly dir = computed(() => this._lang() === 'ar' ? 'rtl' : 'ltr');

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  init(): void {
    const savedLang = localStorage.getItem(LANG_KEY) as Lang | null;
    const lang = savedLang === 'ar' || savedLang === 'en' ? savedLang : 'en';
    this.setLang(lang);
  }

  setLang(lang: Lang): void {
    this._lang.set(lang);
    localStorage.setItem(LANG_KEY, lang);

    // Update document direction and language
    this.document.documentElement.lang = lang;
    this.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update font family
    if (lang === 'ar') {
      this.document.body.style.fontFamily = "'Cairo', 'Inter', system-ui, sans-serif";
    } else {
      this.document.body.style.fontFamily = "'Inter', system-ui, sans-serif";
    }
  }

  toggle(): void {
    this.setLang(this._lang() === 'en' ? 'ar' : 'en');
  }

  /** Get translation by key */
  t(key: string): string {
    const entry = TRANSLATIONS[key];
    if (!entry) {
      console.warn(`[i18n] Missing translation key: ${key}`);
      return key;
    }
    return entry[this._lang()];
  }

  /** Get all translations for merging into templates */
  static readonly keys = TRANSLATIONS;
}
