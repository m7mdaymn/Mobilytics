import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TenantNotFoundComponent } from './tenant-not-found.component';

describe('TenantNotFoundComponent', () => {
  let component: TenantNotFoundComponent;
  let fixture: ComponentFixture<TenantNotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantNotFoundComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantNotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display not found message', () => {
    const el = fixture.nativeElement as HTMLElement;
    const text = el.textContent?.toLowerCase() || '';
    expect(text).toContain('not found');
  });
});
