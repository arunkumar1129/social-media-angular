import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConversationService } from './conversation.service';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { ApiResponse } from '../models/api-response.model';

describe('ConversationService', () => {
  let service: ConversationService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api';

  const mockConversation: Conversation = {
    _id: '1',
    participants: [{ _id: 'user1' }, { _id: 'user2' }],
    lastMessage: {
        _id: 'msg1',
        conversationId: '1',
        senderId: {
            _id: 'user2',
            displayName: 'John Doe',
            status: 'online' as const
        },
        content: 'Hello there!',
        timestamp: new Date(),
        type: 'text' as const,
        readBy: []
    },
    lastUpdated: new Date(),
    unReadCount: 2,
    isGroup: false,
    displayName: 'John Doe'
  };

  const mockMessage: Message = {
    _id: '1',
    conversationId: '1',
    senderId: {
        _id: 'user1',
        displayName: 'John Doe',
        status: 'online' as const
    },
    content: 'Hello there!',
    timestamp: new Date(),
    type: 'text' as const,
    readBy: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConversationService]
    });
    service = TestBed.inject(ConversationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get conversations', () => {
    const mockResponse: ApiResponse<Conversation[]> = {
      success: true,
      message: 'Conversations retrieved successfully',
      data: [mockConversation]
    };

    service.getConversations().subscribe(response => {
      expect(response.data).toEqual([mockConversation]);
      expect(service.conversations()).toEqual([mockConversation]);
    });

    const req = httpMock.expectOne(`${apiUrl}/conversations`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should send message', () => {
    const messageRequest = {
      conversationId: '1',
      content: 'Hello there!',
      type: 'text' as const
    };

    const mockResponse: ApiResponse<Message> = {
      success: true,
      message: 'Message sent successfully',
      data: mockMessage
    };

    service.sendMessage(messageRequest).subscribe(response => {
      expect(response.data).toEqual(mockMessage);
    });

    const req = httpMock.expectOne(`${apiUrl}/messages`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(messageRequest);
    req.flush(mockResponse);
  });
});
