import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface SuccessDialogData {
  applicationCode: string;
}

@Component({
  selector: 'app-success-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="success-dialog">
      <div class="success-icon-container">
        <mat-icon class="success-icon">check_circle</mat-icon>
      </div>
      
      <h2 mat-dialog-title class="dialog-title">Application Submitted Successfully!</h2>
      
      <mat-dialog-content class="dialog-content">
        <p class="success-message">Your application has been submitted successfully.</p>
        
        <div class="application-code-box">
          <p class="code-label">Your Application Number:</p>
          <p class="application-code">{{ data.applicationCode }}</p>
        </div>
        
        <p class="info-text">
          Please save this application number for future reference. 
          You can track your application status in the "My Applications" tab on your dashboard.
        </p>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button mat-raised-button 
                color="primary" 
                (click)="onClose()"
                class="ok-button">
          OK
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .success-dialog {
      text-align: center;
      padding: 16px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .success-icon-container {
      margin-bottom: 16px;
    }

    .success-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
    }

    .dialog-title {
      font-size: 22px;
      font-weight: 600;
      color: #333;
      margin: 0 0 16px 0;
    }

    .dialog-content {
      padding: 16px 0;
      max-height: none;
    }

    .success-message {
      font-size: 15px;
      color: #666;
      margin-bottom: 16px;
    }

    .application-code-box {
      background-color: #f5f5f5;
      border: 2px solid #4caf50;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }

    .code-label {
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .application-code {
      font-size: 20px;
      font-weight: 700;
      color: #4caf50;
      margin: 0;
      font-family: 'Courier New', monospace;
      word-break: break-all;
    }

    .info-text {
      font-size: 13px;
      color: #666;
      margin-top: 16px;
      line-height: 1.5;
    }

    .dialog-actions {
      justify-content: center;
      padding: 16px 0 0 0;
    }

    .ok-button {
      min-width: 120px;
      font-size: 16px;
    }
  `]
})
export class SuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SuccessDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
