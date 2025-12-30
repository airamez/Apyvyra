# Frontend (React + TypeScript + Vite)

The frontend is a modern React application built with TypeScript and Vite, using Material-UI for a professional, responsive design.

## Prerequisites

- Node.js 18 or later
- Backend API running (for development)
- Stripe account (for payment processing - see Payment Integration below)

## Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment configuration**
   - Create `.env` file:
     ```
     VITE_API_URL=http://localhost:5000
     VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
     ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:80` (may require sudo for port 80).

## Project Structure

```
frontend/src/
├── components/           # React components
│   ├── admin/           # Admin panel components
│   │   ├── AdminApp.tsx         # Main admin layout
│   │   ├── Dashboard.tsx        # Admin dashboard
│   │   ├── Products.tsx         # Product management
│   │   ├── Categories.tsx       # Category management
│   │   ├── Customers.tsx        # Customer listing (read-only)
│   │   ├── Staff.tsx            # Staff management
│   │   ├── orders/              # Order management
│   │   │   └── OrderManagement.tsx
│   │   ├── products/            # Product components
│   │   │   ├── Products.tsx
│   │   │   └── ProductForm.tsx
│   │   └── dashboard/           # Dashboard sections
│   │       ├── OrderSection.tsx
│   │       └── CustomerSection.tsx
│   ├── customer/         # Customer-facing components
│   │   ├── Payment.tsx          # Payment processing
│   │   └── payment/             # Payment sub-components
│   │       ├── PaymentShared.tsx
│   │       ├── MockPaymentForm.tsx
│   │       └── StripePaymentForm.tsx
│   ├── public/           # Public pages
│   │   ├── Login.tsx            # Login page
│   │   └── Register.tsx         # Registration page
│   └── common/           # Shared components
│       ├── Layout.tsx           # App layout
│       └── UserProfile.tsx      # User profile component
├── services/            # API service layer
│   ├── authService.ts           # Authentication
│   ├── productService.ts        # Product API
│   ├── userService.ts           # User API
│   ├── orderService.ts          # Order API
│   └── paymentService.ts        # Payment API
├── config/              # Configuration files
│   ├── api.ts                   # API endpoints
│   └── filterConfigs.ts         # Filter configurations
├── utils/               # Utility functions
│   ├── apiErrorHandler.ts       # Error handling
│   └── authService.ts           # Auth utilities
└── types/               # TypeScript type definitions
    └── index.ts                 # Common types
```

## Key Features

### 1. **Admin Panel**
- **Dashboard**: Order statistics and customer metrics
- **Product Management**: Full CRUD with filtering and search
- **Category Management**: Hierarchical category organization
- **Order Management**: Complete order lifecycle with status updates
- **Customer Management**: Read-only customer listing (customers self-register)
- **Staff Management**: Admin-only staff user management

### 2. **Customer Experience**
- **User Registration**: Email confirmation required
- **Secure Login**: JWT-based authentication
- **Product Browsing**: Search and filter products
- **Shopping Cart**: Add/remove items, quantity management
- **Payment Processing**: Stripe integration with mock/test modes
- **Order History**: View past orders and status

### 3. **Order Management System**
- **Complete Workflow**: From pending payment to completed delivery
- **Status Updates**: Logical status transitions with validation
- **Email Notifications**: Automatic shipping confirmations
- **Order Details**: Comprehensive order information display
- **Filtering**: Search by customer, date, status

### 4. **Payment Integration**
- **Mock Mode**: Development-friendly payment simulation
- **Stripe Test Mode**: Real payment processing with test cards
- **Payment Forms**: Separate mock and Stripe payment components
- **Error Handling**: Comprehensive payment error management
- **Webhook Support**: Secure payment event processing

### 5. **Technical Features**
- **Material-UI**: Professional, responsive design
- **TypeScript**: Full type safety throughout
- **Centralized API**: Consistent service layer architecture
- **Error Handling**: Standardized error dialogs and notifications
- **Query Limiting**: Efficient data loading with user feedback
- **FilterComponent**: Reusable, configurable filtering system

## Query Limiting (Modern Filtering Approach)

The frontend implements the modern filtering approach as defined in `paging_vs_filtering.md`:

### Response Headers Handling

All list API calls return metadata headers:
- **`X-Has-More-Records`**: `true` if more records exist than the backend limit
- **`X-Total-Count`**: Total number of records matching the filter

### Implementation

