import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { I18nService } from '../../../core/services/i18n.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  readonly i18n = inject(I18nService);

  showSignupModal = signal(false);
  signupSuccess = signal(false);
  signupError = signal<string | null>(null);
  isSubmittingForm = signal(false);
  mobileMenuOpen = signal(false);

  signupForm = {
    storeName: '',
    ownerName: '',
    phone: '',
    city: '',
    storeType: 'phones',
    agreeTerms: false
  };

  // FAQ expand state
  expandedFaq = signal<number | null>(null);

  toggleFaq(index: number): void {
    this.expandedFaq.set(this.expandedFaq() === index ? null : index);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
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

    if (!this.signupForm.storeName.trim()) {
      this.signupError.set(t('common.required'));
      return;
    }
    if (!this.signupForm.ownerName.trim()) {
      this.signupError.set(t('common.required'));
      return;
    }
    if (!this.signupForm.phone.trim()) {
      this.signupError.set(t('common.required'));
      return;
    }
    if (!this.signupForm.agreeTerms) {
      this.signupError.set(t('signup.agree'));
      return;
    }

    this.isSubmittingForm.set(true);
    this.signupError.set(null);

    const payload = {
      name: this.signupForm.storeName,
      slug: this.signupForm.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      supportPhone: this.signupForm.phone,
      address: this.signupForm.city || '',
      ownerName: this.signupForm.ownerName,
      ownerEmail: `${this.signupForm.phone.replace(/\D/g, '')}@mobilytics.app`,
      ownerPassword: 'Temp@1234'
    };

    // Use platform tenant creation endpoint (or a public registration if available)
    this.http.post(`${environment.apiBaseUrl}/api/v1/platform/tenants`, payload).subscribe({
      next: () => {
        this.signupSuccess.set(true);
        this.isSubmittingForm.set(false);
        setTimeout(() => this.closeSignupModal(), 3000);
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
      storeName: '',
      ownerName: '',
      phone: '',
      city: '',
      storeType: 'phones',
      agreeTerms: false
    };
  }
}

