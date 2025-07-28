// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { FormsModule } from '@angular/forms';
// import { NoopAnimationsModule } from '@angular/platform-browser/animations';
// import { ChatWindowComponent } from './chat-window';
// import { Conversation } from '../../models/conversation.model';
// import { User } from '../../models/user.model';
// import { Message } from '../../models/message.model';

// describe('ChatWindowComponent', () => {
//   let component: ChatWindowComponent;
//   let fixture: ComponentFixture<ChatWindowComponent>;

//   const mockUser: User = {
//     id: 'current-user',
//     username: 'testuser',
//     email: 'test@example.com',
//     displayName: 'Test User',
//     status: 'online',
//     avatarUrl: ''
//   };

//   const mockConversation: Conversation = {
//     _id: '1',
//     participants: [{ _id: 'current-user' }, { _id: 'other-user' }],
//     lastMessage: {
//         _id: '1',
//         conversationId: '1',
//         senderId: {
//             _id: 'other-user',
//             displayName: 'John Doe',
//             status: 'online' as const
//         },
//         content: 'Hello there!',
//         timestamp: new Date(),
//         type: 'text' as const,
//         readBy: []
//     },
//     lastUpdated: new Date(),
//     unreadCount: 0,
//     isGroup: false,
//     displayName: 'John Doe',
//     otherParticipant: {
//       _id: 'other-user',
//       displayName: 'John Doe',
//       status: 'online'
//     }
//   };

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [ChatWindowComponent, FormsModule, NoopAnimationsModule]
//     }).compileComponents();

//     fixture = TestBed.createComponent(ChatWindowComponent);
//     component = fixture.componentInstance;
//     component.user = mockUser;
//     component.conversation = (mockConversation);
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   it('should display conversation when provided', () => {
//     expect(component.conversation).toBeTruthy();
//     expect(component.getDisplayName()).toBe('John Doe');
//   });

//   it('should load messages when conversation is set', () => {
//     component.ngOnInit();
//     expect(component.messages.length).toBeGreaterThan(0);
//   });

//   it('should send message when sendMessage is called', () => {
//     spyOn(component.messageSent, 'emit');
//     component.newMessage = 'Test message';
//     component.sendMessage();
    
//     expect(component.messageSent.emit).toHaveBeenCalled();
//     expect(component.newMessage).toBe('');
//   });

//   it('should not send empty message', () => {
//     spyOn(component.messageSent, 'emit');
//     component.newMessage = '   ';
//     component.sendMessage();
    
//     expect(component.messageSent.emit).not.toHaveBeenCalled();
//   });

//   it('should handle keyboard events correctly', () => {
//     spyOn(component, 'sendMessage');
//     component.newMessage = 'Test message';
    
//     const event = new KeyboardEvent('keydown', { key: 'Enter' });
//     spyOn(event, 'preventDefault');
    
//     component.onKeyDown(event);
    
//     expect(event.preventDefault).toHaveBeenCalled();
//     expect(component.sendMessage).toHaveBeenCalled();
//   });

//   it('should get correct online status', () => {
//     expect(component.getOnlineStatus()).toBe('online');
    
//     if (component.conversation?.otherParticipant) {
//       component.conversation.otherParticipant.status = 'offline';
//     }
//     expect(component.getOnlineStatus()).toBe('offline');
//   });
// });
