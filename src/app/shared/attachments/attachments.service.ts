import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@app/global-services';
import { Attachment } from './attachment.model';

@Injectable({
  providedIn: 'root'
})
export class AttachmentsService {
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.envProperties?.apiBaseUrl || 'http://localhost:8080';
  }

  /**
   * List attachments for an application (dashboard "Attachments" dialog, shared by the
   * Applications and Permits tabs - a permit is just an application under the hood).
   */
  list(applicationId: number): Observable<Attachment[]> {
    const url = `${this.baseUrl}/api/applications/${applicationId}/attachments`;
    return this.http.get<Attachment[]>(url, { withCredentials: true });
  }

  download(applicationId: number, attachmentId: number): Observable<Blob> {
    const url = `${this.baseUrl}/api/applications/${applicationId}/attachments/${attachmentId}/download`;
    return this.http.get(url, { withCredentials: true, responseType: 'blob' });
  }
}
