# ROSCA (Bachat Committee) Integration into Money Pools

## Overview
Adding a "Rotating Savings" mode to the Money Pools feature, allowing users to create traditional Bachat Committee/ROSCA groups.

## Implementation Plan

### Phase 1: Update Pool Types
Add `roasca` as a new pool type alongside existing types:
- split_bill
- fundraising  
- goal_saving
- recurring
- **roasca** (NEW)

### Phase 2: Extend Money Pool Schema
```typescript
export type MoneyPool = {
  // Existing fields...
  
  // ROSCA-specific fields
  poolType: 'split_bill' | 'fundraising' | 'recurring' | 'goal_saving' | 'roasca';
  
  // When poolType === 'roasca'
  roscaConfig?: {
    frequency: 'weekly' | 'monthly';
    contributionAmount: number;
    memberLimit: number; // MUST equal participants.length before starting
    rotationMode: 'fixed_order' | 'ballot_draw';
    graceDays: number;
    lateFeeType: 'flat' | 'percent_per_day';
    lateFeeValue: number;
    escrowEnabled: boolean;
    startDate: string;
    currentPeriod: number; // 1 to memberLimit
    rotationOrder: string[]; // user IDs in payout order
    ballotSeed?: string; // for audit if ballot_draw
  };
  
  // Enhanced participants for ROSCA
  participants: {
    userId: string;
    email: string;
    name: string;
    role: 'owner' | 'member';
    joinedAt: string;
    isActive: boolean;
    // ROSCA-specific
    rotationSlot?: number; // 1 to N (when they receive payout)
    totalContributed: number;
    totalReceived: number;
    lateFeesPaid: number;
    netPosition: number; // contributions - received - late fees
  }[];
  
  // ROSCA contributions tracking
  roscaContributions?: {
    periodIndex: number;
    dueDate: string;
    contributions: {
      memberId: string;
      paidAt?: string;
      amountPaid: number;
      isLate: boolean;
      lateFeeCharged: number;
      paymentRef?: string;
    }[];
    payoutTo: string; // memberId
    payoutDate: string;
    payoutComplete: boolean;
    payoutAmount: number;
  }[];
};
```

### Phase 3: ROSCA Creation Flow
1. User selects "ROSCA (Bachat Committee)" as pool type
2. Configure ROSCA-specific fields:
   - Contribution amount per member per period
   - Frequency (weekly/monthly)
   - Number of members (memberLimit)
   - Rotation mode (fixed order or ballot draw)
   - Grace days for late payments
   - Late fee type and amount
   - Enable escrow (optional)
   - Start date
3. Invite members (must match memberLimit exactly)
4. Arrange rotation order (if fixed_order mode) or run ballot
5. Pool can only start when all members joined

### Phase 4: ROSCA Operation
- Track each period's contributions from all members
- Calculate pot = contributionAmount × memberCount
- Apply late fees after graceDays
- Record payout to assigned member for that period
- Move to next period until all members received
- Mark pool as completed after N periods

### Phase 5: Notifications
- Due reminders before payment date
- Late payment alerts
- Payout notifications
- Owner alerts for delinquent members

### Phase 6: UI Components
1. **ROSCA Setup Wizard**: Multi-step form for creating ROSCA pools
2. **Rotation Timeline**: Visual schedule showing who gets paid when
3. **Period Dashboard**: Track contributions, mark paid, run payout
4. **Member Ledger**: View individual contributions and payouts
5. **Late Fee Calculator**: Auto-calculate and apply late fees
6. **Receipt Generator**: Create downloadable receipts for payments

## File Structure
```
src/
├── app/(app)/pools/
│   ├── create/
│   │   └── page.tsx (existing)
│   ├── [poolId]/
│   │   └── page.tsx (existing)
│   ├── create-roasca/
│   │   └── page.tsx (NEW)
│   └── [poolId]/roasca/
│       ├── schedule.tsx (NEW)
│       ├── ledger.tsx (NEW)
│       └── period/[periodIndex]/page.tsx (NEW)
├── components/pools/
│   ├── roasca/
│   │   ├── setup-wizard.tsx
│   │   ├── rotation-timeline.tsx
│   │   ├── period-dashboard.tsx
│   │   ├── contribution-form.tsx
│   │   ├── payout-manager.tsx
│   │   ├── member-ledger.tsx
│   │   ├── late-fee-calculator.tsx
│   │   └── receipt-generator.tsx
└── services/
    └── rosca.ts (NEW - ROSCA-specific logic)
```

## Step-by-Step Integration

### Step 1: Update UI to Include ROSCA Option
```typescript
// In pools/page.tsx, add to pool type selector:
<SelectItem value="roasca">ROSCA (Bachat Committee)</SelectItem>
```

### Step 2: Conditionally Show ROSCA Config
```typescript
{poolType === "roasca" && (
  <>
    <ROSCAFrequencySelector />
    <ROSCAContributionAmount />
    <ROSCAMemberLimit />
    <ROSCARotationMode />
    <ROSCALateFees />
  </>
)}
```

### Step 3: Create ROSCA Setup Component
- Multi-step wizard
- Member invitation
- Rotation assignment
- Final review and activation

### Step 4: Add ROSCA Operation Components
- Period tracking
- Contribution recording
- Late fee application
- Payout execution
- Completion handling

### Step 5: Implement ROSCA Service Layer
- CRUD operations
- Ballot logic with cryptographic RNG
- Late fee calculations
- Payout validations
- Escrow management

## Key Differences from Regular Pools

| Feature | Regular Pool | ROSCA Pool |
|---------|-------------|------------|
| Goal | Flexible target | Fixed rotation |
| Contributors | Variable | Fixed group |
| Payout | One final payout | Multiple payouts (one per member) |
| Late Fees | Optional | Built-in with grace |
| Rotation | N/A | Sequential or ballot |
| Completion | When target reached | When all members paid once |

## Acceptance Criteria
✅ Can create ROSCA pool with all config options
✅ Must have exact member count before starting
✅ Each member receives payout exactly once
✅ Late fees calculated and applied correctly
✅ Rotation order displayed visually
✅ Periods tracked accurately
✅ Completes after N periods (N = number of members)
✅ Notifications sent at appropriate times
✅ Receipts can be generated/downloaded
✅ Audit trail maintained

