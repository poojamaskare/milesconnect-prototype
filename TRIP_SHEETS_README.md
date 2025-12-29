# Trip Sheets System - Implementation Guide

## Overview

The Trip Sheets system is a comprehensive fleet management tool that tracks vehicle journeys, including driver information, routes, mileage, fuel stops, and expenses. This implementation provides managers with the ability to create, edit, and manage trip sheets for their logistics operations.

## Features Implemented

### 1. **Enhanced Database Schema**

- **TripSheet Model**: Core trip tracking with comprehensive fields

  - Basic info: Sheet number, status, timestamps
  - Route tracking: Start/end locations, route descriptions
  - Odometer readings: Start and end kilometers
  - Fuel tracking: Fuel levels at start and end
  - Expense summaries: Fuel, toll, and other expenses (stored as cents)
  - Notes and approval tracking

- **FuelStop Model**: Detailed fuel stop records

  - Location, odometer reading, fuel quantity
  - Pricing information and total cost
  - Receipt tracking and notes

- **TripExpense Model**: Expense categorization
  - Categories: Toll, Parking, Repair, Food, Other
  - Amount tracking (stored as cents for accuracy)
  - Receipt and documentation support

### 2. **Backend API Endpoints**

#### Trip Sheet Management

- `GET /api/trip-sheets` - List all trip sheets
- `POST /api/trip-sheets` - Create new trip sheet
- `GET /api/trip-sheets/:id` - Get trip sheet details
- `PATCH /api/trip-sheets/:id` - Update trip sheet (DRAFT only)
- `PATCH /api/trip-sheets/:id/status` - Update status

#### Fuel & Expenses

- `POST /api/trip-sheets/:id/fuel-stops` - Add fuel stop
- `POST /api/trip-sheets/:id/expenses` - Add expense

#### Bulk Operations

- `POST /api/trip-sheets/create-from-shipments` - Auto-create trip sheets for shipments

### 3. **Frontend Pages**

#### Main Trip Sheets Page (`/trip-sheets`)

- View all trip sheets filtered by date
- **"Create from Shipments"** button - Automatically creates trip sheets for:
  - Shipments with status PLANNED or IN_TRANSIT
  - Shipments that don't already have a trip sheet
  - Groups shipments by driver and vehicle
- **"Create Trip Sheet"** button - Manual creation
- Click on any trip sheet to edit it

#### Create Trip Sheet (`/trip-sheets/create`)

- Form to manually create new trip sheets
- Select driver and vehicle
- Set route information and starting details
- Link to multiple shipments
- Add initial fuel and odometer readings

#### Edit Trip Sheet (`/trip-sheets/[id]/edit`)

- Complete trip details editing (DRAFT status only)
- Add fuel stops with location, quantity, and cost
- Track expenses by category
- Update odometer readings and end location
- View linked shipments
- Real-time expense and fuel stop management

## Usage Guide

### For Managers

#### Creating Trip Sheets Automatically

1. Navigate to the Trip Sheets page
2. Click **"Create from Shipments"** button
3. System will:
   - Find all shipments that need trip sheets
   - Group them by driver and vehicle
   - Create trip sheets automatically
   - Display success message with count

#### Creating Trip Sheets Manually

1. Click **"Create Trip Sheet"** button
2. Fill in required fields:
   - Sheet number (auto-generated)
   - Driver and Vehicle
   - Start time and location
   - Optional: Route description, fuel level, odometer reading
3. Select shipments to include
4. Click "Create Trip Sheet"

#### Editing Trip Sheets

1. Click on any trip sheet from the list
2. Update completion details:
   - End odometer reading and location
   - End time
   - Fuel level at end
3. Add fuel stops:
   - Click "+ Add Fuel Stop"
   - Enter location, fuel quantity, and cost
   - Save fuel stop
4. Add expenses:
   - Click "+ Add Expense"
   - Select category (Toll, Parking, etc.)
   - Enter amount and description
   - Save expense
