import { Component, OnInit }    from '@angular/core';
import { CommonModule }          from '@angular/common';
import { RouterModule, Router }  from '@angular/router';
import { AuthService }           from '../../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  username = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token   = this.auth.token!;
    const payload = JSON.parse(atob(token.split('.')[1]));
    this.username = payload.unique_name as string;
  }

  private get roles(): string[] {
    const token = this.auth.token;
    if (!token) return [];
    const payload: any = JSON.parse(atob(token.split('.')[1]));
    let roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    if (!roles) roles = payload.role;
    return Array.isArray(roles) ? roles : [roles];
  }

  get isEmployee(): boolean {
    return this.roles.some(r => r.toLowerCase() === 'employee');
  }

  /** True for both managers and admins */
  get isManager(): boolean {
    return this.roles.some(r => r.toLowerCase() === 'manager');
  }

  /** True only for admins */
  get isAdmin(): boolean {
    return this.roles.some(r => r.toLowerCase() === 'admin');
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
// This component displays the header with the username and a logout button.
// It extracts the username from the JWT token and provides a logout method that clears the session and redirects to the login page.