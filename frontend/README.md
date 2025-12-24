# Frontend (React + TypeScript + Vite)

The frontend is a React application built with TypeScript and Vite, using Material-UI for components.

## Prerequisites

- Node.js 18 or later
- Backend API running (for development)

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
     ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:80` (may require sudo for port 80).

## Project Structure

- **src/components/**: React components (Products, Login, etc.)
- **src/services/**: API service functions
- **src/config/**: API configuration
- **src/utils/**: Utility functions (error handling)
- **public/**: Static assets

## Key Features

- Material-UI components throughout
- Centralized API configuration
- Standardized error handling with dialogs
- Authentication flow (login/register)
- Data grids with filtering and pagination
- Responsive design
- Query limiting with automatic warnings when more records exist

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

## Server-Side Filtering

All list views include a **custom filter form** with a **Search** button that applies filters on the backend before returning results.

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

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Building for Production

```bash
npm run build
```

The build output in `dist/` can be served by the backend or deployed separately.
