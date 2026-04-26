import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg aria-hidden="true">
      <use [attr.href]="'/icons.svg#' + name()"></use>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      width: 1em;
      height: 1em;
      fill: none;
      stroke: currentColor;
    }
  `]
})
export class IconComponent {
  name = input.required<string>(); 
}