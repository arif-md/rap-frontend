import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss', '../../app.scss'],
  standalone: true,
    imports: [
        NgClass,
        RouterLink,
    ]
})
export class HeaderComponent {
    dirty: boolean;
    envName: string;
    appVersion: string;

    constructor() {
        this.dirty = false;
        this.envName = 'Local';
        this.appVersion = '0.0.1-SNAPSHOT';
    }
}