**API Error Handler** (`src/utils/apiErrorHandler.ts`):
```typescript
// Extract metadata from response headers
export function extractQueryMetadata(response: Response): QueryMetadata {
  const hasMoreRecordsHeader = response.headers.get('X-Has-More-Records');
  const totalCountHeader = response.headers.get('X-Total-Count');
  
  return {
    hasMoreRecords: hasMoreRecordsHeader === 'true',
    totalCount: totalCountHeader ? parseInt(totalCountHeader, 10) : 0
  };
}

// Fetch with metadata
export async function apiFetchWithMetadata<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(url, options);
  await handleApiResponse(response);
  
  const metadata = extractQueryMetadata(response);
  const data = await response.json();
  
  return { data, metadata };
}
```

**Service Layer** (e.g., `src/services/productService.ts`):
```typescript
async getAll(): Promise<ApiResponse<Product[]>> {
  return apiFetchWithMetadata<Product[]>(API_ENDPOINTS.PRODUCT.LIST, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authService.getAuthHeader(),
    },
  });
}
```

**Component Usage**:
```typescript
const [products, setProducts] = useState<Product[]>([]);
const [hasMoreRecords, setHasMoreRecords] = useState(false);
const [totalCount, setTotalCount] = useState(0);

const loadProducts = async () => {
  const response = await productService.getAll();
  setProducts(response.data);
  setHasMoreRecords(response.metadata.hasMoreRecords);
  setTotalCount(response.metadata.totalCount);
};

// Display warning when more records exist
{hasMoreRecords && (
  <Alert severity="warning" sx={{ mb: 3 }}>
    Showing {products.length} of {totalCount} results. 
    Please refine your filters to narrow down the search for better results.
  </Alert>
)}
```

### User Experience

When the backend returns more records than the configured limit (default: 100):
1. **Warning Alert** is displayed above the data grid
2. Shows: "Showing X of Y results. Please refine your filters..."
3. Encourages users to use more specific filters
4. Client-side sorting, filtering, and paging work on the loaded data

### Benefits

- **Fast Loading**: Only top N records loaded
- **Clear Feedback**: Users know when results are limited
- **Better UX**: Encourages precise filtering instead of endless scrolling
- **Reduced Load**: Less data transferred over network

## Reusable FilterComponent

All list views use the **FilterComponent** - a configurable, reusable component for dynamic filtering.

### Key Features

- **JSON-based configuration**: Define fields, types, and operators in config files
- **Multiple field types**: string, number, date, boolean, dropdown
- **Flexible operators**: =, ≠, <, ≤, >, ≥, ~(contains), startsWith, endsWith, between
- **Dynamic dropdowns**: Load options from backend endpoints
- **Automatic query building**: Converts filters to backend-compatible query parameters
- **Type-safe**: Full TypeScript support

### Quick Example

```typescript
import FilterComponent from '../components/FilterComponent';
import { productFilterConfig } from '../config/filterConfigs';

<FilterComponent
  config={{
    ...productFilterConfig,
    onSearch: (filters) => loadProducts(filters),
    onClear: () => loadProducts(),
  }}
  hasMoreRecords={hasMoreRecords}
  totalCount={totalCount}
  currentCount={products.length}
/>
```

See `FILTER_COMPONENT_USAGE.md` for complete documentation and examples.

## Server-Side Filtering

All list views use the FilterComponent with a **Search** button that applies filters on the backend before returning results.

### Filter Flow

1. **User enters filter criteria** in the custom filter form above the grid
2. **User clicks "Search"** button or presses Enter in any filter field
3. **Frontend sends filters as query parameters** to backend API
4. **Backend applies filters** and returns limited results (up to `MAX_RECORDS_QUERIES_COUNT`)
5. **Frontend displays results** with inline warning alert if more records exist
6. **User refines filters** to narrow down results further

### Implementation

**Products Component** (`src/components/Products.tsx`):
- Custom filter form above DataGrid
- Search filter (searches name, SKU, description)
- Category dropdown
- Brand text field
- Status dropdown (Active/Inactive/All)
- Search and Clear Filters buttons
- **Warning alert inline** with buttons when more records exist
- **DataGrid column filtering disabled** (`disableColumnFilter={true}`)
- Only client-side sorting and pagination enabled

**Categories Component** (`src/components/Categories.tsx`):
- Custom filter form above Table
- Search filter (searches name, description)
- Search and Clear buttons
- Warning alert when more records exist
- Simple Table component (no grid filtering)

### Why Not GraphQL?

**REST with query parameters is the better choice** for this use case:

