import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
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
  name?: string;
  containerId?: string;
  applicationId?: number;
  function: string;
  task: string;
  applicationNumber: string;
  applicationName: string;
  issuingOffice: string;
  universityName?: string;
  assignee?: string;
  assigneeId?: string;
  processName?: string;
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
  universityId?: number;
  universityName?: string;
  createdAt: string;
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
    MatMenuModule,
    MatPaginatorModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  currentUser: User | null = null;

  // Tab data
  actionNeededTasks: Task[] = [];
  myApplications: Application[] = [];
  // "My Permits" is backed by the same /api/applications shape - an application becomes
  // a permit once its latest workflow status is ACCEPTED (see dashboard's PermitController).
  myPermits: Application[] = [];

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

  // University Permits - backed by the same /api/applications shape as uniApplications: an
  // application becomes a permit once its latest workflow status is ACCEPTED
  // (see PermitController.getPermitsByUniversity).
  uniPermits: Application[] = [];
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
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('[Dashboard] ngOnInit called');

    // Restore the tab/university selected before navigating away to "View Application",
    // passed back as query params so re-entering the dashboard doesn't reset the view.
    const queryParamMap = this.route.snapshot.queryParamMap;
    const universityIdParam = queryParamMap.get('universityId');
    const tabParam = queryParamMap.get('tab');
    if (universityIdParam !== null) {
      this.selectedUniversityId = Number(universityIdParam);
      this.internalTabIndex = tabParam !== null ? Number(tabParam) : 0;
    } else if (tabParam !== null) {
      this.selectedTabIndex = Number(tabParam);
    }

    this.authService.currentUser.subscribe((user: User | null) => {
      console.log('[Dashboard] currentUser subscription fired:', {
        hasUser: !!user,
        email: user?.email,
        isExternalUser: user?.isExternalUser,
        roles: user?.roles
      });
      this.currentUser = user;
      if (user) {
        if (user.isExternalUser) {
          // External user: load data for the restored (or default) tab
          console.log('[Dashboard] External user detected, loading tab data');
          this.loadExternalTabData(this.selectedTabIndex);
        } else {
          // Internal user: load university list
          console.log('[Dashboard] Internal user detected, loading universities');
          this.loadUniversities();
        }
      } else {
        console.log('[Dashboard] currentUser is null - dashboard will be empty');
      }
    });
  }

  private getApiBaseUrl(): string {
    return this.appConfigService.envProperties?.apiBaseUrl || 'http://localhost:8080';
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;
    this.loadExternalTabData(event.index);
  }

  private loadExternalTabData(tabIndex: number): void {
    switch (tabIndex) {
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
    const url = `${apiBaseUrl}/api/workflow/myActiveTasks?page=${this.tasksPage}&size=${this.tasksSize}`;
    
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

    this.http.get<PageResponse<Application>>(url, { withCredentials: true }).subscribe({
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

  // Actions menu (eye icon) on an application row - passes the currently selected
  // university/tab as query params so the dashboard can restore them on return.
  onViewApplication(application: Application): void {
    const queryParams: { universityId?: number; tab?: number } = {};
    if (this.currentUser && !this.currentUser.isExternalUser) {
      queryParams.universityId = this.selectedUniversityId ?? undefined;
      queryParams.tab = this.internalTabIndex;
    } else {
      queryParams.tab = this.selectedTabIndex;
    }
    this.router.navigate(['/application-view', application.id], { queryParams });
  }

  // "View Status" action - fetches the jBPM process instance diagram (SVG, active
  // node highlighted) and opens it in a new browser tab.
  onViewApplicationStatus(application: Application): void {
    const apiBaseUrl = this.getApiBaseUrl();
    const url = `${apiBaseUrl}/api/applications/${application.id}/status-image`;

    this.http.get(url, { withCredentials: true, responseType: 'blob' }).subscribe({
      next: (svgBlob) => {
        const objectUrl = URL.createObjectURL(svgBlob);
        window.open(objectUrl, '_blank');
      },
      error: (error) => {
        console.error('Error loading process status image:', error);
        this.handleAuthError(error);
        alert('Unable to load process status for this application. It may not have an active workflow yet.');
      }
    });
  }

  // "Complete" button on an Action Needed task row - opens the reusable application
  // form in task mode (Dashboard/Save/Complete buttons) for the task's application.
  // Shared by the "Complete" button on both the external "Action Needed" tab and the
  // internal "My Tasks" tab - routes to whichever application-form variant matches the
  // current user (internal users get the review page with the signature/date section).
  onOpenTask(task: Task): void {
    if (!task.applicationId) {
      return;
    }
    const isExternal = !!this.currentUser?.isExternalUser;
    const route = isExternal ? '/application-form' : '/internal-application-form';
    const queryParams: { applicationId: number; taskId: number | null; containerId?: string; universityId?: number; tab?: number } = {
      applicationId: task.applicationId,
      taskId: task.id,
      containerId: task.containerId
    };
    if (!isExternal) {
      // So "Dashboard"/"Complete" on the internal review page can return here with the
      // same university/tab selected, instead of resetting to the university picker.
      queryParams.universityId = this.selectedUniversityId ?? undefined;
      queryParams.tab = this.internalTabIndex;
    }
    this.router.navigate([route], { queryParams });
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
    console.log('[Dashboard] Loading universities from:', `${apiBaseUrl}/api/universities`);
    this.http.get<University[]>(`${apiBaseUrl}/api/universities`, { withCredentials: true }).subscribe({
      next: (universities) => {
        console.log('[Dashboard] Universities loaded:', universities?.length, 'items');
        this.universities = universities;
        // If a university/tab was restored from query params, load that tab's data now
        if (this.selectedUniversityId) {
          this.loadInternalTabData(this.internalTabIndex);
        }
      },
      error: (error) => {
        console.error('[Dashboard] Error loading universities:', error.status, error.message);
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

    this.http.get<PageResponse<Application>>(url, { withCredentials: true }).subscribe({
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
    if (this.availableTasksLoading || !this.selectedUniversityId) return;
    this.availableTasksLoading = true;
    const apiBaseUrl = this.getApiBaseUrl();
    const url = `${apiBaseUrl}/api/workflow/myUniversityTasks?officeid=${this.selectedUniversityId}&page=${this.availableTasksPage}&size=${this.availableTasksSize}`;

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
    const url = `${apiBaseUrl}/api/workflow/myActiveTasks?page=${this.myInternalTasksPage}&size=${this.myInternalTasksSize}`;

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

  // Available Tasks row action button - "Assign To Me" when nobody owns the task yet,
  // otherwise "Takeover Task" (disabled if the current user already owns it).
  getAvailableTaskActionLabel(task: Task): string {
    return task.assigneeId ? 'Takeover Task' : 'Assign To Me';
  }

  isAvailableTaskActionDisabled(task: Task): boolean {
    return !!task.assigneeId && this.isCurrentUser(task.assigneeId);
  }

  private isCurrentUser(assigneeId: string): boolean {
    return this.currentUser?.id != null && String(this.currentUser.id) === String(assigneeId);
  }

  onAvailableTaskAction(task: Task): void {
    if (task.assigneeId) {
      this.onTakeoverTask(task);
    } else {
      this.onAssignToMe(task);
    }
  }

  private onAssignToMe(task: Task): void {
    const apiBaseUrl = this.getApiBaseUrl();
    const url = `${apiBaseUrl}/api/workflow/startTask?containerId=${encodeURIComponent(task.containerId ?? '')}&taskId=${task.id}`;

    this.http.delete<boolean>(url, { withCredentials: true }).subscribe({
      next: () => this.loadAvailableTasks(),
      error: (error) => {
        console.error('Error assigning task to self:', error);
        this.handleAuthError(error);
        alert('Unable to assign this task to you. Please try again.');
      }
    });
  }

  private onTakeoverTask(task: Task): void {
    const apiBaseUrl = this.getApiBaseUrl();
    const url = `${apiBaseUrl}/api/workflow/takeoverTask?containerId=${encodeURIComponent(task.containerId ?? '')}&taskId=${task.id}`;

    this.http.delete<boolean>(url, { withCredentials: true }).subscribe({
      next: () => this.loadAvailableTasks(),
      error: (error) => {
        console.error('Error taking over task:', error);
        this.handleAuthError(error);
        alert('Unable to take over this task. Please try again.');
      }
    });
  }

  onMyInternalTasksPageChange(event: PageEvent): void {
    this.myInternalTasksPage = event.pageIndex;
    this.myInternalTasksSize = event.pageSize;
    this.loadMyInternalTasks();
  }

  // "Release Task" action on a My Tasks row - hands the task back to the pool (clears
  // actualOwner) so anyone else in the potential-owner group can pick it up.
  onReleaseTask(task: Task): void {
    const apiBaseUrl = this.getApiBaseUrl();
    const url = `${apiBaseUrl}/api/workflow/releaseTask?containerId=${encodeURIComponent(task.containerId ?? '')}&taskId=${task.id}`;

    this.http.delete<boolean>(url, { withCredentials: true }).subscribe({
      next: () => this.loadMyInternalTasks(),
      error: (error) => {
        console.error('Error releasing task:', error);
        this.handleAuthError(error);
        alert('Unable to release this task. Please try again.');
      }
    });
  }
}
