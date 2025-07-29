import { Component, inject, signal, model, output, input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { User } from '../../models/user.model';
import { Auth } from '../../services/auth';
import { UserService } from '../../services/user-service';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [
    CommonModule,
    MenuModule,
    DialogModule,
    ButtonModule,
    AvatarModule,
    FileUploadModule,
    ToastModule
  ],
  templateUrl: './profile-menu.html',
  styleUrls: ['./profile-menu.scss'],
  providers: [MessageService]
})
export class ProfileMenuComponent {
  @ViewChild('profileMenu') menu!: Menu;
  
  private auth = inject(Auth);
  private userService = inject(UserService);
  private messageService = inject(MessageService);

  user = input<User | undefined>();
  
  // Signal for profile dialog visibility
  showProfileDialog = signal(false);
  
  // Signal for avatar upload
  uploadingAvatar = signal(false);
  
  // Menu items
  menuItems: MenuItem[] = [
    {
      label: 'View Profile',
      icon: 'pi pi-user',
      command: () => this.openProfileDialog()
    },
    {
      separator: true
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ];

  showMenu(event: Event) {
    this.menu.show(event);
  }

  openProfileDialog() {
    this.showProfileDialog.set(true);
  }

  closeProfileDialog() {
    this.showProfileDialog.set(false);
  }

  onAvatarUpload(event: any) {
    const file = event.files[0];
    if (file) {
      this.uploadingAvatar.set(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('avatar', file);
      
      this.userService.uploadAvatar(formData).subscribe({
        next: (response: any) => {
          this.uploadingAvatar.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Avatar uploaded successfully'
          });
          
          // Update user profile
          this.userService.getUserProfile().subscribe();
        },
        error: (error: any) => {
          this.uploadingAvatar.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to upload avatar'
          });
          console.error('Avatar upload failed:', error);
        }
      });
    }
  }

  onAvatarSelect(event: any) {
    // Validate file size and type
    const file = event.files[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      
      if (file.size > maxSize) {
        this.messageService.add({
          severity: 'warn',
          summary: 'File Too Large',
          detail: 'Please select an image smaller than 5MB'
        });
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Invalid File Type',
          detail: 'Please select a JPEG, PNG, or GIF image'
        });
        return;
      }
    }
  }

  logout() {
    this.auth.logout().subscribe(() => {
        this.userService.logout();
    });
  }

  getCurrentAvatarUrl(): string {
    return this.user()?.avatarUrl || 'assets/images/default-avatar.png';
  }

  getAvatarLabel(): string {
    return this.user()?.displayName?.charAt(0).toUpperCase() || 
           this.user()?.username?.charAt(0).toUpperCase() || 'U';
  }
}
