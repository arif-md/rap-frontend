import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApplicationViewService, ApplicationDetail } from './application-view.service';

@Component({
  selector: 'app-application-view',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './application-view.component.html',
  styleUrl: './application-view.component.scss'
})
export class ApplicationViewComponent implements OnInit {
  application: ApplicationDetail | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationViewService: ApplicationViewService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage = 'Invalid application id.';
      return;
    }
    this.loadApplication(id);
  }

  private loadApplication(id: number): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.applicationViewService.getApplication(id).subscribe({
      next: (application) => {
        this.application = application;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading application:', error);
        this.errorMessage = 'Unable to load application details.';
        this.isLoading = false;
      }
    });
  }

  onDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
