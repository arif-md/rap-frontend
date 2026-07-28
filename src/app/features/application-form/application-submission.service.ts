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
}
