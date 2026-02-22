import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display page info', () => {
    component.currentPage = 1;
    component.totalPages = 5;
    component.totalCount = 50;
    component.pageSize = 10;
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('1');
  });

  it('should emit page change on next', () => {
    component.currentPage = 1;
    component.totalPages = 5;
    component.totalCount = 50;
    component.pageSize = 10;
    fixture.detectChanges();

    spyOn(component.pageChange, 'emit');
    component.onPage(2);
    expect(component.pageChange.emit).toHaveBeenCalledWith(2);
  });

  it('should not go below page 1', () => {
    component.currentPage = 1;
    component.totalPages = 5;
    spyOn(component.pageChange, 'emit');
    component.onPage(0);
    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });

  it('should not go beyond total pages', () => {
    component.currentPage = 5;
    component.totalPages = 5;
    spyOn(component.pageChange, 'emit');
    component.onPage(6);
    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });
});
