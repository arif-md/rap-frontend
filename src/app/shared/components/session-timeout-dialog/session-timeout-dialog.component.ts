import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

export interface SessionTimeoutDialogData {
  countdownSeconds: number;
}

@Component({
  selector: 'app-session-timeout-dialog',
  templateUrl: './session-timeout-dialog.component.html',
  styleUrls: ['./session-timeout-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class SessionTimeoutDialogComponent implements OnInit, OnDestroy {
  remainingSeconds: number;
  private timerSubscription: Subscription | null = null;

  constructor(
    public dialogRef: MatDialogRef<SessionTimeoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SessionTimeoutDialogData
  ) {
    this.remainingSeconds = data.countdownSeconds;
  }

  ngOnInit(): void {
    // Start countdown
    this.timerSubscription = interval(1000).subscribe(() => {
      this.remainingSeconds--;
      
      if (this.remainingSeconds <= 0) {
        // Time's up - close dialog and don't extend session
        this.dialogRef.close(false);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  /**
   * User chooses to extend session
   */
  extendSession(): void {
    this.dialogRef.close(true);
  }

  /**
   * User chooses to logout
   */
  logout(): void {
    this.dialogRef.close(false);
  }

  /**
   * Format seconds as MM:SS
   */
  getFormattedTime(): string {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
