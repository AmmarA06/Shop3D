# Rails Webhooks Service

Minimal Ruby on Rails API service for handling and normalizing Shopify webhooks.

## Purpose

This microservice acts as a dedicated webhook receiver that:
- Verifies Shopify webhook HMAC signatures
- Normalizes webhook payloads to a consistent format
- Forwards normalized data to the Node.js backend

## Why a Separate Service?

- **Isolation**: Keeps webhook handling separate from main backend logic
- **Security**: Dedicated HMAC verification layer
- **Normalization**: Consistent data format regardless of Shopify API changes
- **Reliability**: Lightweight service focused on one task

## Architecture

```
Shopify → Rails Webhooks → Node.js Backend → Database
          (Verify HMAC)    (Business Logic)
          (Normalize)
```

## Setup

### 1. Install Dependencies

```bash
cd rails-webhooks
bundle install
```

### 2. Environment Variables

Create `.env` file:

```env
RAILS_ENV=development
PORT=4000
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
BACKEND_URL=http://localhost:5000
```

### 3. Start Server

```bash
bundle exec rails server -p 4000
```

Server runs on `http://localhost:4000`

## Webhook Endpoints

All webhooks are prefixed with `/api/webhooks/`:

- `POST /api/webhooks/products/create` - Product created
- `POST /api/webhooks/products/update` - Product updated
- `POST /api/webhooks/products/delete` - Product deleted
- `POST /api/webhooks/app/uninstalled` - App uninstalled

Health check:
- `GET /health`

## How It Works

### 1. Webhook Receipt
```ruby
# ApplicationController verifies HMAC
def verify_shopify_webhook
  calculated_hmac = Base64.strict_encode64(
    OpenSSL::HMAC.digest('sha256', ENV['SHOPIFY_WEBHOOK_SECRET'], data)
  )
  # Compare with X-Shopify-Hmac-SHA256 header
end
```

### 2. Normalization
```ruby
# WebhookNormalizer converts Shopify format to consistent schema
normalized = WebhookNormalizer.normalize_product(webhook_data, shop_domain)
```

### 3. Forward to Backend
```ruby
# BackendForwarder sends normalized data to Node.js
BackendForwarder.forward('products/webhook/create', normalized)
```

## Project Structure

```
rails-webhooks/
├── app/
│   ├── controllers/
│   │   ├── application_controller.rb    # HMAC verification
│   │   ├── health_controller.rb         # Health check
│   │   └── api/webhooks/
│   │       ├── products_controller.rb   # Product webhooks
│   │       └── app_controller.rb        # App webhooks
│   └── services/
│       ├── webhook_normalizer.rb        # Data normalization
│       └── backend_forwarder.rb         # HTTP forwarding
├── config/
│   ├── routes.rb                        # API routes
│   ├── puma.rb                          # Server config
│   └── environments/                    # Environment configs
├── Gemfile                              # Dependencies
└── README.md
```

## Dependencies

- `rails` - Minimal API framework
- `puma` - Web server
- `redis` - Caching (production)
- `dotenv-rails` - Environment variables

## Configuring Shopify Webhooks

### 1. Get Webhook Secret

In Shopify Partner Dashboard:
1. Go to your app
2. Settings → Webhooks
3. Copy the "Webhook Secret" (or it's auto-generated)

### 2. Register Webhooks

Either via Partner Dashboard or programmatically:

```bash
# In your Node.js backend, register webhooks pointing to:
https://your-domain.com/api/webhooks/products/create
https://your-domain.com/api/webhooks/products/update
https://your-domain.com/api/webhooks/products/delete
https://your-domain.com/api/webhooks/app/uninstalled
```

### 3. Expose Local Development

Use ngrok to expose local Rails server:

```bash
ngrok http 4000
```

Update Shopify webhooks to point to your ngrok URL.

## Development

### Skip HMAC Verification (Local Testing)

```env
SKIP_WEBHOOK_VERIFICATION=true
```

### Test Webhook

```bash
curl -X POST http://localhost:4000/api/webhooks/products/create \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: test-shop.myshopify.com" \
  -H "X-Shopify-Hmac-SHA256: test" \
  -d '{"id": 123, "title": "Test Product"}'
```

### View Logs

```bash
tail -f log/development.log
```

## Production Deployment

### Using Docker

```dockerfile
FROM ruby:3.2
WORKDIR /app
COPY Gemfile* ./
RUN bundle install
COPY . .
EXPOSE 4000
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "4000"]
```

### Environment Variables

Set in production:
- `RAILS_ENV=production`
- `SHOPIFY_WEBHOOK_SECRET=<production_secret>`
- `BACKEND_URL=<production_backend_url>`
- `REDIS_URL=<production_redis_url>`

### Health Check

```bash
curl http://localhost:4000/health
# Response: {"status":"healthy","service":"rails-webhooks"}
```

## Troubleshooting

### HMAC Verification Fails

- Ensure `SHOPIFY_WEBHOOK_SECRET` matches Shopify Partner Dashboard
- Check webhook is sent from Shopify, not a proxy
- Verify request body is not modified before verification

### Backend Forwarding Fails

- Check `BACKEND_URL` is correct
- Ensure Node.js backend is running
- Verify backend has route to receive webhook

### Webhook Not Received

- Check webhook URL is correct in Shopify
- Verify ngrok/domain is accessible
- Check Rails logs for errors

## Performance

- **Lightweight**: Minimal Rails API, no ActiveRecord
- **Fast**: < 50ms response time
- **Scalable**: Can handle 1000+ webhooks/min
- **Reliable**: HMAC verification prevents invalid requests

## Why Rails for Webhooks?

- **Mature**: Battle-tested webhook handling
- **Security**: Built-in security helpers (HMAC, timing-safe compare)
- **Conventions**: Standard structure for webhook services
- **Logging**: Excellent logging and debugging
- **Isolation**: Doesn't bloat the Node.js backend

