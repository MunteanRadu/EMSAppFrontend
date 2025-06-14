import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { RouterModule }      from '@angular/router';

import { AuthService }       from '../../auth/auth.service';
import { UserService }       from '../../shared/services/user.service';
import { UserProfile } from '../../shared/models/user-profile.model'; 

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  userId = '';
  profile?: UserProfile;

  editing = false;
  loading = false;
  error   = '';

  // editable buffer
  editedProfile: Partial<UserProfile> = {};

  constructor(
    private auth: AuthService,
    private userSvc: UserService
  ) {}

  ngOnInit() {
    const token = this.auth.token!;
    const payload: any = JSON.parse(atob(token.split('.')[1]));
    this.userId = payload.sub as string;

    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.userSvc.getProfile(this.userId)
    .subscribe({
      next: profile => {
        this.profile = profile;
        this.editedProfile = { ...profile };
        this.editing = false;
        this.loading = false;
      },
      error: err => {
        if (err.status === 404) {
          this.profile = undefined;
          this.editedProfile = {};
          this.editing = true;
        } else {
          this.error = err ?? 'Failed to load profile.';
        }
        this.loading = false;
      }
    });
  }


  startEdit() {
    this.editing = true;
    this.editedProfile = { ...this.profile! };
    this.error = '';
  }

  cancelEdit() {
    this.editing = false;
    this.error = '';
  }

  save() {
    this.loading = true;
    this.userSvc.updateProfile(this.userId, this.editedProfile)
      .subscribe({
        next: () => {
          this.editing = false;
          this.loadProfile();
        },
        error: err => {
          this.error = err ?? 'Failed to update profile.';
          this.loading = false;
        }
      });
  }
}
