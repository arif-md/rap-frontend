import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationSubmissionService } from './application-submission.service';
import { SuccessDialogComponent } from './success-dialog/success-dialog.component';
import { AuthenticationService } from '@app/global-services';

export interface ApplicationSubmissionRequest {
  applicationName: string;
  university: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  program: string;
  description?: string;
}

@Component({
  selector: 'app-application-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './application-form.component.html',
  styleUrl: './application-form.component.scss'
})
export class ApplicationFormComponent implements OnInit {
  applicationForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  universities = [
    'Harvard University',
    'Stanford University',
    'MIT',
    'Oxford University',
    'Cambridge University',
    'Yale University',
    'Princeton University',
    'Columbia University',
    'University of Chicago',
    'Imperial College London'
  ];

  programs = [
    'Computer Science',
    'Engineering',
    'Business Administration',
    'Medicine',
    'Law',
    'Arts',
    'Sciences',
    'Architecture',
    'Education',
    'Social Sciences'
  ];

  constructor(
    private fb: FormBuilder,
    private applicationService: ApplicationSubmissionService,
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setUserEmail();
  }

  private setUserEmail(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser?.email) {
      this.applicationForm.patchValue({
        email: currentUser.email
      });
    }
  }

  private initializeForm(): void {
    this.applicationForm = this.fb.group({
      applicationName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      university: ['', Validators.required],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\d\s\-()]+$/), Validators.minLength(10)]],
      program: ['', Validators.required],
      description: ['', Validators.maxLength(1000)]
    });
  }

  onSubmit(): void {
    if (this.applicationForm.invalid) {
      this.markFormGroupTouched(this.applicationForm);
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const request: ApplicationSubmissionRequest = this.applicationForm.value;

    this.applicationService.submitApplication(request).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.openSuccessDialog(response.applicationCode);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.handleError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  private openSuccessDialog(applicationCode: string): void {
    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'success-dialog-container',
      data: { applicationCode }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigate(['/dashboard']);
    });
  }

  private handleError(error: any): void {
    if (error.error && typeof error.error === 'object') {
      // Validation errors
      const errors = Object.values(error.error).join(', ');
      this.errorMessage = errors || 'Submission failed. Please try again.';
    } else if (error.error && error.error.error) {
      this.errorMessage = error.error.error;
    } else {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Helper method for template
  hasError(field: string, error: string): boolean {
    const control = this.applicationForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.applicationForm.get(field);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.getFieldLabel(field)} is required`;
    }
    if (control.errors['minlength']) {
      return `${this.getFieldLabel(field)} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['maxlength']) {
      return `${this.getFieldLabel(field)} cannot exceed ${control.errors['maxlength'].requiredLength} characters`;
    }
    if (control.errors['email']) {
      return 'Invalid email format';
    }
    if (control.errors['pattern']) {
      return 'Invalid format';
    }
    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      applicationName: 'Application Name',
      university: 'University',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      program: 'Program',
      description: 'Description'
    };
    return labels[field] || field;
  }
}
