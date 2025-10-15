# Fuel Tracker - Regression Testing Plan

**Version:** 1.0
**Date:** October 15, 2025
**Objective:** Verify metrics calculation correctness after implementing initial_odometer and fixing same-day entries sorting

---

## Table of Contents

1. [Changes Overview](#changes-overview)
2. [Testing Scope](#testing-scope)
3. [Acceptance Criteria](#acceptance-criteria)
4. [Test Cases](#test-cases)
   - [TC-001: First Entry with initial_odometer](#tc-001-first-entry-with-initial_odometer)
   - [TC-002: Multiple Entries on Same Day](#tc-002-multiple-entries-on-same-day)
   - [TC-003: Changing initial_odometer](#tc-003-changing-initial_odometer)
   - [TC-004: Multiple Vehicles](#tc-004-multiple-vehicles)
   - [TC-005: Dashboard Metrics Calculation](#tc-005-dashboard-metrics-calculation)
   - [TC-006: Entry Metrics Calculation](#tc-006-entry-metrics-calculation)
   - [TC-007: Entry Deletion](#tc-007-entry-deletion)
   - [TC-008: Entry Editing](#tc-008-entry-editing)
   - [TC-009: Odometer Validation](#tc-009-odometer-validation)
   - [TC-010: Statistics Caching](#tc-010-statistics-caching)
5. [Risk Matrix](#risk-matrix)
6. [Regression Checklist](#regression-checklist)

---

## Changes Overview

### Implemented Changes:

1. **Initial Odometer for Vehicle**
   - Added `initial_odometer` field (default value: 0)
   - First entry calculates `distance_since_last` from `initial_odometer`
   - When `initial_odometer` changes, all metrics are automatically recalculated

2. **Fixed Sorting for Same-Day Entries**
   - Entries on the same date are now sorted by `odometer` (ascending)
   - Metrics calculation considers multiple entries on the same day
   - Dashboard correctly displays entries in chronological order

3. **Updated Metrics Calculation Logic**
   - `total_distance = sum(distance_since_last)` for all entries
   - `average_consumption = total_fuel / total_distance * 100`
   - `average_cost_per_km = total_cost / total_distance`

---

## Testing Scope

### In Scope:
- ✅ Create/edit/delete vehicles
- ✅ Create/edit/delete fuel entries
- ✅ Metrics calculation for first entry (from initial_odometer)
- ✅ Metrics calculation for same-day entries
- ✅ Metrics recalculation when initial_odometer changes
- ✅ Dashboard statistics (single vehicle)
- ✅ Dashboard statistics (multiple vehicles)
- ✅ Vehicle filter
- ✅ Odometer validation (monotonic increase)
- ✅ Cache invalidation

### Out of Scope:
- ❌ Authentication and authorization (covered by automated tests)
- ❌ UI/UX components (unchanged)
- ❌ Data export (unchanged)
- ❌ Performance (not critical for MVP)

---

## Acceptance Criteria

### Critical (Blockers):
1. ✅ First entry metrics calculated from `initial_odometer`
2. ✅ Same-day entries correctly sorted and calculated
3. ✅ Changing `initial_odometer` recalculates all metrics
4. ✅ Dashboard shows correct metrics for all vehicles
5. ✅ No regression in existing functionality

### Non-Critical:
- ⚠️ Metrics recalculation performance (acceptable up to 5 seconds for 1000 entries)
- ⚠️ Caching works correctly (TTL 60 seconds)

---

## Test Cases

---

### TC-001: First Entry with initial_odometer

**Priority:** Critical
**Objective:** Verify that the first entry calculates metrics from initial_odometer

#### Preconditions:
1. User is authenticated
2. Vehicle created with `initial_odometer = 100`

#### Steps:
1. Navigate to "Fuel Entries" page
2. Click "Add Entry"
3. Fill the form:
   - **Vehicle:** Select created vehicle
   - **Date:** Today's date
   - **Odometer:** 500 km
   - **Station:** Shell
   - **Brand:** Shell
   - **Grade:** 95
   - **Liters:** 40.00 L
   - **Total Amount:** $100.00
4. Click "Create Entry"
5. Navigate to entry details (click on table row)

#### Expected Result:
- **Status:** 201 Created
- **distance_since_last:** 400 km (500 - 100)
- **consumption_l_100km:** 10.0 L/100km (40 / 400 * 100)
- **cost_per_km:** $0.25/km (100 / 400)
- **unit_price:** $2.50/L (100 / 40)

#### Verification Formula:
```
distance_since_last = odometer - initial_odometer = 500 - 100 = 400
consumption = (liters / distance) * 100 = (40 / 400) * 100 = 10.0
cost_per_km = total_amount / distance = 100 / 400 = 0.25
unit_price = total_amount / liters = 100 / 40 = 2.50
```

---

### TC-002: Multiple Entries on Same Day

**Priority:** Critical
**Objective:** Verify correct metrics calculation for multiple entries on the same date

#### Preconditions:
1. User is authenticated
2. Vehicle created with `initial_odometer = 0`
3. First entry created: `date=Oct 10, odometer=100, liters=10, cost=25`

#### Steps:
1. Create second entry on **same date** (Oct 10):
   - **Odometer:** 200 km
   - **Liters:** 15.00 L
   - **Total Amount:** $37.50
2. Create third entry on **same date** (Oct 10):
   - **Odometer:** 350 km
   - **Liters:** 20.00 L
   - **Total Amount:** $50.00
3. Check entries list on "Fuel Entries" page
4. Check metrics for each entry

#### Expected Result:

**Sort order in list (top to bottom):**
1. Oct 10 | odo=350 | 150 km | ...
2. Oct 10 | odo=200 | 100 km | ...
3. Oct 10 | odo=100 | 100 km | ...

**Entry Metrics:**
- **Entry 1** (odo=100):
  - `distance_since_last = 100` (100 - 0)
  - `consumption = 10.0 L/100km` (10 / 100 * 100)

- **Entry 2** (odo=200):
  - `distance_since_last = 100` (200 - 100)
  - `consumption = 15.0 L/100km` (15 / 100 * 100)

- **Entry 3** (odo=350):
  - `distance_since_last = 150` (350 - 200) ✅ **NOT 350!**
  - `consumption = 13.3 L/100km` (20 / 150 * 100)

#### Verification Formula:
```
Entry 1: distance = 100 - 0 (initial) = 100
Entry 2: distance = 200 - 100 (prev on same day) = 100
Entry 3: distance = 350 - 200 (prev on same day) = 150

Total distance = 100 + 100 + 150 = 350 km ✅
```

---

### TC-003: Changing initial_odometer

**Priority:** Critical
**Objective:** Verify automatic metrics recalculation when initial_odometer changes

#### Preconditions:
1. User is authenticated
2. Vehicle created with `initial_odometer = 0`
3. Three entries created:
   - Entry 1: `date=Oct 01, odo=100, liters=10`
   - Entry 2: `date=Oct 05, odo=300, liters=20`
   - Entry 3: `date=Oct 10, odo=500, liters=25`

#### Steps:
1. Navigate to "Vehicles" page
2. Click "Edit" on the vehicle
3. Change `initial_odometer` from **0** to **50**
4. Click "Save"
5. Navigate to "Fuel Entries" page
6. Check metrics for each entry
7. Navigate to Dashboard
8. Check `total_distance`

#### Expected Result:

**Before change (initial_odometer = 0):**
- Entry 1: `distance = 100` (100 - 0)
- Entry 2: `distance = 200` (300 - 100)
- Entry 3: `distance = 200` (500 - 300)
- **Total distance = 500 km**

**After change (initial_odometer = 50):**
- Entry 1: `distance = 50` (100 - 50) ✅ **Recalculated!**
- Entry 2: `distance = 200` (300 - 100) ✅ **Unchanged**
- Entry 3: `distance = 200` (500 - 300) ✅ **Unchanged**
- **Total distance = 450 km** ✅

**Dashboard:**
- `total_distance = 450 km` ✅
- `average_consumption` recalculated ✅

#### Verification Formula:
```
new_distance_entry1 = 100 - 50 = 50 (was 100)
distance_entry2 = 300 - 100 = 200 (unchanged)
distance_entry3 = 500 - 300 = 200 (unchanged)

total_distance = 50 + 200 + 200 = 450 km
```

---

### TC-004: Multiple Vehicles

**Priority:** High
**Objective:** Verify correct metrics calculation for multiple vehicles

#### Preconditions:
1. User is authenticated
2. Two vehicles created:
   - **Vehicle A:** `initial_odometer = 0`
   - **Vehicle B:** `initial_odometer = 1000`

#### Steps:
1. Create entries for **Vehicle A**:
   - Entry 1: `date=Oct 01, odo=100, liters=10, cost=25`
   - Entry 2: `date=Oct 05, odo=200, liters=15, cost=37.5`

2. Create entries for **Vehicle B**:
   - Entry 1: `date=Oct 03, odo=1200, liters=20, cost=50`
   - Entry 2: `date=Oct 07, odo=1500, liters=30, cost=75`

3. Navigate to Dashboard (without vehicle filter)
4. Check "All Vehicles" metrics
5. Select "Vehicle A" filter
6. Check Vehicle A metrics
7. Select "Vehicle B" filter
8. Check Vehicle B metrics

#### Expected Result:

**All Vehicles (no filter):**
- `total_distance = 600 km` (100 + 100 + 200 + 300)
- `total_fuel = 75 L` (10 + 15 + 20 + 30)
- `total_spent = $187.50` (25 + 37.5 + 50 + 75)
- `average_consumption = 12.5 L/100km` (75 / 600 * 100)
- `fill_up_count = 4`

**Vehicle A (filtered):**
- `total_distance = 200 km` (100 + 100)
- `total_fuel = 25 L` (10 + 15)
- `total_spent = $62.50` (25 + 37.5)
- `average_consumption = 12.5 L/100km` (25 / 200 * 100)
- `fill_up_count = 2`

**Vehicle B (filtered):**
- `total_distance = 400 km` (200 + 300)
- `total_fuel = 50 L` (20 + 30)
- `total_spent = $125.00` (50 + 75)
- `average_consumption = 12.5 L/100km` (50 / 400 * 100)
- `fill_up_count = 2`

#### Verification Formula:
```
Vehicle A:
  Entry 1: distance = 100 - 0 = 100
  Entry 2: distance = 200 - 100 = 100
  Total: 100 + 100 = 200 km

Vehicle B:
  Entry 1: distance = 1200 - 1000 = 200
  Entry 2: distance = 1500 - 1200 = 300
  Total: 200 + 300 = 500 km

All Vehicles: 200 + 500 = 700 km
```

---

### TC-005: Dashboard Metrics Calculation

**Priority:** Critical
**Objective:** Verify correctness of all Dashboard metrics

#### Preconditions:
1. User is authenticated
2. Vehicle created with `initial_odometer = 30`
3. Entries created:
   - Entry 1: `date=Oct 04, odo=130, liters=10, cost=25` (price=2.50)
   - Entry 2: `date=Oct 08, odo=200, liters=10, cost=25` (price=2.50)
   - Entry 3: `date=Oct 13, odo=300, liters=9.99, cost=17.97` (price=1.80)
   - Entry 4: `date=Oct 13, odo=350, liters=5, cost=10` (price=2.00)

#### Steps:
1. Navigate to Dashboard
2. Select "30d" period
3. Verify all metrics

#### Expected Result:

**Dashboard Metrics (period: 30d):**

| Metric | Formula | Expected Value |
|--------|---------|----------------|
| **Total Distance** | sum(distance_since_last) | **320 km** |
| **Total Spent** | sum(total_amount) | **$77.97** |
| **Total Fuel** | sum(liters) | **34.99 L** |
| **Average Consumption** | (total_fuel / total_distance) * 100 | **10.9 L/100km** |
| **Average Price** | total_spent / total_fuel | **$2.23/L** |
| **Average Cost per km** | total_spent / total_distance | **$0.24/km** |
| **Fill-up Count** | count(*) | **4** |
| **Average Distance/Day** | total_distance / period_days | **≈ 32 km/day** (320/10) |

#### Detailed Calculation:
```
Entry 1: distance = 130 - 30 = 100 km
Entry 2: distance = 200 - 130 = 70 km
Entry 3: distance = 300 - 200 = 100 km
Entry 4: distance = 350 - 300 = 50 km

Total Distance = 100 + 70 + 100 + 50 = 320 km ✅

Total Fuel = 10 + 10 + 9.99 + 5 = 34.99 L ✅

Total Spent = 25 + 25 + 17.97 + 10 = 77.97 ✅

Average Consumption = (34.99 / 320) * 100 = 10.93 L/100km ≈ 10.9 ✅

Average Price = 77.97 / 34.99 = 2.23 $/L ✅

Average Cost per km = 77.97 / 320 = 0.244 $/km ≈ 0.24 ✅

Period Days = Oct 13 - Oct 04 + 1 = 10 days
Average Distance/Day = 320 / 10 = 32 km/day ✅
```

---

### TC-006: Entry Metrics Calculation

**Priority:** High
**Objective:** Verify correct metrics calculation for individual entry

#### Preconditions:
1. User is authenticated
2. Vehicle created with `initial_odometer = 5000`
3. Previous entry created: `date=Oct 01, odo=5200, liters=25, cost=50`

#### Steps:
1. Create new entry:
   - **Date:** Oct 10
   - **Odometer:** 5650 km
   - **Liters:** 30.00 L
   - **Total Amount:** $75.00
2. Open entry details

#### Expected Result:

**Entry Metrics:**
- `distance_since_last = 450 km` (5650 - 5200)
- `consumption_l_100km = 6.67 L/100km` (30 / 450 * 100)
- `cost_per_km = $0.167/km` (75 / 450)
- `unit_price = $2.50/L` (75 / 30)

#### Verification Formula:
```
distance = 5650 - 5200 = 450 km
consumption = (30 / 450) * 100 = 6.67 L/100km
cost_per_km = 75 / 450 = 0.167 $/km
unit_price = 75 / 30 = 2.50 $/L
```

---

### TC-007: Entry Deletion

**Priority:** High
**Objective:** Verify metrics recalculation after entry deletion

#### Preconditions:
1. User is authenticated
2. Vehicle created with `initial_odometer = 0`
3. Three entries created:
   - Entry 1: `date=Oct 01, odo=100, liters=10, cost=25`
   - Entry 2: `date=Oct 05, odo=300, liters=20, cost=50` ← **Will delete**
   - Entry 3: `date=Oct 10, odo=500, liters=25, cost=62.5`

#### Steps:
1. Navigate to "Fuel Entries" page
2. Delete Entry 2 (odo=300)
3. Check Entry 3 metrics
4. Navigate to Dashboard
5. Check `total_distance` and `average_consumption`

#### Expected Result:

**Before deletion:**
- Entry 1: `distance = 100`
- Entry 2: `distance = 200` (300 - 100)
- Entry 3: `distance = 200` (500 - 300)
- **Total distance = 500 km**

**After deleting Entry 2:**
- Entry 1: `distance = 100`
- Entry 3: `distance = 400` (500 - 100) ✅ **Recalculated!**
- **Total distance = 500 km** ✅

**Dashboard:**
- `total_distance = 500 km` ✅
- `total_fuel = 35 L` (10 + 25, without Entry 2)
- `average_consumption = 7.0 L/100km` (35 / 500 * 100)

#### Verification Formula:
```
After deleting Entry 2:
  Entry 1: distance = 100 - 0 = 100
  Entry 3: distance = 500 - 100 = 400 (recalculated!)

Total distance = 100 + 400 = 500 km
```

---

### TC-008: Entry Editing

**Priority:** High
**Objective:** Verify metrics recalculation after editing odometer

#### Preconditions:
1. User is authenticated
2. Vehicle created with `initial_odometer = 0`
3. Three entries created:
   - Entry 1: `date=Oct 01, odo=100, liters=10`
   - Entry 2: `date=Oct 05, odo=300, liters=20` ← **Will edit**
   - Entry 3: `date=Oct 10, odo=500, liters=25`

#### Steps:
1. Navigate to "Fuel Entries" page
2. Edit Entry 2:
   - Change `odometer` from **300** to **250**
3. Save changes
4. Check Entry 2 and Entry 3 metrics
5. Navigate to Dashboard
6. Check `total_distance`

#### Expected Result:

**Before editing:**
- Entry 1: `distance = 100`
- Entry 2: `distance = 200` (300 - 100)
- Entry 3: `distance = 200` (500 - 300)
- **Total distance = 500 km**

**After editing (odo=250):**
- Entry 1: `distance = 100`
- Entry 2: `distance = 150` (250 - 100) ✅ **Recalculated!**
- Entry 3: `distance = 250` (500 - 250) ✅ **Recalculated!**
- **Total distance = 500 km** ✅

**Dashboard:**
- `total_distance = 500 km` ✅

#### Verification Formula:
```
After changing Entry 2 odometer to 250:
  Entry 1: distance = 100 - 0 = 100
  Entry 2: distance = 250 - 100 = 150 (recalculated!)
  Entry 3: distance = 500 - 250 = 250 (recalculated!)

Total distance = 100 + 150 + 250 = 500 km
```

---

### TC-009: Odometer Validation

**Priority:** Medium
**Objective:** Verify monotonic increase validation for odometer

#### Preconditions:
1. User is authenticated
2. Vehicle created with `initial_odometer = 1000`
3. Entry created: `date=Oct 10, odo=1500, liters=20`

#### Steps:

**Scenario 1: Odometer less than initial_odometer**
1. Create entry with `odometer = 500` (less than 1000)
2. Click "Create Entry"

**Expected Result:**
- **Status:** 400 Bad Request
- **Error:** "Odometer reading must be greater than or equal to initial odometer (1000 km)"

**Scenario 2: Odometer less than previous entry**
1. Create entry with `date=Oct 15, odometer=1200` (less than 1500)
2. Click "Create Entry"

**Expected Result:**
- **Status:** 400 Bad Request
- **Error:** "Odometer reading must be greater than the previous entry (1500 km on Oct 10)"

**Scenario 3: Odometer equals previous entry**
1. Create entry with `date=Oct 15, odometer=1500` (equals 1500)
2. Click "Create Entry"

**Expected Result:**
- **Status:** 201 Created (acceptable, distance_since_last = 0)
- **distance_since_last:** 0 km
- **consumption_l_100km:** NULL (no distance)

---

### TC-010: Statistics Caching

**Priority:** Low
**Objective:** Verify correct caching and invalidation

#### Preconditions:
1. User is authenticated
2. Vehicle created with entries

#### Steps:
1. Navigate to Dashboard
2. Remember `total_distance` value
3. Open browser in incognito mode
4. Login
5. Create new entry via API (cURL/Postman)
6. Return to main browser
7. Refresh Dashboard page (F5)
8. Check `total_distance`

#### Expected Result:
- **After creating entry:** `total_distance` **NOT** changed (cache)
- **After refreshing page:** `total_distance` updated ✅

**Note:** Cache is invalidated when creating/editing/deleting entry via UI, but NOT via direct API calls.

---

## Risk Matrix

| Risk | Probability | Impact | Priority | Mitigation |
|------|-------------|--------|----------|-----------|
| Incorrect metrics for first entry | Low | Critical | **P1** | TC-001, TC-005 |
| Incorrect sorting of same-day entries | Low | Critical | **P1** | TC-002, TC-005 |
| Metrics not recalculated on initial_odometer change | Medium | Critical | **P1** | TC-003 |
| Incorrect metrics for multiple vehicles | Low | High | **P2** | TC-004 |
| Metrics not recalculated after entry deletion | Low | High | **P2** | TC-007 |
| Odometer validation works incorrectly | Low | Medium | **P3** | TC-009 |
| Cache not invalidated | Low | Low | **P4** | TC-010 |

---

## Regression Checklist

### Basic Functionality (Smoke Test)

- [ ] **AUTH-001:** Login works
- [ ] **AUTH-002:** Logout works
- [ ] **VEH-001:** Vehicle creation works
- [ ] **VEH-002:** Vehicle editing works
- [ ] **VEH-003:** Vehicle deletion works
- [ ] **ENTRY-001:** Fuel entry creation works
- [ ] **ENTRY-002:** Entry editing works
- [ ] **ENTRY-003:** Entry deletion works
- [ ] **DASH-001:** Dashboard loads
- [ ] **DASH-002:** Vehicle filter works

### Metrics Calculation (Critical Path)

- [ ] **METRIC-001:** First entry calculated from initial_odometer (TC-001)
- [ ] **METRIC-002:** Multiple entries on same day (TC-002)
- [ ] **METRIC-003:** initial_odometer change recalculates metrics (TC-003)
- [ ] **METRIC-004:** Dashboard metrics correct for single vehicle (TC-005)
- [ ] **METRIC-005:** Dashboard metrics correct for multiple vehicles (TC-004)
- [ ] **METRIC-006:** Entry metrics correct (TC-006)
- [ ] **METRIC-007:** Entry deletion recalculates metrics (TC-007)
- [ ] **METRIC-008:** Entry editing recalculates metrics (TC-008)

### Validation (Edge Cases)

- [ ] **VAL-001:** Odometer less than initial_odometer rejected (TC-009)
- [ ] **VAL-002:** Odometer less than previous entry rejected (TC-009)
- [ ] **VAL-003:** Odometer equals previous entry accepted (TC-009)

### UI/UX (Sanity Check)

- [ ] **UI-001:** Same-day entries sorted by odometer (descending)
- [ ] **UI-002:** Form header: "Add Entry" / "Edit Entry" (without "Fuel")
- [ ] **UI-003:** No duplicate close buttons
- [ ] **UI-004:** Dashboard charts display correctly

### Performance (Optional)

- [ ] **PERF-001:** Metrics recalculation for 100 entries < 2 seconds
- [ ] **PERF-002:** Dashboard loads < 1 second
- [ ] **PERF-003:** Cache works (TTL 60 seconds)

---

## Test Execution Results

**Execution Date:** _________________
**Tester:** _________________
**Version:** _________________

| Test Case | Status | Comments |
|-----------|--------|----------|
| TC-001 | ⬜ Pass / ⬜ Fail | |
| TC-002 | ⬜ Pass / ⬜ Fail | |
| TC-003 | ⬜ Pass / ⬜ Fail | |
| TC-004 | ⬜ Pass / ⬜ Fail | |
| TC-005 | ⬜ Pass / ⬜ Fail | |
| TC-006 | ⬜ Pass / ⬜ Fail | |
| TC-007 | ⬜ Pass / ⬜ Fail | |
| TC-008 | ⬜ Pass / ⬜ Fail | |
| TC-009 | ⬜ Pass / ⬜ Fail | |
| TC-010 | ⬜ Pass / ⬜ Fail | |

**Overall Status:** ⬜ PASSED / ⬜ FAILED
**Critical Defects:** _________________
**Release Blocked:** ⬜ YES / ⬜ NO

---

## Conclusion

This plan covers all critical use cases related to metrics calculation and multiple vehicles functionality. Special attention is given to:

1. **First entry** (calculation from initial_odometer)
2. **Multiple entries on same day** (correct sorting)
3. **Changing initial_odometer** (automatic recalculation)
4. **Multiple vehicles** (data isolation and correct aggregation)

All test cases include detailed formulas for manual verification of calculations.
