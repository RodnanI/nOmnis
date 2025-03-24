// src/lib/chat/formatters.ts
import { format, formatDistanceToNow, isToday, isYesterday, isThisYear } from 'date-fns';

/**
 * Format a date for display in the chat interface
 * @param dateString ISO date string to format
 * @returns Formatted date string
 */
export function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return format(date, 'h:mm a'); // 5:30 PM
  } else if (isYesterday(date)) {
    return 'Yesterday ' + format(date, 'h:mm a'); // Yesterday 5:30 PM
  } else if (isThisYear(date)) {
    return format(date, 'MMM d, h:mm a'); // Jan 5, 5:30 PM
  } else {
    return format(date, 'MMM d, yyyy, h:mm a'); // Jan 5, 2023, 5:30 PM
  }
}

/**
 * Format a date as relative time (e.g. "5 minutes ago")
 * @param dateString ISO date string to format
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format a date for conversation lists
 * @param dateString ISO date string to format
 * @returns Formatted date string for conversation list
 */
export function formatConversationDate(dateString: string): string {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else if (isThisYear(date)) {
    return format(date, 'MMM d');
  } else {
    return format(date, 'MM/dd/yyyy');
  }
}

/**
 * Format a time for display in message bubbles
 * @param dateString ISO date string to format
 * @returns Formatted time string
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return format(date, 'h:mm a');
}