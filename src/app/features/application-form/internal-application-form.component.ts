import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApplicationSubmissionService } from './application-submission.service';
import { ApplicationViewService, ApplicationDetail } from '../application-view/application-view.service';
import { AuthenticationService } from '@app/global-services';

// This is the internal-user counterpart to ApplicationFormComponent, reached only via the
// dashboard's "My Tasks" tab "Complete" button (internalGuard-protected route). It mirrors
// that component's task-mode behavior (same fields, same Dashboard/Save/Complete actions,
// same completeTask API call) but adds an "Internal Review" section - a signature pad and
// review date - that must be filled in before Complete is enabled. There is no "create"
// mode here: internal users only ever land on this page to review/complete an existing task.
@Component({
  selector: 'app-internal-application-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './internal-application-form.component.html',
  styleUrl: './internal-application-form.component.scss'
})
export class InternalApplicationFormComponent implements OnInit {
  // A plain `@ViewChild('signatureCanvas') ref!: ElementRef<...>` only resolves once, at the
  // first ngAfterViewInit - but the canvas sits behind `*ngIf="!isLoadingApplication"`, which
  // is still true at that point (the application loads asynchronously), so the element
  // wouldn't exist yet and ctx would never get initialized. A setter-based ViewChild re-fires
  // every time the matched element (re)appears in the DOM, so it correctly picks up the
  // canvas once loading finishes and the *ngIf actually renders it.
  private signatureCanvasElement: HTMLCanvasElement | null = null;

  @ViewChild('signatureCanvas')
  set signatureCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (!ref) {
      return;
    }
    this.signatureCanvasElement = ref.nativeElement;
    const context = this.signatureCanvasElement.getContext('2d');
    if (!context) {
      return;
    }
    this.ctx = context;
    this.ctx.strokeStyle = '#1a1a1a';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  applicationForm!: FormGroup;
  isSaving = false;
  isCompleting = false;
  isLoadingApplication = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  applicationId: number | null = null;
  taskId: number | null = null;
  containerId: string | null = null;

  // The internal dashboard's selected university/tab, passed in via query params so
  // "Dashboard" and "Complete" can navigate back there instead of resetting to the
  // university picker (see Dashboard.onOpenTask / Dashboard.ngOnInit's restore logic).
  private returnUniversityId: number | null = null;
  private returnTab: number | null = null;

  // Internal review section
  reviewDate: string = this.todayIsoDate();
  hasSignature = false;

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;

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
    private applicationViewService: ApplicationViewService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setUserEmail();

    const params = this.route.snapshot.queryParamMap;
    const applicationIdParam = params.get('applicationId');
    const taskIdParam = params.get('taskId');
    const containerIdParam = params.get('containerId');
    const universityIdParam = params.get('universityId');
    const tabParam = params.get('tab');

    this.returnUniversityId = universityIdParam !== null ? Number(universityIdParam) : null;
    this.returnTab = tabParam !== null ? Number(tabParam) : null;

