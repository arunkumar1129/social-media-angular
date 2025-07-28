import { TestBed } from '@angular/core/testing';
import { TimeUtilsService } from './time-utils.service';

describe('TimeUtilsService', () => {
  let service: TimeUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('formatMessageTime', () => {
    it('should return "now" for very recent messages', () => {
      const now = new Date();
      expect(service.formatMessageTime(now)).toBe('now');
    });

    it('should return minutes ago for recent messages', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(service.formatMessageTime(fiveMinutesAgo)).toBe('5m ago');
    });

    it('should return hours ago for messages within the day', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(service.formatMessageTime(twoHoursAgo)).toBe('2h ago');
    });

    it('should return "yesterday" for messages from yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(service.formatMessageTime(yesterday)).toBe('yesterday');
    });

    it('should return days ago for recent messages', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(service.formatMessageTime(threeDaysAgo)).toBe('3d ago');
    });

    it('should return date for older messages', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const result = service.formatMessageTime(tenDaysAgo);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Should be a date format
    });
  });

  describe('formatConversationTime', () => {
    it('should return shorter format for conversation list', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(service.formatConversationTime(fiveMinutesAgo)).toBe('5m');
      
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(service.formatConversationTime(twoHoursAgo)).toBe('2h');
    });
  });

  describe('formatFullDateTime', () => {
    it('should return full date and time', () => {
      const testDate = new Date('2024-01-15T10:30:00');
      const result = service.formatFullDateTime(testDate);
      expect(result).toContain('January 15, 2024');
      expect(result).toContain('10:30');
    });
  });

  describe('isToday', () => {
    it('should return true for today\'s date', () => {
      const now = new Date();
      expect(service.isToday(now)).toBe(true);
    });

    it('should return false for yesterday\'s date', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(service.isToday(yesterday)).toBe(false);
    });
  });

  describe('isYesterday', () => {
    it('should return true for yesterday\'s date', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(service.isYesterday(yesterday)).toBe(true);
    });

    it('should return false for today\'s date', () => {
      const now = new Date();
      expect(service.isYesterday(now)).toBe(false);
    });
  });
});
