import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SettingsStore } from './settings.store';
import { StoreSettings } from '../models/settings.models';

function makeSettings(overrides: Partial<StoreSettings> = {}): StoreSettings {
  return {
    storeName: 'Test Store',
    isActive: true,
    primaryColor: '#111827',
    secondaryColor: '#374151',
    accentColor: '#f59e0b',
    themePresetId: 1,
    currencyCode: 'EGP',
    whatsAppNumber: '+201234567890',
    phoneNumber: '+201234567890',
    poweredByEnabled: true,
    footerAddress: '123 Test St',
    workingHours: '9-5',
    mapUrl: '',
    socialLinksJson: '{}',
    headerNoticeText: '',
    aboutTitle: 'About',
    aboutDescription: 'Test desc',
    aboutImageUrl: '',
    heroBannersJson: '[]',
    testimonialsJson: '[]',
    faqJson: '[]',
    trustBadgesJson: '[]',
    policiesJson: '{}',
    pwaSettingsJson: '{}',
    logoUrl: null,
    ...overrides,
  } as StoreSettings;
}

describe('SettingsStore', () => {
  let store: SettingsStore;
  let httpMock: HttpTestingController;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    store = TestBed.inject(SettingsStore);
    httpMock = TestBed.inject(HttpTestingController);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should start with loading=true', () => {
    expect(store.loading()).toBeTrue();
  });

  it('should start with null settings', () => {
    expect(store.settings()).toBeNull();
  });

  it('should default storeName to Store', () => {
    expect(store.storeName()).toBe('Store');
  });

  it('should default currency to EGP', () => {
    expect(store.currency()).toBe('EGP');
  });

  it('should load settings and update state', () => {
    const settings = makeSettings({ storeName: 'My Shop', currencyCode: 'USD' });
    store.loadSettings().subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/Public/settings'));
    req.flush(settings);

    expect(store.settings()).toEqual(settings);
    expect(store.storeName()).toBe('My Shop');
    expect(store.currency()).toBe('USD');
    expect(store.loading()).toBeFalse();
    expect(store.error()).toBeNull();
  });

  it('should handle load error gracefully', () => {
    store.loadSettings().subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/Public/settings'));
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });

    expect(store.settings()).toBeNull();
    expect(store.loading()).toBeFalse();
    expect(store.error()).toBeTruthy();
  });

  it('should set document title on load', () => {
    const settings = makeSettings({ storeName: 'Gadget Zone' });
    store.loadSettings().subscribe();
    httpMock.expectOne(r => r.url.includes('/Public/settings')).flush(settings);

    expect(document.title).toBe('Gadget Zone | Mobilytics');
  });

  it('should set CSS custom properties on load', () => {
    const settings = makeSettings({
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
      accentColor: '#0000ff',
    });
    store.loadSettings().subscribe();
    httpMock.expectOne(r => r.url.includes('/Public/settings')).flush(settings);

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-primary')).toBe('#ff0000');
    expect(root.style.getPropertyValue('--color-secondary')).toBe('#00ff00');
    expect(root.style.getPropertyValue('--color-accent')).toBe('#0000ff');
  });

  it('should update favicon on load with logo', () => {
    const settings = makeSettings({ logoUrl: 'https://cdn.example.com/logo.png' });
    store.loadSettings().subscribe();
    httpMock.expectOne(r => r.url.includes('/Public/settings')).flush(settings);

    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(link).toBeTruthy();
    expect(link.href).toContain('logo.png');
  });

  it('should set default favicon when logoUrl is null', () => {
    const settings = makeSettings({ logoUrl: null });
    store.loadSettings().subscribe();
    httpMock.expectOne(r => r.url.includes('/Public/settings')).flush(settings);

    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(link).toBeTruthy();
    expect(link.href).toContain('icon-192x192.png');
  });

  it('should add theme-color meta tag', () => {
    const settings = makeSettings({ primaryColor: '#123456' });
    store.loadSettings().subscribe();
    httpMock.expectOne(r => r.url.includes('/Public/settings')).flush(settings);

    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    expect(meta).toBeTruthy();
    expect(meta.content).toBe('#123456');
  });

  it('should add theme class to body', () => {
    const settings = makeSettings({ themePresetId: 3 });
    store.loadSettings().subscribe();
    httpMock.expectOne(r => r.url.includes('/Public/settings')).flush(settings);

    expect(document.body.classList.contains('theme-3')).toBeTrue();
  });

  it('should compute isActive correctly', () => {
    expect(store.isActive()).toBeFalse();

    const settings = makeSettings({ isActive: true });
    store.loadSettings().subscribe();
    httpMock.expectOne(r => r.url.includes('/Public/settings')).flush(settings);
    expect(store.isActive()).toBeTrue();
  });

  it('should parse heroBanners JSON', () => {
    const banners = [{ imageUrl: 'test.png', title: 'Hi', subtitle: 'sub', linkUrl: '/' }];
    const settings = makeSettings({ heroBannersJson: JSON.stringify(banners) });
    store.loadSettings().subscribe();
    httpMock.expectOne(r => r.url.includes('/Public/settings')).flush(settings);

    expect(store.heroBanners().length).toBe(1);
    expect(store.heroBanners()[0].title).toBe('Hi');
  });

  it('should handle invalid JSON in heroBanners gracefully', () => {
    const settings = makeSettings({ heroBannersJson: 'not-json' });
    store.loadSettings().subscribe();
    httpMock.expectOne(r => r.url.includes('/Public/settings')).flush(settings);

    expect(store.heroBanners()).toEqual([]);
  });

  it('should parse socialLinks JSON', () => {
    const links = { facebook: 'fb.com/test', instagram: 'ig.com/test' };
    const settings = makeSettings({ socialLinksJson: JSON.stringify(links) });
    store.loadSettings().subscribe();
    httpMock.expectOne(r => r.url.includes('/Public/settings')).flush(settings);

    expect(store.socialLinks()['facebook']).toBe('fb.com/test');
  });

  it('should create dynamic manifest link', () => {
    const settings = makeSettings({ storeName: 'PWA Store' });
    store.loadSettings().subscribe();
    httpMock.expectOne(r => r.url.includes('/Public/settings')).flush(settings);

    const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    expect(link).toBeTruthy();
    expect(link.href).toContain('blob:');
  });
});
