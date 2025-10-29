import { Component, inject, OnInit } from '@angular/core';
import { AppConfigService } from '@app/global-services';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-version-info',
  template: `
    <div class="version-container" [ngClass]="{'dev-version': isDev, 'prod-version': !isDev}">
      <div class="version-main" [title]="versionTooltip">
        <span class="version-label">v</span>{{ displayVersion }}
      </div>
      <div class="build-info" *ngIf="showBuildInfo" [title]="buildTooltip">
        <small>{{ buildDate }}</small>
      </div>
    </div>
  `,
  styles: [`
    .version-container {
      text-align: right;
      font-family: 'Courier New', monospace;
      line-height: 1.2;
    }
    
    .version-main {
      font-weight: 600;
      font-size: 0.9rem;
      cursor: help;
    }
    
    .version-label {
      opacity: 0.7;
      margin-right: 2px;
    }
    
    .build-info {
      font-size: 0.7rem;
      opacity: 0.8;
      margin-top: 2px;
    }
    
    .dev-version {
      color: #ffd700;
    }
    
    .dev-version .version-main {
      border-left: 3px solid #ffd700;
      padding-left: 8px;
    }
    
    .prod-version {
      color: #90ee90;
    }
    
    @media (max-width: 768px) {
      .build-info {
        display: none;
      }
      .version-main {
        font-size: 0.8rem;
      }
    }
  `],
  standalone: true,
  imports: [NgClass, NgIf]
})
export class VersionInfoComponent implements OnInit {
  private appConfigService = inject(AppConfigService);
  
  displayVersion = '0.0.1';
  buildDate = '';
  gitSha = '';
  gitRef = '';
  envName = 'local';
  versionTooltip = '';
  buildTooltip = '';
  isDev = true;
  showBuildInfo = true;

  ngOnInit() {
    this.appConfigService.loadEnvProperties().subscribe(props => {
      if (props) {
        this.displayVersion = props.buildVersion || props.version || '0.0.1';
        this.buildDate = props.buildDate || '';
        this.gitSha = props.gitSha || '';
        this.gitRef = props.gitRef || '';
        this.envName = props.appEnvName || 'local';
        
        this.isDev = this.envName.toLowerCase().includes('dev') || 
                     this.envName.toLowerCase().includes('snapshot') ||
                     this.displayVersion.includes('SNAPSHOT');
        
        this.versionTooltip = `Version: ${this.displayVersion}\nEnvironment: ${this.envName}${this.gitSha ? '\nCommit: ' + this.gitSha : ''}`;
        this.buildTooltip = `Build Date: ${this.buildDate}\nBranch: ${this.gitRef}`;
      }
    });
  }
}