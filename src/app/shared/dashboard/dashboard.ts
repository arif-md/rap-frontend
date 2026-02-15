import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { AuthenticationService, AppConfigService } from '@app/global-services';
import { User } from '@app/shared/model/admin/user';

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface Task {
  id: number;
  function: string;
  task: string;
  applicationNumber: string;
  applicationName: string;
  issuingOffice: string;
  type: string;
  status: string;
}

interface Application {
  id: number;
  applicationName: string;
  applicationCode: string;
  description?: string;
  status: string;
  ownerName?: string;
  ownerEmail?: string;
  createdAt: string;
}

interface Permit {
  id: number;
  permitNumber: string;
  permitType: string;
  status: string;
  issueDate: string;
  expiryDate: string;
}

interface University {
  id: number;
  universityName: string;
  universityCode: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatPaginatorModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  currentUser: User | null = null;

  // Tab data
  actionNeededTasks: Task[] = [];
  myApplications: Application[] = [];
  myPermits: Permit[] = [];

  // Pagination state for Tasks
  tasksPage = 0;
  tasksSize = 10;
  tasksTotalElements = 0;
  tasksLoading = false;

  // Pagination state for Applications
  applicationsPage = 0;
  applicationsSize = 10;
  applicationsTotalElements = 0;
  applicationsLoading = false;

  // Pagination state for Permits
  permitsPage = 0;
  permitsSize = 10;
  permitsTotalElements = 0;
  permitsLoading = false;

  // Currently selected tab index
  selectedTabIndex = 0;

  // ==========================================
  // Internal Dashboard State
  // ==========================================
  universities: University[] = [];
  selectedUniversityId: number | null = null;

  // Internal tab index
  internalTabIndex = 0;

  // University Applications
  uniApplications: Application[] = [];
  uniApplicationsPage = 0;
  uniApplicationsSize = 10;
  uniApplicationsTotalElements = 0;
  uniApplicationsLoading = false;

  // University Permits
  uniPermits: Permit[] = [];
  uniPermitsPage = 0;
  uniPermitsSize = 10;
  uniPermitsTotalElements = 0;
  uniPermitsLoading = false;

  // Available Tasks
  availableTasks: Task[] = [];
  availableTasksPage = 0;
  availableTasksSize = 10;
  availableTasksTotalElements = 0;
  availableTasksLoading = false;

  // My Internal Tasks
  myInternalTasks: Task[] = [];
  myInternalTasksPage = 0;
  myInternalTasksSize = 10;
  myInternalTasksTotalElements = 0;
  myInternalTasksLoading = false;

