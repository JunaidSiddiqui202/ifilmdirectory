# 🔊 Notification Sound - Quick Setup

## What You Need

A notification sound file named `notification-sound.mp3` in your `/public` folder.

## Option 1: Download Free Sound (Easiest) ⭐

### Recommended Sites:
1. **Notification Sounds** - https://notificationsounds.com/
   - Go to site → Browse sounds → Download your favorite
   - Look for: "Pristine", "Definite", "Juntos", or "Popcorn"

2. **Pixabay** - https://pixabay.com/sound-effects/search/notification/
   - Free, no attribution required
   - High quality MP3 files

3. **Zedge** - https://www.zedge.net/find/ringtones/notification
   - Huge collection
   - Filter by "Notification" category

### Steps:
1. Download a sound you like (MP3 format)
2. Rename it to `notification-sound.mp3`
3. Move it to: `/Volumes/JUNAID/CODES/iFilmDirectory/ifilm-app/public/notification-sound.mp3`
4. Done! ✅

---

## Option 2: Use Your Phone's Sound

### Android:
1. Connect phone to computer
2. Navigate to: `/System/media/audio/notifications/`
3. Copy any `.ogg` or `.mp3` file
4. Convert to MP3 if needed (use https://cloudconvert.com/)
5. Rename to `notification-sound.mp3`
6. Place in `/public` folder

### iPhone:
1. Use a sound extraction app or iTunes
2. Export notification sound
3. Convert to MP3
4. Rename and place in `/public` folder

---

## Option 3: Create Your Own

### Using Audacity (Free):
1. Download Audacity: https://www.audacityteam.org/
2. Generate → Tone → Choose frequency (800-1000 Hz works well)
3. Duration: 0.3-0.5 seconds
4. Effect → Fade Out
5. File → Export → Export as MP3
6. Save as `notification-sound.mp3`
7. Place in `/public` folder

---

## Option 4: Use Default Beep (No File Needed)

If you don't add a sound file, the app will automatically generate a simple beep using Web Audio API. It works but isn't as nice as a custom sound.

---

## Verify It Works

After adding the file:

1. Start your dev server: `npm run dev`
2. Open browser console (F12)
3. Type: `new Audio('/notification-sound.mp3').play()`
4. You should hear your notification sound! 🔊

---

## File Location

```
ifilm-app/
├── public/
│   ├── notification-sound.mp3  ← PUT IT HERE
│   ├── logo.png
│   ├── firebase-messaging-sw.js
│   └── ...
```

---

## Sound Characteristics (Recommended)

- **Duration**: 0.3 - 1.0 seconds (short and sweet)
- **Volume**: Medium (not too loud)
- **Tone**: Pleasant, not jarring
- **Format**: MP3 (best browser support)
- **File Size**: < 100KB (for fast loading)

---

## Popular Notification Sound Recommendations

1. **"Pristine"** - Clean, professional ding
2. **"Popcorn"** - Fun, friendly pop sound
3. **"Juntos"** - Warm, welcoming tone
4. **"Definite"** - Clear, attention-grabbing
5. **"Tink"** - Subtle, elegant

---

## Troubleshooting

**Sound not playing?**
- Check file exists: `ls public/notification-sound.mp3`
- Check file size: Should be > 0 bytes
- Try playing in browser: Open `http://localhost:5173/notification-sound.mp3`
- Check browser console for errors

**Sound too loud/quiet?**
- Edit the file in Audacity
- Use Effect → Amplify to adjust volume
- Or change volume in code: `fcmService.ts` line 152 (`audio.volume = 0.7`)

---

## That's It!

Once you add the file, your app will play it for every notification. No code changes needed! 🎉
