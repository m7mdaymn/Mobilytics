import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ItemCardComponent } from './item-card.component';

describe('ItemCardComponent', () => {
  let component: ItemCardComponent;
  let fixture: ComponentFixture<ItemCardComponent>;

  const mockItem: any = {
    id: '1',
    title: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    price: 1199,
    oldPrice: 1299,
    condition: 'New',
    status: 'Available',
    mainImageUrl: '/img/phone.jpg',
    brandName: 'Apple',
    itemTypeName: 'Smartphones',
    currency: 'USD',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemCardComponent);
    component = fixture.componentInstance;
    component.item = mockItem;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display item title', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('iPhone 15 Pro');
  });

  it('should display price', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('1,199');
  });

  it('should show condition badge for Used items', () => {
    component.item = { ...mockItem, condition: 'Used' };
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Used');
  });
});
