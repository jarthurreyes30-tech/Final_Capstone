# Settings Restructure - Visual Guide

## Before & After Comparison

### BEFORE: Settings in Organization Profile ❌

```
Organization Profile Page
┌─────────────────────────────────────────────────┐
│ Organization Profile                    [Save]  │
├─────────────────────────────────────────────────┤
│ Overview | About | Team | Media | Campaigns | Settings │ ← 6 tabs
└─────────────────────────────────────────────────┘
                                              ↑
                                    Settings buried here
```

**Problems:**
- Settings mixed with profile content
- Hard to find
- Limited functionality
- Confusing user flow

---

### AFTER: Dedicated Settings Page ✅

```
Navbar
┌─────────────────────────────────────────────────┐
│ CharityHub    Dashboard  Updates  Campaigns     │
│                              [More ▼] [👤 ▼]    │
│                                    └─ Settings  │ ← Easy access
└─────────────────────────────────────────────────┘

Organization Profile Page
┌─────────────────────────────────────────────────┐
│ Organization Profile                    [Save]  │
├─────────────────────────────────────────────────┤
│ Overview | About | Team | Media | Campaigns     │ ← 5 tabs only
└─────────────────────────────────────────────────┘

Settings Page (New!)
┌─────────────────────────────────────────────────┐
│ ⚙️ Settings                                      │
│ Manage your charity account preferences         │
├──────────────┬──────────────────────────────────┤
│ SIDEBAR      │ CONTENT PANEL                    │
│              │                                  │
│ ⚙️ Account   │ Account Settings                 │
│ 🔒 Security  │ ┌────────────────────────────┐  │
│ 🔔 Notifs    │ │ Organization Information   │  │
│ 🔗 Integr.   │ │ [Org Name Input]          │  │
│ 👁️ Privacy   │ │ [Email Input]             │  │
│ ⚠️ Danger    │ │ [Phone Input]             │  │
│              │ └────────────────────────────┘  │
│              │                                  │
│              │ ┌────────────────────────────┐  │
│              │ │ Regional Preferences       │  │
│              │ │ [Timezone Dropdown]        │  │
│              │ │ [Language Dropdown]        │  │
│              │ └────────────────────────────┘  │
│              │                                  │
│              │                    [💾 Save]     │
└──────────────┴──────────────────────────────────┘
```

**Benefits:**
- ✅ Clear, dedicated space
- ✅ Easy to navigate
- ✅ Comprehensive controls
- ✅ Professional interface

---

## Section Previews

### 1. Account Settings ⚙️
```
┌─────────────────────────────────────────┐
│ Account Settings                        │
│ Manage your organization's basic info   │
├─────────────────────────────────────────┤
│ Organization Information                │
│ ┌─────────────────────────────────────┐ │
│ │ Organization Name *                 │ │
│ │ [Test Charity Foundation          ] │ │
│ │                                     │ │
│ │ Official Email *    Contact Number  │ │
│ │ [contact@test.org] [+63 XXX XXXX ] │ │
│ │                                     │ │
│ │ Address / Headquarters              │ │
│ │ [123 Main St, Manila...           ] │ │
│ │                                     │ │
│ │ Website                             │ │
│ │ [https://testcharity.org          ] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Regional Preferences                    │
│ ┌─────────────────────────────────────┐ │
│ │ Timezone        Language            │ │
│ │ [UTC+8 ▼]      [English ▼]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│                          [💾 Save]      │
└─────────────────────────────────────────┘
```

