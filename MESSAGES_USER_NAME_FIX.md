# Messages List User Name Fix

## Issue
The messages/chat list was displaying user IDs (like `0kTJhlg0MmbWr6RTKljmgPz8Qo52`) instead of actual user names.

## Root Cause
In `MessagesList.tsx`, the code was using the chat ID directly to generate display names:
```typescript
name: c.id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
```

This would convert a user ID like `0kTJhlg0MmbWr6RTKljmgPz8Qo52` into a capitalized string, which is not user-friendly.

## Solution
Updated the `fetchChats()` function to:

1. **Extract participant IDs** from the chat data
   - Parse chat IDs that contain `userId1_userId2` format
   - Use the `participants` array if available
   - Filter out the current user to get the other participant

2. **Fetch user profiles** for each chat participant
   - Call `getUserProfile(otherUserId)` for each chat
   - Extract `displayName` or `email` from the profile
   - Use profile photo or generate avatar with actual name

3. **Display real names** instead of IDs
   - Shows user's display name
   - Falls back to email username if no display name
   - Shows "Unknown User" only if profile fetch fails

## Files Modified
- `/src/pages/MessagesList.tsx` - Updated chat fetching logic to retrieve and display actual user names

## Testing
1. Navigate to the Messages page
2. Verify that chat list shows actual user names instead of IDs
3. Verify that user profile photos are displayed correctly
4. Check that the last message preview is still visible

## Impact
- ✅ Users now see actual names in their message list
- ✅ Profile photos are properly displayed
- ✅ Better user experience and clarity
- ✅ No breaking changes to existing functionality
