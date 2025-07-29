import { TestBed } from '@angular/core/testing';
import { WebSocketService } from './websocket.service';
import { Auth } from './auth';
import { SocketEvents, MessageSendData, MessageReceiveData } from '../models/websocket.model';

// Mock Socket.IO
class MockSocket {
  connected = false;
  private eventHandlers: { [key: string]: Function[] } = {};

  connect() {
    this.connected = true;
    this.emit('connect');
  }

  disconnect() {
    this.connected = false;
    this.emit('disconnect', 'transport close');
  }

  emit(event: string, data?: any) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }

  on(event: string, handler: Function) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  off(event: string, handler?: Function) {
    if (this.eventHandlers[event]) {
      if (handler) {
        const index = this.eventHandlers[event].indexOf(handler);
        if (index > -1) {
          this.eventHandlers[event].splice(index, 1);
        }
      } else {
        delete this.eventHandlers[event];
      }
    }
  }
}

// Mock io function
const mockSocket = new MockSocket();
const mockIo = jasmine.createSpy('io').and.returnValue(mockSocket);

describe('WebSocketService', () => {
  let service: WebSocketService;
  let authService: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('Auth', ['token']);

    TestBed.configureTestingModule({
      providers: [
        WebSocketService,
        { provide: Auth, useValue: authSpy }
      ]
    });
    
    service = TestBed.inject(WebSocketService);
    authService = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    
    // Reset mock socket state
    mockSocket.connected = false;
    mockIo.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should connect when token is available', () => {
    authService.token.and.returnValue('fake-token');
    
    service.connect();
    
    expect(authService.token).toHaveBeenCalled();
    expect(mockIo).toHaveBeenCalledWith('http://localhost:3000', {
      auth: { token: 'fake-token' },
      transports: ['websocket', 'polling'],
      upgrade: true,
      autoConnect: true
    });
  });

  it('should not connect when token is not available', () => {
    authService.token.and.returnValue(undefined);
    
    service.connect();
    
    expect(authService.token).toHaveBeenCalled();
    expect(mockIo).not.toHaveBeenCalled();
  });

  it('should emit connection status changes', (done) => {
    authService.token.and.returnValue('fake-token');
    
    // Use effect to watch signal changes
    let effectCleanup: any;
    const cleanup = () => {
      if (effectCleanup) effectCleanup();
    };
    
    import('@angular/core').then(({ effect }) => {
      effectCleanup = effect(() => {
        const status = service.connectionStatus();
        if (status === true) {
          expect(status).toBe(true);
          cleanup();
          done();
        }
      });
      
      service.connect();
      mockSocket.connect();
    });
  });

  it('should send message when connected', () => {
    authService.token.and.returnValue('fake-token');
    service.connect();
    mockSocket.connected = true;
    
    spyOn(mockSocket, 'emit');
    
    const messageData: MessageSendData = {
      conversationId: 'conv-123',
      content: 'Hello world',
      type: 'text'
    };
    
    service.sendMessage(messageData);
    
    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvents.MESSAGE_SEND, messageData);
  });

  it('should handle incoming message', (done) => {
    authService.token.and.returnValue('fake-token');
    service.connect();
    
    const messageData: MessageReceiveData = {
      _id: 'msg-123',
      senderId: {
        _id: 'user-123',
        username: 'John Doe'
      },
      conversationId: 'conv-123',
      content: 'Hello world',
      type: 'text',
      timestamp: new Date(),
      read: false
    };
    
    // Use effect to watch signal changes
    import('@angular/core').then(({ effect }) => {
      const cleanup = effect(() => {
        const data = service.messageReceive();
        if (data) {
          expect(data).toEqual(messageData);
          done();
        }
      });
      
      mockSocket.emit(SocketEvents.MESSAGE_RECEIVE, messageData);
    });
  });

  it('should handle typing events', (done) => {
    authService.token.and.returnValue('fake-token');
    service.connect();
    
    const typingData = {
      userId: 'user-123',
      username: 'John Doe',
      conversationId: 'conv-123'
    };
    
    // Use effect to watch signal changes
    import('@angular/core').then(({ effect }) => {
      const cleanup = effect(() => {
        const data = service.typingStart();
        if (data) {
          expect(data).toEqual(typingData);
          done();
        }
      });
      
      mockSocket.emit(SocketEvents.TYPING_START, typingData);
    });
  });

  it('should join conversation', () => {
    authService.token.and.returnValue('fake-token');
    service.connect();
    mockSocket.connected = true;
    
    spyOn(mockSocket, 'emit');
    
    service.joinConversation('conv-123');
    
    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvents.CONVERSATION_JOIN, 'conv-123');
  });

  it('should disconnect properly', () => {
    authService.token.and.returnValue('fake-token');
    service.connect();
    mockSocket.connected = true;
    
    spyOn(mockSocket, 'disconnect');
    
    service.disconnect();
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should clear data', () => {
    service.clearData();
    
    expect(service.messageReceive()).toBeNull();
    expect(service.typingStart()).toBeNull();
  });

  it('should check connection status', () => {
    mockSocket.connected = true;
    expect(service.isConnected()).toBe(true);
    
    mockSocket.connected = false;
    expect(service.isConnected()).toBe(false);
  });
});
