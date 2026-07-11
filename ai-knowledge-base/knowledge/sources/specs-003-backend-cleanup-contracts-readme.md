---
name: specs/003-backend-cleanup/contracts/README.md
description: Auto-synced from specs/003-backend-cleanup/contracts/README.md
type: source
sync_origin: specs/003-backend-cleanup/contracts/README.md
sync_hash: 0d7288e524da50aa
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/003-backend-cleanup/contracts/README.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# API Contracts: Laravel Backend Cleanup

**Feature**: 003-backend-cleanup
**Date**: 2026-01-26

## Overview

This directory contains API contract specifications to ensure backward compatibility during the refactoring process. All refactored endpoints must maintain these response formats.

## Response Standards

### Success Response

```json
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

### Paginated Response

```json
{
  "data": [ /* array of resources */ ],
  "links": {
    "first": "http://api.example.com/resource?page=1",
    "last": "http://api.example.com/resource?page=10",
    "prev": null,
    "next": "http://api.example.com/resource?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 10,
    "links": [ /* pagination links */ ],
    "path": "http://api.example.com/resource",
    "per_page": 20,
    "to": 20,
    "total": 200
  }
}
```

## Product Endpoints

### GET /api/products

**Purpose**: List products with filtering

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category_id | integer | No | Filter by category |
| store_id | integer | No | Filter by store |
| colors[] | array | No | Filter by color IDs |
| sizes[] | array | No | Filter by size IDs |
| min_price | number | No | Minimum price |
| max_price | number | No | Maximum price |
| search | string | No | Search term |
| sort | string | No | Sort field (created_at, price, name) |
| direction | string | No | Sort direction (asc, desc) |
| per_page | integer | No | Items per page (default: 20, max: 100) |
| page | integer | No | Page number |

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "name_ar": "اسم المنتج",
      "description": "Product description",
      "price": 99.99,
      "compare_price": 129.99,
      "discount_percentage": 23,
      "in_stock": true,
      "quantity": 50,
      "category": {
        "id": 1,
        "name": "Category Name",
        "slug": "category-name"
      },
      "store": {
        "id": 1,
        "name": "Store Name",
        "logo_url": "https://..."
      },
      "primary_image": {
        "id": 1,
        "url": "https://...",
        "thumbnail_url": "https://..."
      },
      "variants": [
        {
          "id": 1,
          "color": { "id": 1, "name": "Red", "hex": "#FF0000" },
          "size": { "id": 1, "name": "M" },
          "quantity": 10,
          "price_adjustment": 0
        }
      ],
      "average_rating": 4.5,
      "review_count": 25,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { /* pagination meta */ },
  "links": { /* pagination links */ }
}
```

### GET /api/products/{id}

**Purpose**: Get single product details

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Product Name",
    "name_ar": "اسم المنتج",
    "description": "Full product description",
    "description_ar": "وصف المنتج الكامل",
    "price": 99.99,
    "compare_price": 129.99,
    "discount_percentage": 23,
    "sku": "PROD-001",
    "in_stock": true,
    "quantity": 50,
    "category": { /* full category */ },
    "store": { /* full store */ },
    "images": [ /* all product images */ ],
    "variants": [ /* all variants with full details */ ],
    "specifications": [ /* product specifications */ ],
    "reviews": {
      "average": 4.5,
      "count": 25,
      "distribution": { "5": 15, "4": 5, "3": 3, "2": 1, "1": 1 }
    },
    "related_products": [ /* related product summaries */ ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T15:45:00Z"
  }
}
```

### POST /api/products

**Purpose**: Create new product (requires authentication)

**Request Body**:
```json
{
  "name": "Product Name",
  "name_ar": "اسم المنتج",
  "description": "Product description",
  "description_ar": "وصف المنتج",
  "category_id": 1,
  "price": 99.99,
  "compare_price": 129.99,
  "sku": "PROD-001",
  "quantity": 50,
  "status": "active",
  "variants": [
    {
      "color_id": 1,
      "size_id": 1,
      "quantity": 10,
      "price_adjustment": 0
    }
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "data": { /* created product */ },
  "message": "Product created successfully"
}
```

**Error Response** (422):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": ["The name field is required."],
    "category_id": ["The selected category does not exist."]
  }
}
```

## Order Endpoints

### GET /api/orders

**Purpose**: List user orders

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status |
| date_from | date | No | Start date (YYYY-MM-DD) |
| date_to | date | No | End date (YYYY-MM-DD) |
| per_page | integer | No | Items per page |

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "order_number": "ORD-2024-0001",
      "status": "processing",
      "status_label": "Processing",
      "subtotal": 199.98,
      "shipping": 10.00,
      "tax": 20.00,
      "discount": 0,
      "total": 229.98,
      "items_count": 2,
      "items": [
        {
          "id": 1,
          "product": {
            "id": 1,
            "name": "Product Name",
            "image_url": "https://..."
          },
          "variant": {
            "color": "Red",
            "size": "M"
          },
          "quantity": 1,
          "unit_price": 99.99,
          "subtotal": 99.99
        }
      ],
      "shipping_address": {
        "name": "John Doe",
        "address": "123 Street",
        "city": "Casablanca",
        "phone": "+212600000000"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T12:00:00Z"
    }
  ],
  "meta": { /* pagination meta */ },
  "links": { /* pagination links */ }
}
```

### POST /api/orders

**Purpose**: Create new order

**Request Body**:
```json
{
  "items": [
    {
      "stock_id": 1,
      "variant_id": 1,
      "quantity": 2
    }
  ],
  "shipping_address_id": 1,
  "payment_method": "cod",
  "coupon_code": "SAVE10",
  "notes": "Please call before delivery"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_number": "ORD-2024-0001",
    "status": "pending",
    "total": 229.98,
    "payment_url": null
  },
  "message": "Order placed successfully"
}
```

## Cart Endpoints

### GET /api/cart

**Purpose**: Get user cart

**Response** (200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "stock_id": 1,
        "variant_id": 1,
        "quantity": 2,
        "unit_price": 99.99,
        "subtotal": 199.98,
        "product": {
          "id": 1,
          "name": "Product Name",
          "image_url": "https://...",
          "in_stock": true,
          "max_quantity": 10
        },
        "variant": {
          "color": "Red",
          "size": "M"
        }
      }
    ],
    "subtotal": 199.98,
    "tax_amount": 20.00,
    "shipping_amount": 10.00,
    "discount_amount": 0,
    "total_amount": 229.98,
    "coupon_code": null,
    "items_count": 1
  }
}
```

