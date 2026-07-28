import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@app/global-services';

export interface ApplicationDetail {
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
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationViewService {
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.envProperties?.apiBaseUrl || 'http://localhost:8080';
  }

  /**
   * Fetch read-only application details for the dashboard's "View Application" action.
   * Token authentication is automatically handled by HTTP interceptor.
   */
  getApplication(id: number): Observable<ApplicationDetail> {
    const url = `${this.baseUrl}/api/dashboard/applications/${id}`;
    return this.http.get<ApplicationDetail>(url, { withCredentials: true });
  }
}