5. Click "Save Changes" to update

## Technical Details

### Currency Handling

- All monetary values are stored as **integer cents** in the database
- This ensures precision in calculations and avoids floating-point errors
- Frontend displays values in rupees (₹) with proper conversion

### Status Workflow

- **DRAFT**: Editable, can add fuel stops and expenses
- **SUBMITTED**: No longer editable, awaiting approval
- **APPROVED**: Finalized by manager
- **CANCELLED**: Cancelled trip

### Validation Rules

- Only DRAFT status trip sheets can be edited
- Driver and vehicle are required
- Fuel stops require location, quantity, and total cost
- Expenses require category and amount

### Data Relationships

- Trip sheets link to multiple shipments (many-to-many)
- Each trip sheet has one driver and one vehicle
- Fuel stops and expenses cascade delete with trip sheet

## API Request Examples

### Create Trip Sheet

\`\`\`json
POST /api/trip-sheets
{
"sheetNo": "TS-1735309877123",
"driverId": "driver-uuid",
"vehicleId": "vehicle-uuid",
"createdById": "user-uuid",
"startOdometerKm": 50000,
"startedAt": "2025-12-27T08:00:00Z",
"startLocation": "Warehouse A",
"endLocation": "Warehouse B",
"fuelAtStart": 45.5,
"shipmentIds": ["shipment-uuid-1", "shipment-uuid-2"]
}
\`\`\`

### Add Fuel Stop

\`\`\`json
POST /api/trip-sheets/:id/fuel-stops
{
"location": "Shell Petrol Pump, Highway 45",
"odometerKm": 50250,
"fuelLiters": 30.5,
"pricePerLiter": 102.50,
"totalCostCents": 312625,
"receiptNumber": "REC-12345",
"fueledAt": "2025-12-27T12:30:00Z"
}
\`\`\`

### Add Expense

\`\`\`json
POST /api/trip-sheets/:id/expenses
{
"category": "Toll",
"description": "Highway toll - Mumbai to Pune",
"amountCents": 35000,
"receiptNumber": "TOLL-67890",
"expenseAt": "2025-12-27T10:15:00Z"
}
\`\`\`

### Create from Shipments

\`\`\`json
POST /api/trip-sheets/create-from-shipments
{
"createdById": "user-uuid"
}
\`\`\`

## Database Migration

The schema was updated with the migration:
\`\`\`
20251227132117_add_fuel_and_expenses_to_trip_sheets
\`\`\`

This migration adds:

- New fields to TripSheet table
- FuelStop table
- TripExpense table
- All necessary indexes and constraints

## Future Enhancements

Potential improvements:

1. **PDF Export**: Generate printable trip sheets
2. **Manager Approval**: Workflow for approving trip sheets
3. **Analytics**: Dashboard showing fuel efficiency, expenses by category
4. **GPS Integration**: Automatic route tracking
5. **Receipt Upload**: Attach receipt images to fuel stops and expenses
6. **Mobile App**: Driver app for real-time updates
7. **Automated Reports**: Daily/weekly trip sheet summaries

## Notes for Development

- User authentication context needs to be implemented for proper `createdById` tracking
- Currently using placeholder user ID: `00000000-0000-0000-0000-000000000001`
- Consider adding role-based permissions (only managers can approve)
- Implement soft deletes for audit trail
- Add email notifications for status changes

## Troubleshooting

### Trip Sheet Not Editable

- Check if status is DRAFT
- Only DRAFT trip sheets can be modified

### Create from Shipments Returns No Results

- Verify shipments have status PLANNED or IN_TRANSIT
- Ensure shipments have both driver and vehicle assigned
- Check if shipments already have trip sheets

### Fuel Stop/Expense Not Saving

- Ensure trip sheet is in DRAFT status
- Verify all required fields are provided
- Check that amounts are valid numbers

---

_Last Updated: December 27, 2025_
