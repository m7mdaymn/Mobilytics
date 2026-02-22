import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { SettingsStore } from '../stores/settings.store';
import { WhatsAppClickDto, FollowUpRequest } from '../models/item.models';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  constructor(
    private readonly api: ApiService,
    private readonly settingsStore: SettingsStore
  ) {}

  clickAndOpen(dto: WhatsAppClickDto): Observable<unknown> {
    return this.api.post('/Public/whatsapp-click', dto).pipe(
      tap(() => {
        const settings = this.settingsStore.settings();
        if (!settings?.whatsappNumber) return;

        const message = this.buildInquiryMessage(
          settings.whatsappInquiryTemplate,
          dto.targetTitle || '',
          dto.pageUrl,
          settings.storeName
        );

        const phone = settings.whatsappNumber.replace(/\D/g, '');
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      })
    );
  }

  sendFollowUp(request: FollowUpRequest): Observable<unknown> {
    return this.api.post('/Public/follow-up', request);
  }

  openFollowUpWhatsApp(phone: string, itemTitle: string): void {
    const settings = this.settingsStore.settings();
    if (!settings) return;

    const template = settings.whatsappFollowUpTemplate || 'Hi {name}, following up about {item} from {store}.';
    const message = template
      .replace('{item}', itemTitle)
      .replace('{store}', settings.storeName)
      .replace('{name}', '');

    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  private buildInquiryMessage(
    template: string,
    itemTitle: string,
    pageUrl: string,
    storeName: string
  ): string {
    if (!template) {
      return `Hi, I'm interested in "${itemTitle}" from ${storeName}.\n${pageUrl}`;
    }
    return template
      .replace('{item}', itemTitle)
      .replace('{store}', storeName)
      .replace('{url}', pageUrl);
  }
}
