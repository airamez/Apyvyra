
# Server-Side Paging vs. Modern Filtering

This document compares the traditional server-side paging approach with the modern filtering approach for handling large datasets in applications. It explains how each method works and summarizes their advantages and disadvantages.

## 1. Traditional Server-Side Paging

When dealing with large datasets (e.g., thousands of products), the traditional approach is to use **paging** on the server. The client (frontend) requests a specific page and offset, and the server returns only that subset of data.

Filtering can also be applied in the traditional approach (e.g., by name, category, etc.), but paging is always performed over all records that match the filter. This means users may still need to page through many results, even after filtering, to find what they need.

### Example: Product Table in Database

| id   | name         | category   | brand     | manufacturer | price |
|------|--------------|-----------|-----------|--------------|-------|
| 1    | Apple        | Fruit     | FreshCo   | NatureFarms  | $1.00 |
| 2    | Banana       | Fruit     | TropiBest | NatureFarms  | $0.50 |
| ...  | ...          | ...       | ...       | ...          | ...   |
| 10000| Watermelon   | Fruit     | FreshCo   | WaterFarms   | $3.00 |

### Example: Frontend Grid (Page 1, 10 items per page)

| #  | Product Name | Category | Brand     | Manufacturer | Price |
|----|--------------|----------|-----------|--------------|-------|
| 1  | Apple        | Fruit    | FreshCo   | NatureFarms  | $1.00 |
| 2  | Banana       | Fruit    | TropiBest | NatureFarms  | $0.50 |
| ...| ...          | ...      | ...       | ...          | ...   |
| 10 | Orange       | Fruit    | FreshCo   | CitrusWorld  | $0.80 |

**Pagination Controls:**

[Prev] 1 2 3 4 5 ... 1000 [Next]

**Backend Query Example:**

```sql
SELECT * FROM products
ORDER BY id
LIMIT 100 OFFSET 0; -- Page 1
```


**Note:**
- `LIMIT` defines the page size (number of rows per page). In this example, each page shows 100 products.
- `OFFSET` defines how many rows to skip before starting to return rows. For example, `OFFSET 100` would return the second page (rows 101–200).
- Adjusting `LIMIT` and `OFFSET` allows the frontend to request any page of data.

### Limitations of Paging
- Users must click through many pages to find a specific product.
- Poor user experience for searching or filtering.
- Not efficient for modern, fast interfaces.

## 2. Modern Approach: Filtering and Search

Instead of paging through all data, modern applications allow users to **filter** and **search** directly, returning only relevant results in a single call.

In the modern approach, the backend returns only the top N (e.g., 100) filtered records. If there are more results, the UI indicates this and prompts the user to refine their filter for more precise results. This avoids forcing users to page through large result sets and encourages more effective searching.

Sorting, paging, and search can still be performed in the modern approach, but only with the data already loaded on the client side (e.g., the top N records). In contrast, the traditional approach performs these operations over the entire dataset in the database, which can be less efficient and more cumbersome for the user.

### Example: Filtering by Name, Category, or Manufacturer

Suppose a user wants to find all products with:
- Name containing "Watermelon"
- Category containing "Fruit"
- Manufacturer containing "NatureFarms"

**Frontend Grid (Filtered Results):**

| #  | Product Name | Category | Brand     | Manufacturer | Price |
|----|--------------|----------|-----------|--------------|-------|
| 1  | Watermelon   | Fruit    | FreshCo   | WaterFarms   | $3.00 |
| 2  | Apple        | Fruit    | FreshCo   | NatureFarms  | $1.00 |
| 3  | Banana       | Fruit    | TropiBest | NatureFarms  | $0.50 |

**Backend Query Example:**
```sql
SELECT * FROM products
WHERE name ILIKE '%watermelon%'
	OR category ILIKE '%fruit%'
	OR manufacturer ILIKE '%naturefarms%';
```

- The user gets the result instantly, without paging.
- Filtering can be combined with sorting and other criteria.

---

### Handling Large Filtered Results

Filtering may return multiple rows. To ensure performance and usability, the backend should limit the number of results returned (for example, to 100 rows). The UI should:

- Indicate if the filter matched more than 100 results (e.g., "More than 100 results found. Please refine your filter.").
- Show the total number of rows found (e.g., "Total found: 350").
- Display only the first 100 results in the grid.

**Example UI Message:**

> Showing 100 of 350 results. Please refine your filter to narrow down the results.

**Backend Query Example:**
```sql
SELECT * FROM products
WHERE name ILIKE '%fruit%' OR category ILIKE '%fruit%' OR brand ILIKE '%fruit%' OR manufacturer ILIKE '%fruit%'
LIMIT 100;
```

**Count Query Example:**
```sql
SELECT COUNT(*) FROM products
WHERE name ILIKE '%fruit%' OR category ILIKE '%fruit%' OR brand ILIKE '%fruit%' OR manufacturer ILIKE '%fruit%';
```

This approach ensures the user is aware that not all results are shown and encourages them to use more specific filters for better results.

---


## 3. Comparison: Traditional vs. Modern

### Disadvantages of the Traditional Approach
- Users must page through all results, even after filtering, to find what they need.
- Filtering, sorting, and paging are performed on the entire dataset in the database, which can be slow and resource-intensive.
- Poor user experience, especially with large datasets.
- More backend load for every page or filter change.
- Increased costs for the company due to more user clicks and frequent round trips (network calls) to the server for each page or filter action.

### Advantages of the Modern Approach
- Only the top N (e.g., 100) filtered records are returned, making the UI faster and more responsive.
- The UI indicates if there are more results and prompts users to refine their filters for better results.
- Sorting, paging, and search are performed on the client side with the already loaded data, reducing backend load and improving user experience.
- Encourages users to use more precise filters, leading to more relevant results.

### Summary Table

| Approach      | User Experience        | Traditional  | Modern? |
|---------------|------------------------|--------------|---------|
| Paging        | Slow, many clicks      | Higher       | No      |
| Filtering     | Fast, direct results   | Lower        | Yes     |

---

## 5. Conclusion

- **Paging** is a classic solution for large datasets, but can be frustrating for users.
- **Filtering and search** provide a better experience and are standard in modern applications.
- Design your APIs and UIs to support powerful filtering instead of forcing users to page through data.