### POST /api/cart/items

**Purpose**: Add item to cart

**Request Body**:
```json
{
  "stock_id": 1,
  "variant_id": 1,
  "quantity": 1
}
```

**Response** (200):
```json
{
  "success": true,
  "data": { /* updated cart */ },
  "message": "Item added to cart"
}
```

### PUT /api/cart/items/{id}

**Purpose**: Update cart item quantity

**Request Body**:
```json
{
  "quantity": 3
}
```

### DELETE /api/cart/items/{id}

**Purpose**: Remove item from cart

**Response** (200):
```json
{
  "success": true,
  "data": { /* updated cart */ },
  "message": "Item removed from cart"
}
```

## Message Endpoints

### GET /api/conversations

**Purpose**: List user conversations

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "participant": {
        "id": 1,
        "name": "Store Name",
        "avatar_url": "https://...",
        "type": "store"
      },
      "last_message": {
        "id": 100,
        "content": "Thank you for your order!",
        "created_at": "2024-01-15T10:30:00Z",
        "is_mine": false
      },
      "unread_count": 2,
      "created_at": "2024-01-10T08:00:00Z"
    }
  ],
  "meta": { /* pagination meta */ }
}
```

### GET /api/conversations/{id}/messages

**Purpose**: Get messages in conversation

**Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "content": "Hello, I have a question about my order",
      "attachments": [],
      "is_mine": true,
      "is_read": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { /* pagination meta */ }
}
```

### POST /api/conversations/{id}/messages

**Purpose**: Send message

**Request Body**:
```json
{
  "content": "Message content",
  "attachments": []
}
```

## Authentication Endpoints

### POST /api/auth/login

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name"
    },
    "token": "bearer_token_here",
    "token_type": "Bearer",
    "expires_at": "2024-02-15T10:30:00Z"
  },
  "message": "Login successful"
}
```

### POST /api/auth/register

**Request Body**:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "phone": "+212600000000"
}
```

### POST /api/auth/logout

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Error Codes

| HTTP Code | Meaning | Common Causes |
|-----------|---------|---------------|
| 400 | Bad Request | Malformed request body |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Validation Error | Invalid input data |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected error |

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| /api/auth/* | 5 requests per minute |
| /api/products | 60 requests per minute |
| /api/orders | 30 requests per minute |
| /api/messages | 20 requests per minute |

## Backward Compatibility Rules

1. **Response structure**: Never remove fields, only add
2. **Status codes**: Must remain consistent
3. **Field types**: Cannot change (string to number, etc.)
4. **Pagination**: Meta format must remain identical
5. **Error format**: Must follow standard error response

## Testing Contracts

Use these contracts for:
- API feature tests
- Frontend integration tests
- Documentation generation
- Client SDK generation