### 2. Security & Access Control 🔒
```
┌─────────────────────────────────────────┐
│ Security & Access Control               │
├─────────────────────────────────────────┤
│ Password                                │
│ ┌─────────────────────────────────────┐ │
│ │ 🔑 Change Password                  │ │
│ │ Last changed 30 days ago            │ │
│ │                  [Change Password]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Two-Factor Authentication (2FA)         │
│ ┌─────────────────────────────────────┐ │
│ │ 🛡️ Enable 2FA                       │ │
│ │ Extra security layer      [○ OFF]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Login Activity                          │
│ ┌─────────────────────────────────────┐ │
│ │ 📱 Windows PC                       │ │
│ │ Manila, Philippines   2 hours ago   │ │
│ │                    [Current Session]│ │
│ ├─────────────────────────────────────┤ │
│ │ 📱 Mobile App                       │ │
│ │ Quezon City          1 day ago      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 3. Notifications 🔔
```
┌─────────────────────────────────────────┐
│ Notification Preferences                │
├─────────────────────────────────────────┤
│ Email Notifications                     │
│ ┌─────────────────────────────────────┐ │
│ │ Email Notifications        [● ON]   │ │
│ │ General account updates             │ │
│ ├─────────────────────────────────────┤ │
│ │ 🔔 Donation Alerts        [● ON]   │ │
│ │ When someone donates                │ │
│ ├─────────────────────────────────────┤ │
│ │ 📢 Campaign Updates       [● ON]   │ │
│ │ Campaign performance                │ │
│ ├─────────────────────────────────────┤ │
│ │ 📣 Platform Announcements [○ OFF]  │ │
│ │ New features & updates              │ │
│ ├─────────────────────────────────────┤ │
│ │ 👥 Volunteer Sign-ups     [● ON]   │ │
│ │ New volunteer registrations         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│                    [💾 Save Preferences]│
└─────────────────────────────────────────┘
```

### 4. Integrations 🔗
```
┌─────────────────────────────────────────┐
│ Integration Settings                    │
├─────────────────────────────────────────┤
│ Social Media Connections                │
│ ┌─────────────────────────────────────┐ │
│ │ 📘 Facebook                         │ │
│ │ Not connected    [✓ Connected]      │ │
│ │                     [Connect]       │ │
│ ├─────────────────────────────────────┤ │
│ │ 🐦 X (Twitter)                      │ │
│ │ Not connected                       │ │
│ │                     [Connect]       │ │
│ ├─────────────────────────────────────┤ │
│ │ 📷 Instagram                        │ │
│ │ Not connected                       │ │
│ │                     [Connect]       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Payment Gateway                         │
│ ┌─────────────────────────────────────┐ │
│ │ 💳 Payment Integration              │ │
│ │ Not configured    [Configure]       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ API Key Management                      │
│ ┌─────────────────────────────────────┐ │
│ │ Payment Gateway API Key             │ │
│ │ [••••••••••••••••••••••••••••••]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│                      [💾 Save Settings] │
└─────────────────────────────────────────┘
```

### 5. Privacy & Data 👁️
```
┌─────────────────────────────────────────┐
│ Privacy & Data                          │
├─────────────────────────────────────────┤
│ Profile Visibility                      │
│ ┌─────────────────────────────────────┐ │
│ │ ⦿ Public                            │ │
│ │   Anyone can view your profile      │ │
│ ├─────────────────────────────────────┤ │
│ │ ○ Registered Donors Only            │ │
│ │   Only registered users can view    │ │
│ ├─────────────────────────────────────┤ │
│ │ ○ Private                           │ │
│ │   Hidden from public view           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Donor & Campaign Privacy                │
│ ┌─────────────────────────────────────┐ │
│ │ Show Donor List          [● ON]     │ │
│ │ Show Campaign Stats      [● ON]     │ │
│ │ Show Team Members        [● ON]     │ │
│ │ Allow Comments           [● ON]     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│                      [💾 Save Settings] │
└─────────────────────────────────────────┘
```

### 6. Danger Zone ⚠️
```
┌─────────────────────────────────────────┐
│ ⚠️ Danger Zone                          │
├─────────────────────────────────────────┤
│ ⚠️ These actions are permanent!         │
│                                         │
│ Deactivate Organization                 │
│ ┌─────────────────────────────────────┐ │
│ │ ⚡ Deactivate Account                │ │
│ │                                     │ │
│ │ What happens:                       │ │
│ │ • Profile hidden from public        │ │
│ │ • Campaigns paused                  │ │
│ │ • Data preserved                    │ │
│ │ • Can reactivate anytime            │ │
│ │                                     │ │
│ │              [⚡ Deactivate]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Delete Account Permanently              │
│ ┌─────────────────────────────────────┐ │
│ │ 🗑️ Delete Account                   │ │
│ │                                     │ │
│ │ ⚠️ THIS CANNOT BE UNDONE!           │ │
│ │                                     │ │
│ │ • All campaigns deleted             │ │
│ │ • Donation history removed          │ │
│ │ • All data permanently erased       │ │
│ │                                     │ │
│ │         [🗑️ Delete Permanently]     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Navigation Flow

### User Journey
```
1. Login as Charity Admin
   ↓
2. Click User Icon (top-right)
   ↓
3. Select "Settings"
   ↓
4. Land on Settings Page (Account section)
   ↓
5. Click sidebar items to navigate
   ↓
6. Make changes in each section
   ↓
7. Click Save button
   ↓
8. See success toast notification
```

### Alternative Access
```
Navbar → More Dropdown → Settings
```

---

## Mobile View

```
┌─────────────────────┐
│ ⚙️ Settings         │
├─────────────────────┤
│ [≡ Menu]            │  ← Hamburger menu
├─────────────────────┤
│                     │
│ Account Settings    │
│                     │
│ [Form Fields]       │
│                     │
│ [Save Button]       │
│                     │
└─────────────────────┘
```

Sidebar collapses into hamburger menu on mobile devices.

---

## Color Scheme

### Light Mode
- Background: White/Light Gray
- Primary: Gold (#D4AF37)
- Text: Dark Gray
- Borders: Light Gray

### Dark Mode
- Background: Dark Gray/Black
- Primary: Gold (#D4AF37)
- Text: Light Gray/White
- Borders: Dark Gray

### Danger Zone
- Border: Red
- Background: Light Red (light) / Dark Red (dark)
- Text: Red

---

## Key Interactions

### Toggles
```
OFF: ○ ───────  (Gray)
ON:  ─────── ● (Gold)
```

### Buttons
```
Primary:  [💾 Save Changes]  (Gold background)
Outline:  [Cancel]           (Gold border)
Danger:   [🗑️ Delete]        (Red background)
```

### Modals
```
┌─────────────────────────────┐
│ Change Password             │
├─────────────────────────────┤
│ Enter your current password │
│                             │
│ [Current Password]          │
│ [New Password]              │
│ [Confirm Password]          │
│                             │
│        [Cancel] [Change]    │
└─────────────────────────────┘
```

---

## Summary

The new Settings page provides:
- **6 comprehensive sections** for all account management
- **Sidebar navigation** for easy access
- **Modern, professional design** matching the app theme
- **Clear separation** from Organization Profile
- **Better user experience** with logical grouping

**Organization Profile** now focuses on:
- Public-facing content (Overview, About, Team, Media, Campaigns)
- Profile editing and management
- No settings clutter

This restructure creates a cleaner, more intuitive interface for charity administrators.
