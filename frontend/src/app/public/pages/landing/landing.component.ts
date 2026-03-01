import { Component, inject, signal, computed, OnInit, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { I18nService } from '../../../core/services/i18n.service';
import { environment } from '../../../../environments/environment';
import { resolveImageUrl } from '../../../core/utils/image.utils';

interface PublicTenant {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
}


@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly el = inject(ElementRef);
  readonly i18n = inject(I18nService);
  readonly resolveImg = resolveImageUrl;
  private observer: IntersectionObserver | null = null;
  private counterAnimated = false;

  readonly tenants = signal<PublicTenant[]>([]);
  readonly billingAnnual = signal(true);
  showSignupModal = signal(false);
  signupSuccess = signal(false);
  signupError = signal<string | null>(null);
  isSubmittingForm = signal(false);
  mobileMenuOpen = signal(false);
  navScrolled = signal(false);

  signupForm = {
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    whatsApp: '',
    password: '',
    city: '',
    address: '',
    storeType: 'phones',
    agreeTerms: false
  };

  expandedFaq = signal<number | null>(null);

  counterStores = signal(0);
  counterUptime = signal(0);
  counterSupport = signal(0);

  // ── Carousel for stores ──
  carouselOffset = signal(0);
  private carouselTimer: ReturnType<typeof setInterval> | null = null;
  private readonly CARD_WIDTH = 176; // 160px card + 16px gap

  /** Triple the tenants array for seamless infinite loop */
  carouselTenants = computed(() => {
    const t = this.tenants();
    return t.length > 0 ? [...t, ...t, ...t] : [];
  });

  ngOnInit(): void {
    this.http.get<{ success: boolean; data: PublicTenant[] }>(`${environment.apiBaseUrl}/api/v1/Public/tenants`).subscribe({
      next: res => {
        this.tenants.set(res?.data || []);
        this.startCarouselAutoScroll();
      },
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onScroll);
    }
  }

  private onScroll = (): void => {
    this.navScrolled.set(window.scrollY > 20);
  };

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          if (entry.target.classList.contains('counter-trigger') && !this.counterAnimated) {
            this.counterAnimated = true;
            this.animateCounters();
          }
          this.observer?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    setTimeout(() => {
      const reveals = this.el.nativeElement.querySelectorAll('.reveal-on-scroll');
      reveals.forEach((el: Element) => this.observer?.observe(el));
    }, 100);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.carouselTimer) clearInterval(this.carouselTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  private animateCounters(): void {
    this.animateCounter(0, 500, 2000, (v) => this.counterStores.set(v));
    this.animateCounter(0, 99, 1800, (v) => this.counterUptime.set(v));
    this.animateCounter(0, 24, 1500, (v) => this.counterSupport.set(v));
  }

  private animateCounter(from: number, to: number, duration: number, setter: (v: number) => void): void {
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setter(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ── Carousel controls ──
  startCarouselAutoScroll(): void {
    if (this.tenants().length <= 4) return;
    this.carouselTimer = setInterval(() => this.carouselNext(), 3000);
  }

  carouselNext(): void {
    const total = this.tenants().length;
    if (total === 0) return;
    const maxOffset = total * this.CARD_WIDTH;
    let next = this.carouselOffset() + this.CARD_WIDTH;
    if (next >= maxOffset * 2) next = maxOffset; // wrap around
    this.carouselOffset.set(next);
  }

  carouselPrev(): void {
    const total = this.tenants().length;
    if (total === 0) return;
    let prev = this.carouselOffset() - this.CARD_WIDTH;
    if (prev < 0) prev = total * this.CARD_WIDTH + prev;
    this.carouselOffset.set(prev);
  }

  onCardMouseMove(event: MouseEvent): void {
    const card = (event.currentTarget as HTMLElement);
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  }

  onCardMouseLeave(event: MouseEvent): void {
    const card = (event.currentTarget as HTMLElement);
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }

  toggleFaq(index: number): void {
    this.expandedFaq.set(this.expandedFaq() === index ? null : index);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  visitStore(slug: string): void {
    this.router.navigate(['/store', slug]);
  }

  scrollTo(id: string): void {
    this.mobileMenuOpen.set(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  toggleLang(): void {
    this.i18n.toggle();
  }

  openStoreSignup(): void {
    this.showSignupModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeSignupModal(): void {
    this.showSignupModal.set(false);
    this.signupSuccess.set(false);
    this.signupError.set(null);
    this.resetForm();
    document.body.style.overflow = 'auto';
  }

  submitStoreSignup(): void {
    const t = (k: string) => this.i18n.t(k);
    const isAr = this.i18n.lang() === 'ar';

    if (!this.signupForm.storeName.trim()) { this.signupError.set(t('common.required')); return; }
    if (!this.signupForm.ownerName.trim()) { this.signupError.set(t('common.required')); return; }
    if (!this.signupForm.email.trim()) { this.signupError.set(isAr ? 'البريد الإلكتروني مطلوب' : 'Email is required'); return; }
    if (!this.signupForm.phone.trim()) { this.signupError.set(t('common.required')); return; }
    if (!this.signupForm.password || this.signupForm.password.length < 6) {
      this.signupError.set(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (!this.signupForm.agreeTerms) { this.signupError.set(t('signup.agree')); return; }

    this.isSubmittingForm.set(true);
    this.signupError.set(null);

    const payload = {
      storeName: this.signupForm.storeName,
      category: this.signupForm.storeType,
      location: this.signupForm.city || '',
      ownerName: this.signupForm.ownerName,
      email: this.signupForm.email,
      phone: this.signupForm.phone,
      whatsApp: this.signupForm.whatsApp || this.signupForm.phone,
      address: this.signupForm.address,
      password: this.signupForm.password,
      numberOfStores: '1',
      source: 'landing-page',
      agreeTerms: this.signupForm.agreeTerms
    };

    this.http.post(`${environment.apiBaseUrl}/api/v1/stores/register`, payload).subscribe({
      next: () => {
        this.signupSuccess.set(true);
        this.isSubmittingForm.set(false);
        setTimeout(() => this.closeSignupModal(), 4000);
      },
      error: (error: any) => {
        this.isSubmittingForm.set(false);
        const msg = error?.error?.message || error?.message || this.i18n.t('signup.error');
        this.signupError.set(msg);
      }
    });
  }

  private resetForm(): void {
    this.signupForm = {
      storeName: '', ownerName: '', email: '', phone: '', whatsApp: '',
      password: '', city: '', address: '', storeType: 'phones', agreeTerms: false
    };
  }
}

