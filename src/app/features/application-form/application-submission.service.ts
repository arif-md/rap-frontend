import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@app/global-services';

export interface ApplicationSubmissionRequest {
  applicationId?: number;
  applicationName: string;
  university: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  program: string;
  description?: string;
}

export interface ApplicationSubmissionResponse {
  applicationId: number;
  applicationCode: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationSubmissionService {
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.envProperties?.apiBaseUrl || 'http://localhost:8080';
  }

  /**
   * Submit a new university admission application.
   * Token authentication is automatically handled by HTTP interceptor.
   */
  submitApplication(request: ApplicationSubmissionRequest): Observable<ApplicationSubmissionResponse> {
    const url = `${this.baseUrl}/api/applications/submissions`;

    return this.http.post<ApplicationSubmissionResponse>(url, request);
  }

  /**
   * Save an application without starting/advancing beyond intake.
   * Safe to call repeatedly; pass back `applicationId` from a prior response to update
   * the same application instead of creating a new one.
   * Token authentication is automatically handled by HTTP interceptor.
   */
  saveApplication(request: ApplicationSubmissionRequest): Observable<ApplicationSubmissionResponse> {
    const url = `${this.baseUrl}/api/applications/submissions/save`;

    return this.http.post<ApplicationSubmissionResponse>(url, request);
  }

  /**
   * Complete the jBPM task associated with an application, e.g. from the dashboard's
   * "Action Needed" tab.
   */
  completeTask(taskId: number, containerId: string): Observable<void> {
    const url = `${this.baseUrl}/api/workflow/myActiveTasks/${taskId}/complete?containerId=${encodeURIComponent(containerId)}`;

    return this.http.post<void>(url, null);
  }

  /**
   * Complete the jBPM task associated with an application from the internal application
   * review page ("My Tasks" -> Complete), recording the reviewer's signature and review
   * date server-side first.
   */
  completeTaskWithReview(
    taskId: number,
    containerId: string,
    applicationId: number,
    reviewDate: string,
    signatureImage: string
  ): Observable<void> {
    const url = `${this.baseUrl}/api/workflow/myActiveTasks/${taskId}/completeWithReview?containerId=${encodeURIComponent(containerId)}`;

    return this.http.post<void>(url, { applicationId, reviewDate, signatureImage });
  }
}