    if (applicationIdParam && taskIdParam && containerIdParam) {
      this.applicationId = Number(applicationIdParam);
      this.taskId = Number(taskIdParam);
      this.containerId = containerIdParam;
      this.loadExistingApplication(this.applicationId);
    } else {
      this.errorMessage = 'Unable to open this task: missing task information.';
    }
  }

  private navigateToDashboard(): void {
    const queryParams: { universityId?: number; tab?: number } = {};
    if (this.returnUniversityId !== null) {
      queryParams.universityId = this.returnUniversityId;
    }
    if (this.returnTab !== null) {
      queryParams.tab = this.returnTab;
    }
    this.router.navigate(['/dashboard'], { queryParams });
  }

  private todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // Signature pad - freehand drawing on a canvas, via the Pointer Events API so mouse,
  // trackpad, touch, and stylus input are all handled through one consistent event model.
  // setPointerCapture on pointerdown is what makes trackpads usable here: without it, a
  // mousedown/mousemove/mouseleave-based pad drops the stroke the instant the (often
  // jittery, fast-moving) trackpad cursor so much as grazes the canvas edge mid-drag,
  // which reads as "click and hold does nothing." Capturing the pointer keeps every
  // subsequent move/up event routed to the canvas regardless of where the cursor ends up.
  private getEventPoint(event: PointerEvent): { x: number; y: number } {
    const rect = this.signatureCanvasElement!.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  startDrawing(event: PointerEvent): void {
    if (!this.signatureCanvasElement || !this.ctx) {
      return;
    }
    event.preventDefault();
    this.isDrawing = true;
    this.signatureCanvasElement.setPointerCapture(event.pointerId);
    const { x, y } = this.getEventPoint(event);
    this.lastX = x;
    this.lastY = y;
  }

  draw(event: PointerEvent): void {
    if (!this.isDrawing) {
      return;
    }
    event.preventDefault();
    const { x, y } = this.getEventPoint(event);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
    this.hasSignature = true;
  }

  stopDrawing(event?: PointerEvent): void {
    this.isDrawing = false;
    const canvas = this.signatureCanvasElement;
    if (event && canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  clearSignature(): void {
    if (!this.signatureCanvasElement || !this.ctx) {
      return;
    }
    this.ctx.clearRect(0, 0, this.signatureCanvasElement.width, this.signatureCanvasElement.height);
    this.hasSignature = false;
  }

  onReviewDateChange(event: Event): void {
    this.reviewDate = (event.target as HTMLInputElement).value;
  }

  get canComplete(): boolean {
    return this.hasSignature && !!this.reviewDate && !this.isSaving && !this.isCompleting;
  }

  private loadExistingApplication(applicationId: number): void {
    this.isLoadingApplication = true;
    this.applicationViewService.getApplication(applicationId).subscribe({
      next: (application: ApplicationDetail) => {
        this.isLoadingApplication = false;
        const { firstName, lastName } = this.splitOwnerName(application.ownerName);
        const { program, phone, description } = this.parseDescription(application.description);
        this.applicationForm.patchValue({
          applicationName: application.applicationName,
          university: application.universityName ?? '',
          firstName,
          lastName,
          email: application.ownerEmail || this.applicationForm.get('email')?.value,
          phone,
          program,
          description
        });
      },
      error: () => {
        this.isLoadingApplication = false;
        this.errorMessage = 'Unable to load the application for this task.';
      }
    });
  }

  // ownerName is stored as a single concatenated "first last" string - split on the
  // first space, best-effort (not reliable for multi-word last names).
  private splitOwnerName(ownerName?: string): { firstName: string; lastName: string } {
    if (!ownerName) {
      return { firstName: '', lastName: '' };
    }
    const parts = ownerName.trim().split(/\s+/);
    return {
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' ')
    };
  }

  // The submission handler writes description as "University: ..\nProgram: ..\nPhone:
  // ..\nAdditional Info: .." - parse that back out so program/phone re-populate and only
  // the user's own free-text ends up back in the description field.
  private parseDescription(raw?: string): { program: string; phone: string; description: string } {
    if (!raw) {
      return { program: '', phone: '', description: '' };
    }
    const programMatch = raw.match(/^Program:\s*(.*)$/m);
    const phoneMatch = raw.match(/^Phone:\s*(.*)$/m);
    const additionalMatch = raw.match(/^Additional Info:\s*([\s\S]*)$/m);

    if (programMatch || phoneMatch || additionalMatch) {
      return {
        program: programMatch?.[1]?.trim() ?? '',
        phone: phoneMatch?.[1]?.trim() ?? '',
        description: additionalMatch?.[1]?.trim() ?? ''
      };
    }

    return { program: '', phone: '', description: raw };
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

  onSave(): void {
    if (this.applicationForm.invalid) {
      this.markFormGroupTouched(this.applicationForm);
      this.errorMessage = 'Please fill in all required fields correctly.';
      this.successMessage = null;
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    const request = {
      ...this.applicationForm.value,
      applicationId: this.applicationId ?? undefined
    };

    this.applicationService.saveApplication(request).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.applicationId = response.applicationId;
        this.successMessage = `Application saved successfully. Application Number: ${response.applicationCode}`;
      },
      error: (error) => {
        this.isSaving = false;
        this.handleError(error);
      }
    });
  }

  onDashboard(): void {
    this.navigateToDashboard();
  }

  onComplete(): void {
    if (!this.taskId || !this.containerId || !this.applicationId) {
      this.errorMessage = 'Unable to complete task: missing task information.';
      return;
    }
    if (!this.hasSignature || !this.signatureCanvasElement) {
      this.errorMessage = 'Please provide your signature before completing this task.';
      return;
    }
    if (!this.reviewDate) {
      this.errorMessage = 'Please enter the review date before completing this task.';
      return;
    }

    this.isCompleting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const signatureImage = this.signatureCanvasElement.toDataURL('image/png');

    this.applicationService
      .completeTaskWithReview(this.taskId, this.containerId, this.applicationId, this.reviewDate, signatureImage)
      .subscribe({
        next: () => {
          this.isCompleting = false;
          this.snackBar.open('Task completed successfully.', 'Close', { duration: 5000 });
          this.navigateToDashboard();
        },
        error: (error) => {
          this.isCompleting = false;
          this.handleError(error);
        }
      });
  }

  private handleError(error: any): void {
    this.successMessage = null;
    if (error.error && typeof error.error === 'object') {
      const errors = Object.values(error.error).join(', ');
      this.errorMessage = errors || 'Action failed. Please try again.';
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
