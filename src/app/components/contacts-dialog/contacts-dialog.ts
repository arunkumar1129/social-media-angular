import { Component, inject, signal, computed, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Avatar } from 'primeng/avatar';
import { Listbox } from 'primeng/listbox';
import { ProgressSpinner } from 'primeng/progressspinner';
import { UserService } from '../../services/user-service';
import { User } from '../../models/user.model';
import { ApiResponse } from '../../models/api-response.model';

@Component({
  selector: 'app-contacts-dialog',
  templateUrl: './contacts-dialog.html',
  styleUrls: ['./contacts-dialog.scss'],
  imports: [
    FormsModule,
    Dialog,
    Button,
    InputText,
    IconField,
    InputIcon,
    Avatar,
    ProgressSpinner
  ]
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
