import { Component, inject, signal, computed, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AvatarModule } from 'primeng/avatar';
import { ListboxModule } from 'primeng/listbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { UserService } from '../../services/user-service';
import { User } from '../../models/user.model';
import { ApiResponse } from '../../models/api-response.model';

@Component({
  selector: 'app-contacts-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    AvatarModule,
    ListboxModule,
    ProgressSpinnerModule
  ],
  templateUrl: './contacts-dialog.html',
  styleUrls: ['./contacts-dialog.scss']
})
export class ContactsDialogComponent {
  private userService = inject(UserService);

  // Two-way binding for dialog visibility
  visible = model<boolean>(false);
  
  // Output event when user is selected
  userSelected = output<User>();

  searchTerm = signal('');
  isLoading = signal(false);
  contacts = signal<User[]>([]);
  selectedUser = signal<User | null>(null);

  filteredContacts = computed(() => {
    if (!this.searchTerm()) {
      return this.contacts();
    }

    return this.contacts().filter(contact =>
      contact.displayName?.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
      contact.username?.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
      contact.email?.toLowerCase().includes(this.searchTerm().toLowerCase())
    );
  });

  ngOnInit() {
    // Load contacts when dialog opens
    if (this.visible()) {
      this.loadContacts();
    }
  }

  onDialogShow() {
    this.loadContacts();
    this.searchTerm.set('');
    this.selectedUser.set(null);
  }

  onDialogHide() {
    this.searchTerm.set('');
    this.selectedUser.set(null);
  }

  loadContacts() {
    this.isLoading.set(true);
    this.userService.getContacts().subscribe({
      next: (response: ApiResponse<User[]>) => {
        this.contacts.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading contacts:', error);
        this.isLoading.set(false);
      }
    });
  }

  onContactSelect(contact: User) {
    this.selectedUser.set(contact);
  }

  onStartConversation() {
    const user = this.selectedUser();
    if (user) {
      this.userSelected.emit(user);
      this.visible.set(false);
    }
  }

  onCancel() {
    this.visible.set(false);
  }

  trackByContactId(index: number, contact: User): string {
    return contact._id || contact.id;
  }
}
