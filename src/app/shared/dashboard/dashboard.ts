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
  status: string;
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

  constructor(
    private authService: AuthenticationService,
    private appConfigService: AppConfigService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user: User | null) => {
      this.currentUser = user;
      // Load initial data for first tab
      if (user) {
        this.loadTasks();
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
}
