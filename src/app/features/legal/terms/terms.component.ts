import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { LangSwitcherComponent } from '../../../shared/components/lang-switcher.component';

@Component({
  selector: 'kipa-terms',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, LangSwitcherComponent, TranslocoModule],
  templateUrl: './terms.component.html',
  styleUrl: '../legal.shared.scss',
})
export class TermsComponent {
  readonly ArrowLeft = ArrowLeft;
}