✅ **Advantages**:
- Simple field-based filtering (e.g., `?categoryId=5&brand=Nike`)
- No additional complexity or dependencies
- Works perfectly with existing REST architecture
- Easy to understand and maintain
- Standard HTTP query parameters

❌ **GraphQL would be overkill**:
- Adds significant complexity (schema, resolvers, new libraries)
- Your queries are simple list/detail operations
- No complex nested data requirements
- No over-fetching issues to solve
- Would require rewriting entire API layer

**Conclusion**: REST + query parameters provides all the filtering flexibility you need without GraphQL's overhead.

## Payment Integration

### Stripe Configuration

The frontend supports both mock and real Stripe payment processing:

#### Environment Variables
```bash
# .env file
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

#### Payment Modes

**Mock Mode** (Development):
- Set `MockStripe: true` in backend `appsettings.json`
- Simulates successful payments without real charges
- No Stripe keys required for basic testing
- Perfect for development and demos

**Stripe Test Mode** (Real Testing):
- Use test keys from Stripe Dashboard
- Real payment flow without actual charges
- Test with Stripe's test card numbers
- Full payment processing experience

#### Test Card Numbers
Use these in the payment form:
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- Any future expiry date, any CVC, any 5-digit ZIP code

#### Payment Flow
1. **Cart Checkout**: User proceeds to payment
2. **Payment Form**: Mock or Stripe form based on backend config
3. **Payment Intent**: Created on backend with Stripe
4. **Confirmation**: Payment processed and order created
5. **Redirect**: User redirected to order confirmation

### Payment Components

The payment system uses modular components:

```
src/components/customer/payment/
├── Payment.tsx              # Main payment orchestrator
├── PaymentShared.tsx        # Shared UI components
├── MockPaymentForm.tsx      # Mock payment form
└── StripePaymentForm.tsx    # Real Stripe payment form
```

**Key Features**:
- **Service Injection**: Backend determines payment mode
- **Shared UI**: Consistent payment experience
- **Error Handling**: Comprehensive payment error management
- **Loading States**: Visual feedback during processing

## Authentication Flow

### User Registration
1. **Registration Form**: Email and password
2. **Email Confirmation**: Required for account activation
3. **Login**: After email confirmation
4. **Dashboard**: Redirect to appropriate dashboard

### Role-Based Access
- **Admin** (role 0): Full admin panel access
- **Staff** (role 1): Limited admin access (no user management)
- **Customer** (role 2): Customer dashboard and shopping

### JWT Token Management
- **Storage**: Tokens stored in localStorage
- **Auto-refresh**: Token refresh on API calls
- **Expiration**: Automatic logout on token expiry
- **Role Claims**: User role embedded in JWT token

## Component Architecture

### Admin Panel Structure
```
AdminApp (Main Layout)
├── Dashboard (Overview)
├── Products (CRUD + Filtering)
├── Categories (CRUD + Filtering)
├── Customers (Read-only + Filtering)
├── Staff (Admin-only CRUD)
└── Orders (Management + Status Updates)
```

### Customer Flow Structure
```
Public Pages
├── Login (Authentication)
├── Register (User Creation)
└── Customer Dashboard
    ├── Product Browsing
    ├── Shopping Cart
    ├── Payment Processing
    └── Order History
```

### Reusable Components
- **FilterComponent**: Dynamic filtering across all list views
- **DataGrid**: Consistent table display with sorting/pagination
- **ErrorDialog**: Standardized error handling
- **LoadingSpinner**: Consistent loading states

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality
- `npm run type-check` - TypeScript type checking

## Building for Production

```bash
npm run build
```

The build output in `dist/` can be:
- Served by the backend (recommended)
- Deployed to static hosting (Vercel, Netlify, etc.)
- Containerized with Docker

### Production Considerations
- **Environment Variables**: Set `VITE_API_URL` to production backend
- **Stripe Keys**: Use production Stripe publishable key
- **HTTPS**: Required for Stripe payments in production
- **CORS**: Backend must allow production origin

## Development Tips

### Hot Module Replacement
- Changes to components auto-refresh in browser
- State is preserved during hot reload
- Fast development iteration

### API Integration
- Use `apiFetch` and `apiFetchWithMetadata` for API calls
- Automatic error handling with user-friendly messages
- Consistent loading states across all components

### Styling
- Material-UI theme customization in `theme.ts`
- Responsive design with breakpoints
- Consistent spacing and color scheme

### TypeScript
- Full type safety throughout the application
- Interfaces defined in `types/` directory
- Service layer returns typed responses
