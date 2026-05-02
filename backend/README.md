# Revia Backend

Phase 1 backend for Revia built only with free-tier friendly AWS services:

- AWS Lambda
- API Gateway REST API
- AWS Cognito
- DynamoDB
- S3 ready for later file uploads

## What this backend includes

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- Cognito-based authentication
- JWT validation for protected routes
- DynamoDB minimal user profile storage
- AWS SAM template for deployment
- Access token validity configured for 1 day in the SAM template

## Folder structure

```text
backend/
  package.json
  template.yaml
  .env.example
  src/
    handlers/auth/
      signup.js
      login.js
      me.js
    lib/
      http.js
      withAuth.js
    services/
      cognito.js
      users.js
```

## Prerequisites

- Node.js 20+
- AWS CLI configured
- AWS SAM CLI installed

## Install

```bash
cd backend
npm install
```

## Validate handler syntax

```bash
npm run check
```

## Build with SAM

```bash
npm run build
```

## Deploy

```bash
npm run deploy:guided
```

Use these recommended values during guided deploy:

- Stack name: `revia-phase1-backend`
- AWS Region: your preferred free-tier region
- Confirm changes before deploy: `Y`
- Allow SAM IAM role creation: `Y`
- Save arguments to `samconfig.toml`: `Y`

## Local API run

```bash
npm run local
```

This starts a local API Gateway emulator using SAM.

## Environment variables used by Lambda

These are injected by `template.yaml`:

- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`
- `USERS_TABLE`
- `UPLOADS_BUCKET`
- `COGNITO_AUTO_CONFIRM`

## API endpoints

### `POST /auth/signup`

Request:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123"
}
```

Response:

```json
{
  "message": "Signup successful",
  "user": {
    "userId": "cognito-sub",
    "email": "user@example.com",
    "createdAt": "2026-05-02T12:00:00.000Z"
  }
}
```

### `POST /auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123"
}
```

Response:

```json
{
  "message": "Login successful",
  "tokens": {
    "accessToken": "jwt-access-token",
    "idToken": "jwt-id-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

### `GET /auth/me`

Header:

```text
Authorization: Bearer <accessToken>
```

Response:

```json
{
  "user": {
    "userId": "cognito-sub",
    "email": "user@example.com",
    "createdAt": "2026-05-02T12:00:00.000Z"
  }
}
```

## Frontend integration

Store the Cognito access token after login and send it in the `Authorization` header:

```ts
localStorage.setItem('revia_access_token', tokens.accessToken);

await fetch(`${API_BASE_URL}/auth/me`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('revia_access_token')}`,
  },
});
```

## Notes

- Password hashing is handled by Cognito.
- `GET /auth/me` validates JWTs using Cognito public keys through `aws-jwt-verify`.
- Minimal user profile data is stored in DynamoDB for fast app lookup.
- S3 is provisioned now so Phase 2 uploads can be added without rethinking infrastructure.
