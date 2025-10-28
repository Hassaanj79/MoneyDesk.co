# 💰 Money Pooling Feature - Design Proposal

## Overview
A collaborative money pooling system where multiple users can contribute towards shared goals, split bills, collect money for events, or manage group savings.

---

## 🎯 Core Use Cases

### 1. **Shared Expense Splitting**
- Roommates splitting rent, utilities, groceries
- Friends splitting dinner bills, travel expenses
- Family members sharing household costs

### 2. **Event Fundraising**
- Collecting money for birthday gifts
- Organizing group trips
- Fundraising for events or causes

### 3. **Group Savings Goals**
- Vacation fund with friends
- Wedding expenses pool
- Business investment pooling

### 4. **Recurring Collections**
- Weekly/monthly subscription fees
- Regular expense sharing
- Recurring bill splitting

---

## 📊 Technical Architecture

### **Database Schema**

```typescript
// Firestore Collections Structure

Collection: "moneyPools"
Document: {
  id: string;
  name: string;
  description?: string;
  createdBy: string; // userId
  currency: string; // 'PKR', 'USD', etc.
  targetAmount: number;
  collectedAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  poolType: 'split_bill' | 'fundraising' | 'recurring' | 'goal_saving';
  
  // Settings
  visibility: 'public' | 'private'; // Can users join by code?
  joinCode?: string; // For private pools
  autoComplete: boolean; // Auto-close when target reached
  recurringPeriod?: 'weekly' | 'monthly' | 'yearly';
  
  // Timing
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  
  // Participants
  participants: {
    userId: string;
    email: string;
    name: string;
    joinedAt: string;
    isActive: boolean;
    contributionAmount: number; // Total they contributed
  }[];
  
  // Contribution tracking
  contributions: {
    id: string;
    poolId: string;
    userId: string;
    amount: number;
    notes?: string;
    createdAt: string;
    status: 'pending' | 'confirmed' | 'reversed';
  }[];
  
  // Settlement
  settlementMethod: 'auto_split' | 'manual' | 'custom';
  splitRules?: {
    userId: string;
    expectedAmount: number;
  }[];
  
  // Activity log
  activityLog: {
    timestamp: string;
    type: 'created' | 'joined' | 'contributed' | 'withdrawn' | 'completed' | 'cancelled';
    userId: string;
    description: string;
  }[];
}

Collection: "poolInvitations"
Document: {
  id: string;
  poolId: string;
  invitedBy: string;
  invitedUserId?: string; // If user exists in app
  email: string;
  code: string; // Invitation code
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
}

Collection: "poolNotifications"
Document: {
  id: string;
  userId: string;
  poolId: string;
  type: 'invitation' | 'contribution' | 'settlement' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
```

---

## 🎨 User Interface Components

### **1. Money Pools List Page** (`/pools`)
```tsx
- Create Pool Button (floating action)
- Filter tabs: "Active", "Completed", "I Created", "Joined"
- Search and filter by pool name, type
- Pool cards showing:
  * Progress bar (collected/target)
  * Participant count
  * Days remaining
  * Status badge
```

### **2. Create Pool Dialog**
```tsx
Form Fields:
- Pool Name (required)
- Description (optional)
- Pool Type: Split Bill | Fundraising | Recurring | Goal Saving
- Target Amount (required, must be positive)
- Currency (from user settings)
- Visibility: Public | Private (with join code)
- Start Date (default: today)
- End Date (optional)
- Auto-complete when target reached (toggle)
- For "Recurring" type: Select frequency
```

### **3. Pool Details Page** (`/pools/[poolId]`)
```tsx
Header:
- Pool name, description, status badge
- Progress bar (visual + percentage)
- Quick actions: Invite, Contribute, Settings

Tabs:
1. Overview
   - Pool summary card
   - Total collected
   - Days remaining
   - Top contributors

2. Participants
   - List of members with contributions
   - Roles: Creator, Member
   - "Invite" button for creator

3. Contributions
   - Transaction history table
   - Sortable by amount, date
   - Filter by user

4. Activity Log
   - Timeline of pool events
   - Who did what and when

Actions (based on role):
- Creator: Invite, Close Pool, Cancel Pool, Settings
- Member: Contribute, Leave Pool
- Non-member: Join (if public or has code)
```

### **4. Contribute Dialog**
```tsx
- Amount input (with currency)
- Notes (optional)
- Payment method selector
  * Cash
  * Bank Transfer
  * Already Paid (manual entry)
- Add as Income Transaction (checkbox)
  - Link to user's account
  - Auto-create transaction on confirm
```

### **5. Invite Participants Dialog**
```tsx
- Invite by Email (for existing users)
- Generate Invite Link/Code
- Share via:
  * Copy link
  * WhatsApp
  * Email
  * QR Code
```

---

## 🔧 Implementation Plan

### **Phase 1: Core Infrastructure**
```
✅ Create types (MoneyPool, Contribution, Participant)
✅ Create Firestore schema
✅ Create pool context (usePools)
✅ Create service layer (pools.ts)
```

### **Phase 2: Basic CRUD**
```
✅ Create pool functionality
✅ List pools (with filters)
✅ Pool details view
✅ Join pool (by code or invitation)
```

### **Phase 3: Contributions**
```
✅ Make contribution to pool
✅ Track contributions in Firestore
✅ Update collected amount
✅ Auto-complete when target reached
```

### **Phase 4: Social Features**
```
✅ Invite participants (email + code)
✅ Pool activity timeline
✅ Push notifications for:
   - New contributions
   - Goal reached
   - Pool ending soon
✅ Participant roles and permissions
```

