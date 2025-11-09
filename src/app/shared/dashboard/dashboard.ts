import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '@app/global-services';
import { User } from '@app/shared/model/admin/user';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  currentUser: User | null = null;

  constructor(private authService: AuthenticationService) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user: User | null) => {
      this.currentUser = user;
    });
  }
}
