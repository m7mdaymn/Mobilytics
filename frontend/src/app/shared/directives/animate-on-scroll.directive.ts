import { Directive, ElementRef, Input, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Directive that observes elements entering the viewport and triggers
 * CSS animations via the `data-animate` attribute.
 *
 * Usage:
 *   <div appAnimateOnScroll="fade-up">...</div>
 *   <div appAnimateOnScroll="scale-in" [animateDelay]="200">...</div>
 *
 * Available animations: fade-up, fade-down, fade-left, fade-right, scale-in, slide-up, bounce-in
 */
@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true,
})
export class AnimateOnScrollDirective implements OnInit, OnDestroy {
  @Input('appAnimateOnScroll') animation = 'fade-up';
  @Input() animateDelay = 0;
  @Input() animateThreshold = 0.15;

  private observer?: IntersectionObserver;

  constructor(
    private el: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const element = this.el.nativeElement;
    element.setAttribute('data-animate', this.animation);

    if (this.animateDelay > 0) {
      element.style.animationDelay = `${this.animateDelay}ms`;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: this.animateThreshold },
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
