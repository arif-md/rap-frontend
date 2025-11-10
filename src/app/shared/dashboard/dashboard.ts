import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '@app/global-services';
import { User } from '@app/shared/model/admin/user';

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
    MatChipsModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  currentUser: User | null = null;

  // Sample data for Action Needed tab (External users)
  actionNeededTasks: any[] = [
    // Empty for now - will be populated from backend
  ];

  // Sample data for My Applications tab (External users)
  myApplications: any[] = [
    // Empty for now - will be populated from backend
  ];

  // Sample data for My Permits tab (External users)
  myPermits: any[] = [
    // Empty for now - will be populated from backend
  ];

  constructor(private authService: AuthenticationService) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user: User | null) => {
      this.currentUser = user;
    });
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
}
