# 🎬 How to Preview Your Site

## Quick Start (2 Minutes)

### Option 1: Local Development Server (Recommended)

```bash
# 1. Make sure you're in the project directory
cd /home/user/tx-deed

# 2. Install dependencies (if not already done)
npm install

# 3. Start the development server
npm run dev
```

**The site will be available at:** `http://localhost:3000`

**That's it!** Your browser should automatically open, or you can manually navigate to the URL.

---

## What You'll See

### 1. **Landing Page** (`/`)
- Beautiful hero section
- Feature highlights
- Call-to-action buttons
- Pricing tiers
- Footer with links

### 2. **Try These Pages** (No Login Required)
- `/platform-tour` - Interactive feature walkthrough
- `/membership` - Pricing and plans
- `/about` - About the platform
- `/property-lookup` - Try the AI property search (after login)

---

## Creating Test Accounts

### Sign Up as a Member

1. Go to `http://localhost:3000/register`
2. Enter any email (it's development mode, doesn't need to be real)
3. Create a password
4. You're in!

### Access Admin Panel

1. Go to `http://localhost:3000/setup-admin` (one-time setup)
2. Or login at `http://localhost:3000/admin/login`

**Default Admin Credentials:** (if already set up)
- Check your Supabase database for admin users
- Or create new via `/setup-admin`

---

## 🎯 Must-Try Features (In Order)

### For Regular Users:

1. **Property Lookup** (`/property-lookup`)
   - Enter any U.S. address
   - See autocomplete magic ✨
   - Get AI analysis

2. **Librarian AI Chatbot**
   - Look for floating chat button (bottom-right)
   - Ask: "What is a redemption period?"
   - Get instant AI responses

3. **Properties** (`/properties`)
   - Browse available tax deed properties
   - Filter by location, price, score
   - Save favorites

4. **My Pipeline** (`/my-pipeline`)
   - Visual deal tracking
   - Drag-and-drop organization
   - Kanban-style workflow

5. **AI Workforce** (`/ai-workforce`)
   - See all AI agents in action
   - Monitor real-time activity
   - View agent status

### For Elite Members:

6. **Scout Agents** (`/scout-agent`) 🎯
   - Create custom property hunters
   - Set criteria (counties, score, etc.)
   - See live matching results

### For Admins:

7. **Admin Dashboard** (`/admin`)
   - Platform overview
   - User statistics
   - Revenue metrics

8. **Admin AI Workforce** (`/admin/ai-workforce`)
   - Central agent control
   - Run scout agents manually
   - View activity logs

9. **Admin API Keys** (`/admin/api-keys`)
   - Manage third-party integrations
   - Test API connections
   - View status

---

## 🎨 Exploring the UI

### Navigation
- Top navbar has all main features
- User menu (top-right) when logged in
- Admin menu (separate admin layout)

### Interactive Elements
- **Hover effects** - Beautiful transitions
- **Animations** - Powered by Framer Motion
- **Loading states** - Spinners and skeletons
- **Toast notifications** - Bottom-right for feedback

### Try These Interactions:
1. Hover over cards and buttons
2. Drag properties in pipeline
3. Toggle switches in scout agents
4. Open the Librarian chat
5. Use the property autocomplete

---

## 📱 Mobile Preview

### Test Responsive Design

**Resize your browser** to see mobile layouts:
- 📱 Phone: < 768px
- 📱 Tablet: 768px - 1024px
- 🖥️ Desktop: > 1024px

**Or use Chrome DevTools:**
1. Press F12
2. Click device toolbar icon
3. Select iPhone/iPad/etc.

---

## 🔧 Development Tools

### Useful Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for errors
npm run build
```

### Hot Reload
Changes to code will automatically refresh the browser - no need to restart!

---

## 🎯 Feature Testing Checklist

### Basic Features
- [ ] Landing page loads
- [ ] Navigation works
- [ ] Login/Register forms
- [ ] Librarian chatbot opens
- [ ] Toast notifications appear

### Member Features
- [ ] Properties page shows data
- [ ] Property details page
- [ ] Save/unsave properties
- [ ] Pipeline drag-and-drop
- [ ] Calendar view
- [ ] Lead upload

### AI Features
- [ ] Property lookup autocomplete
- [ ] AI analysis runs
- [ ] Librarian responds
- [ ] Scout agent creation
- [ ] Agent matching works

### Admin Features
- [ ] Admin login
- [ ] Dashboard metrics
- [ ] User management
- [ ] API key testing
- [ ] AI agent controls

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"

**Solution:**
```bash
# Check that .env file exists
ls -la .env