  constructor(
    private authService: AuthenticationService,
    private appConfigService: AppConfigService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user: User | null) => {
      this.currentUser = user;
      if (user) {
        if (user.isExternalUser) {
          // External user: load tasks for first tab
          this.loadTasks();
        } else {
          // Internal user: load university list
          this.loadUniversities();
        }
      }
    });
  }

  private getApiBaseUrl(): string {
    return this.appConfigService.envProperties?.apiBaseUrl || 'http://localhost:8080';
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;
    
    // Load data based on selected tab
    switch (event.index) {
      case 0:
        this.loadTasks();
        break;
      case 1:
        this.loadApplications();
        break;
      case 2:
        this.loadPermits();
        break;
    }
  }

  loadTasks(): void {
    if (this.tasksLoading) return;
    
    this.tasksLoading = true;
    const apiBaseUrl = this.getApiBaseUrl();
    const url = `${apiBaseUrl}/api/workflow/tasks?page=${this.tasksPage}&size=${this.tasksSize}`;
    
    this.http.get<PageResponse<Task>>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        this.actionNeededTasks = response.content;
        this.tasksTotalElements = response.totalElements;
        this.tasksLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.handleAuthError(error);
        this.actionNeededTasks = [];
        this.tasksLoading = false;
      }
    });
  }

  loadApplications(): void {
    if (this.applicationsLoading) return;
    
    this.applicationsLoading = true;
    const apiBaseUrl = this.getApiBaseUrl();
    const url = `${apiBaseUrl}/api/applications/my?page=${this.applicationsPage}&size=${this.applicationsSize}`;
    
    this.http.get<PageResponse<Application>>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        this.myApplications = response.content;
        this.applicationsTotalElements = response.totalElements;
        this.applicationsLoading = false;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.handleAuthError(error);
        this.myApplications = [];
        this.applicationsLoading = false;
      }
    });
  }

  loadPermits(): void {
    if (this.permitsLoading) return;
    
    this.permitsLoading = true;
    const apiBaseUrl = this.getApiBaseUrl();
    const url = `${apiBaseUrl}/api/permits/my?page=${this.permitsPage}&size=${this.permitsSize}`;
    
    this.http.get<PageResponse<Permit>>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        this.myPermits = response.content;
        this.permitsTotalElements = response.totalElements;
        this.permitsLoading = false;
      },
      error: (error) => {
        console.error('Error loading permits:', error);
        this.handleAuthError(error);
        this.myPermits = [];
        this.permitsLoading = false;
      }
    });
  }

  private handleAuthError(error: any): void {
    // Check if it's an authentication error (401 or 302 redirect)
    if (error.status === 401 || error.status === 0) {
      console.warn('Authentication failed - session may have expired. Please log in again.');
      // Clear user from localStorage and redirect to login
      this.authService.logout();
    }
  }

  onTasksPageChange(event: PageEvent): void {
    this.tasksPage = event.pageIndex;
    this.tasksSize = event.pageSize;
    this.loadTasks();
  }

  onApplicationsPageChange(event: PageEvent): void {
    this.applicationsPage = event.pageIndex;
    this.applicationsSize = event.pageSize;
    this.loadApplications();
  }

  onPermitsPageChange(event: PageEvent): void {
    this.permitsPage = event.pageIndex;
    this.permitsSize = event.pageSize;
    this.loadPermits();
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'issued':
        return 'bg-success';
      case 'pending':
      case 'under review':
      case 'in progress':
        return 'bg-warning text-dark';
      case 'draft':
        return 'bg-secondary';
      case 'rejected':
      case 'expired':
        return 'bg-danger';
      default:
        return 'bg-info';
    }
  }

  // Navigation methods for module buttons
  onStartApplicationModule1(): void {
    this.router.navigate(['/application-form']);
  }

  onStartApplicationModule2(): void {
    // TODO: Implement Module 2 navigation
    console.log('Module 2 - Not yet implemented');
  }

  onStartApplicationModule3(): void {
    // TODO: Implement Module 3 navigation
    console.log('Module 3 - Not yet implemented');
  }

  // ==========================================
  // Internal Dashboard Methods
  // ==========================================

  loadUniversities(): void {
    const apiBaseUrl = this.getApiBaseUrl();
    this.http.get<University[]>(`${apiBaseUrl}/api/universities`, { withCredentials: true }).subscribe({
      next: (universities) => {
        this.universities = universities;
      },
      error: (error) => {
        console.error('Error loading universities:', error);
        this.handleAuthError(error);
      }
    });
  }

  onUniversityChange(): void {
    if (!this.selectedUniversityId) return;
    // Reset pagination for all tabs
    this.uniApplicationsPage = 0;
    this.uniPermitsPage = 0;
    this.availableTasksPage = 0;
    this.myInternalTasksPage = 0;
    // Load data for the currently selected internal tab
    this.loadInternalTabData(this.internalTabIndex);
  }

  onInternalTabChange(event: MatTabChangeEvent): void {
    this.internalTabIndex = event.index;
    this.loadInternalTabData(event.index);
  }

  private loadInternalTabData(tabIndex: number): void {
    if (!this.selectedUniversityId) return;
    switch (tabIndex) {
      case 0:
        this.loadUniApplications();
        break;
      case 1:
        this.loadUniPermits();
        break;
      case 2:
        this.loadAvailableTasks();
        break;
      case 3:
        this.loadMyInternalTasks();
        break;
    }
  }

  loadUniApplications(): void {
    if (this.uniApplicationsLoading || !this.selectedUniversityId) return;
    this.uniApplicationsLoading = true;
    const apiBaseUrl = this.getApiBaseUrl();
    const url = `${apiBaseUrl}/api/applications/university/${this.selectedUniversityId}?page=${this.uniApplicationsPage}&size=${this.uniApplicationsSize}`;

    this.http.get<PageResponse<Application>>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        this.uniApplications = response.content;
        this.uniApplicationsTotalElements = response.totalElements;
        this.uniApplicationsLoading = false;
      },
      error: (error) => {
        console.error('Error loading university applications:', error);
        this.handleAuthError(error);
        this.uniApplications = [];
        this.uniApplicationsLoading = false;
      }
    });
  }

  loadUniPermits(): void {
    if (this.uniPermitsLoading || !this.selectedUniversityId) return;
    this.uniPermitsLoading = true;
    const apiBaseUrl = this.getApiBaseUrl();
    const url = `${apiBaseUrl}/api/permits/university/${this.selectedUniversityId}?page=${this.uniPermitsPage}&size=${this.uniPermitsSize}`;

    this.http.get<PageResponse<Permit>>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        this.uniPermits = response.content;
        this.uniPermitsTotalElements = response.totalElements;
        this.uniPermitsLoading = false;
      },
      error: (error) => {
        console.error('Error loading university permits:', error);
        this.handleAuthError(error);
        this.uniPermits = [];
        this.uniPermitsLoading = false;
      }
    });
  }

  loadAvailableTasks(): void {
    if (this.availableTasksLoading) return;
    this.availableTasksLoading = true;
    const apiBaseUrl = this.getApiBaseUrl();
    const url = `${apiBaseUrl}/api/workflow/tasks/available?page=${this.availableTasksPage}&size=${this.availableTasksSize}`;

    this.http.get<PageResponse<Task>>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        this.availableTasks = response.content;
        this.availableTasksTotalElements = response.totalElements;
        this.availableTasksLoading = false;
      },
      error: (error) => {
        console.error('Error loading available tasks:', error);
        this.handleAuthError(error);
        this.availableTasks = [];
        this.availableTasksLoading = false;
      }
    });
  }

  loadMyInternalTasks(): void {
    if (this.myInternalTasksLoading) return;
    this.myInternalTasksLoading = true;
    const apiBaseUrl = this.getApiBaseUrl();
    const url = `${apiBaseUrl}/api/workflow/tasks/my?page=${this.myInternalTasksPage}&size=${this.myInternalTasksSize}`;

    this.http.get<PageResponse<Task>>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        this.myInternalTasks = response.content;
        this.myInternalTasksTotalElements = response.totalElements;
        this.myInternalTasksLoading = false;
      },
      error: (error) => {
        console.error('Error loading my tasks:', error);
        this.handleAuthError(error);
        this.myInternalTasks = [];
        this.myInternalTasksLoading = false;
      }
    });
  }

  onUniApplicationsPageChange(event: PageEvent): void {
    this.uniApplicationsPage = event.pageIndex;
    this.uniApplicationsSize = event.pageSize;
    this.loadUniApplications();
  }

  onUniPermitsPageChange(event: PageEvent): void {
    this.uniPermitsPage = event.pageIndex;
    this.uniPermitsSize = event.pageSize;
    this.loadUniPermits();
  }

  onAvailableTasksPageChange(event: PageEvent): void {
    this.availableTasksPage = event.pageIndex;
    this.availableTasksSize = event.pageSize;
    this.loadAvailableTasks();
  }

  onMyInternalTasksPageChange(event: PageEvent): void {
    this.myInternalTasksPage = event.pageIndex;
    this.myInternalTasksSize = event.pageSize;
    this.loadMyInternalTasks();
  }
}
