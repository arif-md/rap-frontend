import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Attachment } from './attachment.model';
import { AttachmentsService } from './attachments.service';

export interface AttachmentsDialogData {
  applicationId: number;
}

@Component({
  selector: 'app-attachments-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Attachments</h2>

    <mat-dialog-content class="attachments-content">
      <div class="loading-row" *ngIf="loading">
        <mat-spinner diameter="28"></mat-spinner>
      </div>

      <p class="empty-message" *ngIf="!loading && attachments.length === 0">
        No attachments found for this application.
      </p>

      <p class="error-message" *ngIf="!loading && errorMessage">{{ errorMessage }}</p>

      <table class="attachments-table" *ngIf="!loading && attachments.length > 0">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let attachment of attachments"
              class="attachment-row"
              (click)="onDownload(attachment)"
              [class.downloading]="downloadingId === attachment.id">
            <td>
              <mat-icon class="row-icon">description</mat-icon>
              {{ attachment.fileName }}
            </td>
            <td>{{ attachment.createdAt | date:'short' }}</td>
          </tr>
        </tbody>
      </table>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-raised-button color="primary" (click)="dialogRef.close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .attachments-content {
      min-width: 420px;
      max-height: 60vh;
    }

    .loading-row {
      display: flex;
      justify-content: center;
      padding: 24px 0;
    }

    .empty-message, .error-message {
      color: #666;
      text-align: center;
      padding: 16px 0;
    }

    .error-message {
      color: #c62828;
    }

    .attachments-table {
      width: 100%;
      border-collapse: collapse;
    }

    .attachments-table th {
      text-align: left;
      font-size: 12px;
      color: #666;
      border-bottom: 1px solid #e0e0e0;
      padding: 8px;
    }

    .attachment-row {
      cursor: pointer;
    }

    .attachment-row:hover {
      background-color: #f5f5f5;
    }

    .attachment-row.downloading {
      opacity: 0.6;
      pointer-events: none;
    }

    .attachment-row td {
      padding: 10px 8px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
    }

    .row-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      vertical-align: middle;
      margin-right: 6px;
      color: #666;
    }

    .dialog-actions {
      justify-content: flex-end;
    }
  `]
})
export class AttachmentsDialogComponent implements OnInit {
  attachments: Attachment[] = [];
  loading = true;
  errorMessage: string | null = null;
  downloadingId: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<AttachmentsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AttachmentsDialogData,
    private attachmentsService: AttachmentsService
  ) {}

  ngOnInit(): void {
    this.attachmentsService.list(this.data.applicationId).subscribe({
      next: (attachments) => {
        this.attachments = attachments;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load attachments for this application.';
        this.loading = false;
      }
    });
  }

  onDownload(attachment: Attachment): void {
    if (this.downloadingId) {
      return;
    }
    this.downloadingId = attachment.id;

    this.attachmentsService.download(this.data.applicationId, attachment.id).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = attachment.fileName;
        link.click();
        URL.revokeObjectURL(objectUrl);
        this.downloadingId = null;
      },
      error: () => {
        this.errorMessage = `Unable to download "${attachment.fileName}".`;
        this.downloadingId = null;
      }
    });
  }
}
