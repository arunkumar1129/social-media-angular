import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Avatar } from 'primeng/avatar';
import { InputText } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';
import { Tag } from 'primeng/tag';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { User } from '../../models/user.model';
import { Auth } from '../../services/auth';
import { UserService } from '../../services/user-service';
import { ConversationService } from '../../services/conversation.service';
import { NotificationPreferencesComponent } from '../../components/notification-preferences/notification-preferences';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  imports: [
    FormsModule,
    Button,
    Avatar,
    InputText,
    Toast,
    Tag,
    ConfirmDialog,
    NotificationPreferencesComponent
  ],
  providers: [MessageService, ConfirmationService]
})
export class Profile {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  private auth = inject(Auth);
  private userService = inject(UserService);
  private conversationService = inject(ConversationService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  user = this.userService.user;
  
  // Signals for form state
  isEditing = signal(false);
  uploadingAvatar = signal(false);
  savingProfile = signal(false);
  
  // Form data signals
  editForm = signal({
    displayName: '',
    bio: '',
    location: ''
  });

  constructor() {
    // Load user profile on component init
    this.userService.getUserProfile().subscribe({
      next: (response) => {
        if (response?.data) {
          const user = response.data;
          this.editForm.set({
            displayName: user.displayName || '',
            bio: user.bio || '',
            location: user.location || ''
          });
        }
      }
    });
  }

  toggleEdit() {
    if (this.isEditing()) {
      this.cancelEdit();
    } else {
      this.startEdit();
    }
  }

  startEdit() {
    const currentUser = this.user();
    if (currentUser) {
      this.editForm.set({
        displayName: currentUser.displayName || '',
        bio: currentUser.bio || '',
        location: currentUser.location || ''
      });
    }
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
    const currentUser = this.user();
    if (currentUser) {
      this.editForm.set({
        displayName: currentUser.displayName || '',
        bio: currentUser.bio || '',
        location: currentUser.location || ''
      });
    }
  }

  async saveProfile() {
    this.savingProfile.set(true);
    
    try {
      const formData = this.editForm();
      await this.userService.updateProfile(formData).toPromise();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Profile updated successfully'
      });
      
      this.isEditing.set(false);
      
      // Refresh user profile
      this.userService.getUserProfile().subscribe();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update profile'
      });
      console.error('Profile update failed:', error);
    } finally {
      this.savingProfile.set(false);
    }
  }

  triggerFileUpload() {
    this.fileInput.nativeElement.click();
  }

  onAvatarSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.validateAndUploadAvatar(file);
    }
  }

  onAvatarUpload(event: any) {
    const file = event.files[0];
    if (file) {
      this.validateAndUploadAvatar(file);
    }
  }

  private validateAndUploadAvatar(file: File) {
    // Validate file size and type
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
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
        detail: 'Please select a JPEG, PNG, GIF, or WebP image'
      });
      return;
    }

    this.uploadAvatar(file);
  }

  private uploadAvatar(file: File) {
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

  removeAvatar() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to remove your profile picture?',
      header: 'Remove Avatar',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.removeAvatar().subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Avatar removed successfully'
            });
            this.userService.getUserProfile().subscribe();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to remove avatar'
            });
            console.error('Avatar removal failed:', error);
          }
        });
      }
    });
  }

  logout() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to logout?',
      header: 'Logout Confirmation',
      icon: 'pi pi-sign-out',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.auth.logout().subscribe(() => {
          this.userService.logout();
          this.conversationService.disconnect();
          this.router.navigate(['/login']);
        });
      }
    });
  }

  deleteAccount() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete your account? This action cannot be undone.',
      header: 'Delete Account',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.userService.deleteAccount().subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Account Deleted',
              detail: 'Your account has been deleted successfully'
            });
            
            setTimeout(() => {
              this.auth.logout().subscribe(() => {
                this.userService.logout();
                this.conversationService.disconnect();
                this.router.navigate(['/login']);
              });
            }, 2000);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete account'
            });
            console.error('Account deletion failed:', error);
          }
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/messenger']);
  }

  getCurrentAvatarUrl(): string {
    return this.user()?.avatarUrl || '';
  }

  getAvatarLabel(): string {
    return this.user()?.displayName?.charAt(0).toUpperCase() || 
           this.user()?.username?.charAt(0).toUpperCase() || 'U';
  }

  getStatusColor(): string {
    const status = this.user()?.status;
    switch (status) {
      case 'online': return 'success';
      case 'away': return 'warning';
      case 'busy': return 'danger';
      default: return 'secondary';
    }
  }

  getJoinedDate(): string {
    const createdAt = this.user()?.createdAt;
    if (createdAt) {
      return new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Unknown';
  }
}
