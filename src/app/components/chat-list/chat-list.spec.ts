// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { FormsModule } from '@angular/forms';
// import { NoopAnimationsModule } from '@angular/platform-browser/animations';
// import { ChatListComponent } from './chat-list';
// import { Conversation } from '../../models/conversation.model';
// import { TimeUtilsService } from '../../services/time-utils.service';

// describe('ChatListComponent', () => {
//   let component: ChatListComponent;
//   let fixture: ComponentFixture<ChatListComponent>;

//   const mockConversations: Conversation[] = [
//     {
//       _id: '1',
//       participants: [{ _id: 'user1' }, { _id: 'user2' }],
//       lastMessage: {
//         _id: 'msg1',
//         conversationId: '1',
//         senderId: {
//           _id: 'user2',
//           displayName: 'John Doe',
//           status: 'online' as const
//         },
//         content: 'Hello there!',
//         timestamp: new Date(),
//         type: 'text' as const,
//         readBy: []
//       },
//       lastUpdated: new Date(),
//       unreadCount: 2,
//       isGroup: false,
//       displayName: 'John Doe',
//       otherParticipant: {
//         _id: 'user2',
//         displayName: 'John Doe',
//         status: 'online'
//       }
//     },
//     {
//       _id: '2',
//       participants: [{ _id: 'user1' }, { _id: 'user3' }, { _id: 'user4' }],
//       lastMessage: {
//         _id: 'msg2',
//         conversationId: '2',
//         senderId: {
//           _id: 'user3',
//           displayName: 'Jane Smith',
//           status: 'online' as const
//         },
//         content: 'How is everyone doing?',
//         timestamp: new Date(Date.now() - 3600000), // 1 hour ago
//         type: 'text' as const,
//         readBy: []
//       },
//       lastUpdated: new Date(Date.now() - 3600000), // 1 hour ago
//       unreadCount: 0,
//       isGroup: true,
//       groupName: 'Team Chat',
//       displayName: 'Team Chat'
//     }
//   ];

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [ChatListComponent, FormsModule, NoopAnimationsModule]
//     }).compileComponents();

//     fixture = TestBed.createComponent(ChatListComponent);
//     component = fixture.componentInstance;
//     component.conversations = mockConversations;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   it('should display conversations', () => {
//     expect(component.conversations.length).toBe(2);
//     expect(component.filteredConversations.length).toBe(2);
//   });

//   it('should filter conversations based on search term', () => {
//     component.searchTerm = 'John';
//     expect(component.filteredConversations.length).toBe(1);
//     expect(component.filteredConversations[0].displayName).toBe('John Doe');
//   });

//   it('should emit conversation selection', () => {
//     spyOn(component.conversationSelected, 'emit');
//     component.onConversationSelect(mockConversations[0]);
//     expect(component.conversationSelected.emit).toHaveBeenCalledWith(mockConversations[0]);
//   });

//   it('should get correct display name for group chat', () => {
//     const groupConversation = mockConversations[1];
//     expect(component.getDisplayName(groupConversation)).toBe('Team Chat');
//   });

//   it('should get correct display name for individual chat', () => {
//     const individualConversation = mockConversations[0];
//     expect(component.getDisplayName(individualConversation)).toBe('John Doe');
//   });

//   it('should truncate long messages', () => {
//     const longMessage = 'This is a very long message that should be truncated';
//     const truncated = component.truncateMessage(longMessage, 20);
//     expect(truncated).toBe('This is a very long ...');
//   });
// });
