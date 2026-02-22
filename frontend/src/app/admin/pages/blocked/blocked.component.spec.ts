import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BlockedComponent } from './blocked.component';

describe('BlockedComponent', () => {
  let component: BlockedComponent;
  let fixture: ComponentFixture<BlockedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlockedComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BlockedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display access denied message', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Access Denied');
  });
});
