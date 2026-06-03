# Sleeper Hit Photography

A minimal, standalone photography gallery website with side navigation, automatic Google Drive syncing, and fast CloudFront CDN delivery.

**Free/cheap hosting**: ~$0.10/month with AWS free tier

## Quick Start

### For Development (Offline Mode)
```bash
npm install
npm run dev
# Opens http://localhost:3000 with placeholder images
```

### For Production (With Live Images)

**You need AWS setup for live images.** Follow these steps:

1. **[AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md)** - Complete step-by-step AWS setup
   - Create S3 bucket
   - Set up CloudFront CDN
   - Create Lambda sync function
   - Configure Google Drive access

2. **[CLOUDFRONT_MIGRATION.md](CLOUDFRONT_MIGRATION.md)** - Overview and quick start
   - Understand the architecture
   - Test everything works

3. Update `.env.local`:
```
CLOUDFRONT_DOMAIN=d123abc.cloudfront.net
```

4. Deploy and go live

## Features

- **Fast image delivery** - Global CloudFront CDN (~10-100x faster than Google Drive)
- **Automatic syncing** - Lambda checks Google Drive every 6 hours
- **Cheap** - ~$0.10/month (within AWS free tier)
- **Responsive** - Works on mobile, tablet, desktop
- **Offline fallback** - Shows placeholder images if cloud not configured
- **Interactive lightbox** - Click images to expand with keyboard navigation
- **Mobile responsive** - Adapts to all screen sizes

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- AWS S3 + CloudFront
- AWS Lambda
- Google Drive API (for sync only, not app)
- Vitest

## Architecture

### Image Flow
```
Google Drive (friend uploads)
        ↓
  Lambda Sync (every 6 hours)
        ↓
   AWS S3 (storage)
        ↓
 CloudFront CDN (caching)
        ↓
    Next.js App (displays)
```

### No More Direct API Calls
- **Before**: App called Google Drive API (slow)
- **After**: App fetches manifest from CloudFront (fast)

## Environment Variables

### App (`/.env.local`)
```
CLOUDFRONT_DOMAIN=d123abc.cloudfront.net
```

### Lambda (`/lambda/.env`)
See `lambda/.env.example` for Google Drive + S3 credentials

## Project Structure

```
sleeper_hit_photography/
├── app/                           # Next.js pages & routes
│   ├── [section]/page.tsx        # Gallery pages (events, landscapes, etc)
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home with cover grid
│   └── globals.css               # Global styles
├── src/
│   ├── features/photography/     # Photo gallery components
│   │   ├── SleeperHitPhotographyDrive.server.ts  # ⭐ Fetches from CloudFront
│   │   ├── SleeperHitPhotographyLayout.tsx
│   │   ├── SleeperHitPhotographyGalleryClient.tsx
│   │   └── css/
│   └── test/
├── lambda/                        # ⭐ AWS Lambda sync function
│   ├── sync-function.js          # Drive → S3 sync
│   ├── package.json
│   └── .env.example
├── public/                        # Placeholder images
│   ├── cat.webp
│   └── cat chaos mode.webp
├── AWS_SETUP_GUIDE.md            # ⭐ Follow this first
├── CLOUDFRONT_MIGRATION.md       # Overview & quick start
├── .env.example
└── package.json
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Lint
npm run lint

# Build for production
npm run build
npm run start
```

## Deployment

1. Complete [AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md)
2. Deploy Next.js app (e.g., Vercel, AWS Amplify, or your own server)
3. Lambda runs automatically every 6 hours

## Gallery Sections

- **Home** - Cover grid with latest from each section
- **Events** - Event photography
- **Landscapes** - Environmental/landscape photography
- **Street** - Street photography
- **Portraits** - Portrait photography
- **About** - About the photographer
- **Contact** - Booking form

## Performance

**Loading Times:**
- First image: ~0.5-1s (CloudFront cold start)
- Subsequent images: <100ms (CloudFront cached)
- Google Drive direct: 2-5s (API overhead)

**Why Fast:**
- CloudFront edge locations worldwide
- 1-year cache for immutable images
- Optimized image formats (WebP)

## Costs

| Service | Cost | Notes |
|---------|------|-------|
| S3 storage | $0.023/GB/month | 1GB for 500 images = $0.02 |
| CloudFront CDN | $0.085/GB | Minimal due to caching |
| Lambda | FREE | <1M invocations/month |
| EventBridge | FREE | <100,000 rules |
| **Total** | **~$0.10** | Stays in free tier |

## Troubleshooting

See [CLOUDFRONT_MIGRATION.md](CLOUDFRONT_MIGRATION.md#troubleshooting) for common issues.

## Guides

- **[AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md)** - Complete AWS setup (required for live images)
- **[CLOUDFRONT_MIGRATION.md](CLOUDFRONT_MIGRATION.md)** - Architecture overview & quick start

## License

Private project.
