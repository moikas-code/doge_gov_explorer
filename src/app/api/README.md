# DOGE API Documentation

Version: 0.0.1-beta

Base URL: https://api.doge.gov/v1

The DOGE API allows for programmatic access to Government transparency. This API is in beta and subject to change.

## Endpoints

### Savings

Grants, contracts and leases the Department of Government Efficiency has cancelled.

GET `/savings/grants`

Get grant savings.

Query Parameters:
- `page` (optional, default: 1): Page number for pagination
- `per_page` (optional, default: 10): Number of items per page
- `status` (optional): Filter by initiative status
- `department` (optional): Filter by department

GET `/savings/contracts`

Get contract savings.

Query Parameters:
- `page` (optional, default: 1): Page number for pagination
- `per_page` (optional, default: 10): Number of items per page
- `status` (optional): Filter by initiative status
- `department` (optional): Filter by department

GET `/savings/leases`

Get lease savings.

Query Parameters:
- `page` (optional, default: 1): Page number for pagination
- `per_page` (optional, default: 10): Number of items per page
- `status` (optional): Filter by initiative status
- `department` (optional): Filter by department

### Payments

Payments made by the US Government. Currently, this includes a limited amount of grant payments issued from the Program Support Center, but will expand to include all payments from the US Government.

GET `/payments`

Get payment line items.

Query Parameters:
- `page` (optional, default: 1): Page number for pagination
- `per_page` (optional, default: 10): Number of items per page
- `program` (optional): Filter by program name
- `agency` (optional): Filter by agency
- `start_date` (optional): Filter by payment date range start
- `end_date` (optional): Filter by payment date range end

Response includes:
- id: Unique identifier for the payment
- amount: Payment amount in USD
- recipient: Name of the payment recipient
- date: Payment date
- program: Program name
- agency: Agency name
- description: Payment description

## Error Handling

All endpoints return standardized error responses in the following format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "status": 400
  }
}
```

Common status codes:
- 200: Success
- 400: Bad Request
- 500: Internal Server Error 