### **Phase 5: Advanced Features**
```
✅ Recurring pools (weekly/monthly)
✅ Settlement options (auto-split vs manual)
✅ Integration with Transactions module
   - Auto-create income/expense
   - Link pool to specific account
✅ Pool analytics (contribution trends)
✅ Export pool report (PDF/Excel)
```

### **Phase 6: AI Enhancement**
```
✅ Smart split suggestions (AI calculates fair splits)
✅ Predictive funding (when will pool complete?)
✅ Expense categorization (link to user's budget)
✅ Fraud detection (unusual contribution patterns)
```

---

## 🚀 Component Structure

```
src/
├── app/(app)/pools/
│   ├── page.tsx              # Pools list
│   ├── [poolId]/
│   │   └── page.tsx            # Pool details
│   ├── create/
│   │   └── page.tsx           # Create pool wizard
│   └── components/
│       ├── pool-card.tsx
│       ├── pool-progress.tsx
│       ├── contribution-form.tsx
│       ├── invite-dialog.tsx
│       └── activity-timeline.tsx
├── components/pools/
│   ├── pool-list.tsx
│   ├── pool-filters.tsx
│   ├── participant-list.tsx
│   ├── contribution-history.tsx
│   └── share-pool.tsx
├── contexts/
│   └── pool-context.tsx       # New context
└── services/
    └── pools.ts               # New service
```

---

## 🔐 Security & Permissions

### **Firestore Rules**
```javascript
// moneyPools rules
match /moneyPools/{poolId} {
  allow read: if request.auth != null && 
    (resource.data.visibility == 'public' || 
     request.auth.uid in resource.data.participants.map(p => p.userId) ||
     request.auth.uid == resource.data.createdBy);
  
  allow create: if request.auth != null;
  allow update: if request.auth != null && 
    (request.auth.uid == resource.data.createdBy || 
     request.auth.uid in resource.data.participants.map(p => p.userId));
  allow delete: if request.auth != null && 
    request.auth.uid == resource.data.createdBy;
}

// contributions rules
match /moneyPools/{poolId}/contributions/{contributionId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.userId || 
     request.auth.uid in get(/databases/$(database)/documents/moneyPools/$(poolId)).data.participants.map(p => p.userId));
  allow create: if request.auth != null;
  allow update, delete: if request.auth != null && 
    request.auth.uid == resource.data.userId;
}
```

---

## 📱 User Flow Examples

### **Scenario 1: Split Dinner Bill**
1. User creates pool: "Dinner at XYZ Restaurant"
2. Sets target: $100
3. Invites 3 friends via WhatsApp link
4. Friends join and contribute $25 each
5. Pool auto-completes, funds ready for withdrawal
6. Creator marks as settled

### **Scenario 2: Monthly Rent Split**
1. User creates "Recurring" pool for rent
2. Sets frequency: Monthly
3. Auto-invites same roommates
4. Each month, roommates contribute automatically (or manually)
5. Pool resets or accumulates

### **Scenario 3: Birthday Gift Collection**
1. User creates "Fundraising" pool: "John's 30th Birthday"
2. Shares link in group chat
3. People contribute what they want
4. Pool doesn't auto-complete (flexible goal)
5. Organizer closes pool when ready
6. Can export report of contributors

---

## 🎯 Integration Points

### **With Existing Modules**
1. **Transactions**: Auto-create income when contributing to pool
2. **Accounts**: Link pool contributions to specific account
3. **Budgets**: Track pool spending against category budgets
4. **Reports**: Include pool data in financial reports
5. **Notifications**: Use existing notification system

### **New Dependencies**
- QR code generation (for pool links)
- Optional: Payment gateway integration (Stripe/Razorpay for actual money transfers)

---

## 🎨 UI/UX Considerations

### **Color Coding**
- 🟢 Active pools (on track)
- 🟡 Active pools (needs attention)
- 🔵 Completed pools
- 🔴 Cancelled pools

### **Visual Indicators**
- Progress bar showing collected/target
- Participant avatars with initials
- Recent activity timeline
- Completion date countdown

### **Accessibility**
- Screen reader support
- Keyboard navigation
- High contrast mode
- Responsive design (mobile-first)

---

## 🚦 Priority & MVP

### **MVP (Minimum Viable Product)**
1. Create pool (basic form)
2. Join pool (by code)
3. Make contribution
4. View pool details
5. List active/completed pools

### **Nice to Have (V2)**
- Recurring pools
- Auto-settlement
- Transaction integration
- Advanced analytics
- AI suggestions

---

## 📊 Success Metrics

- Number of pools created
- Average participants per pool
- Pool completion rate
- Average contribution amount
- User retention after first pool
- Cross-module usage (pools + transactions)

---

## 🤔 Questions to Consider

1. **Money Handling**: Does the app hold the money, or just track it?
   - Suggestion: Track only (users settle externally)

2. **Payment Integration**: Add actual payment processing?
   - Suggestion: Start without, add later if needed

3. **Pricing Model**: Should this be a premium feature?
   - Suggestion: Include in paid plans

4. **Group Chat**: Add messaging within pools?
   - Suggestion: V2 feature

5. **Mobile App**: Need native mobile app for this?
   - Suggestion: PWA is sufficient initially

---

## 💡 Next Steps (If Approved)

1. Design review and user feedback
2. Create detailed technical specifications
3. Implement database schema
4. Build UI components
5. Integrate with existing features
6. Testing and deployment
7. Feature announcement

---

## 📝 Notes

- This feature adds a **social/collaborative** layer to the app
- Leverages existing Firebase infrastructure (no new backend needed)
- Can be monetized as premium feature
- Increases user engagement and retention
- Natural extension of the expense tracking capabilities