# It should contain:
# VITE_SUPABASE_URL=https://...
# VITE_SUPABASE_ANON_KEY=...
```

If missing, copy from `.env.example` and add your credentials.

### Port 3000 Already in Use

**Solution:**
```bash
# Kill the process using port 3000
killall node

# Or use a different port
npm run dev -- --port 3001
```

### Changes Not Showing Up

**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Restart dev server: `Ctrl+C` then `npm run dev`

### Database Errors

**Check Supabase:**
1. Go to https://app.supabase.com
2. Select your project
3. Check Table Editor for data
4. Check API settings for correct URL/key

---

## 🎬 Demo Workflow

### Complete User Journey

**1. First-Time Visitor (5 minutes)**
```
1. Open http://localhost:3000
2. Click "Platform Tour" in nav
3. Scroll through features
4. Click "Get Started" → Register
5. Create account
```

**2. New Member Experience (10 minutes)**
```
1. After login → Dashboard
2. Click "Properties" in nav
3. Browse properties
4. Click one → View details
5. Click "Save Property"
6. Go to "My Pipeline"
7. Drag property between stages
8. Open Librarian chatbot (bottom-right)
9. Ask: "What is surplus funds?"
```

**3. Advanced Features (15 minutes)**
```
1. Go to "AI Workforce"
2. See all running agents
3. Go to "Property Lookup"
4. Start typing address
5. See autocomplete suggestions
6. Select one → Get AI analysis
7. Go to "Lead Upload"
8. Upload a CSV file (if you have one)
9. Watch OCR processing
```

**4. Admin Demo (10 minutes)**
```
1. Logout (user menu → Logout)
2. Go to /admin/login
3. Login as admin
4. Explore admin dashboard
5. Go to "AI Workforce"
6. Click "Run" on Scout Agent
7. Go to "API Keys"
8. View integrated services
9. Go to "Users"
10. See all registered users
```

---

## 📊 Sample Data

### Test Properties
The database should have some properties already. If not:
- Use Property Lookup to add new ones
- Or check admin panel to add manually

### Test Users
After registering, you can:
- Upgrade to admin via `/setup-admin`
- Create multiple accounts for testing

---

## 🎥 Screen Recording Tips

**Want to record a demo?**

**Tools:**
- **Windows:** Xbox Game Bar (Win+G)
- **Mac:** QuickTime or Cmd+Shift+5
- **Cross-platform:** OBS Studio (free)

**What to Record:**
1. Landing page scroll-through
2. Property search with autocomplete
3. Librarian AI chat session
4. Scout agent creation
5. Pipeline drag-and-drop
6. Admin dashboard tour

---

## 🚀 Sharing the Preview

### With Team Members

**Option 1: Local Network**
```bash
# Get your local IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Share: http://YOUR_IP:3000
```

**Option 2: Deploy to Netlify (5 minutes)**
```bash
# Build the site
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

---

## 💡 Pro Tips

1. **Open Multiple Tabs** - Test different user roles simultaneously
2. **Use Incognito** - Test logged-out experience
3. **Check Console** - F12 → Console for any errors
4. **Test Forms** - Try validation errors (empty fields, etc.)
5. **Mobile First** - Start with mobile view, then desktop
6. **Click Everything** - Discover Easter eggs and hidden features!

---

## 🎯 Best Pages to Show Off

### Most Impressive Features:

1. **Property Lookup** - Live autocomplete is 🔥
2. **Librarian AI** - Chat feels magical
3. **Scout Agents** - Visual agent cards with live data
4. **My Pipeline** - Drag-and-drop is smooth
5. **Admin AI Workforce** - Shows technical sophistication
6. **Admin API Keys** - Professional vault interface

---

## 📈 Performance Monitoring

### Check Load Times

**Use Chrome DevTools:**
1. F12 → Network tab
2. Reload page
3. Check load time (bottom)

**Goal:** < 3 seconds for initial load

### Lighthouse Audit

1. F12 → Lighthouse tab
2. Click "Generate report"
3. See performance score

---

## 🎊 Have Fun!

This is a **seriously advanced platform** with:
- 🤖 Multiple AI agents
- 🔍 Smart property search
- 💬 AI chatbot
- 📊 Real-time updates
- 🎨 Beautiful UI
- 🔒 Enterprise security

**Explore, experiment, and enjoy!** 🚀

---

## 📞 Need Help?

**Common Issues:**
1. Check `.env` file exists
2. Run `npm install` again
3. Restart dev server
4. Clear browser cache
5. Check console for errors

**Still stuck?** Check:
- `SETUP.md` - Detailed setup guide
- `BACKEND_ASSESSMENT.md` - Architecture details
- `ADVANCED_FEATURES.md` - Feature documentation

---

**Now go preview your amazing tax deed platform!** 🎉
