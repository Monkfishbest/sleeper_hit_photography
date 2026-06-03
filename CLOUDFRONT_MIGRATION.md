# Migration from Google Drive to CloudFront + S3

## What's Changed

### Before (Google Drive Direct)
```
User clicks photo → App calls Google Drive API → Drive streams image
```
**Problem**: Slow (Drive API adds latency, not optimized for web)

### After (CloudFront + S3)
```
Friend uploads to Google Drive → Lambda syncs every 6 hours → Images on S3 → CloudFront CDN caches → User gets image instantly
```
**Benefits**: 
- ⚡ 10-100x faster (global CDN)
- 💰 Cheaper (~$0.15/month)
- 🔄 Automatic syncing
- 🌍 Faster globally

## Quick Start

### Step 1: Follow AWS_SETUP_GUIDE.md
Follow the complete guide to:
- Create S3 bucket
- Set up CloudFront
- Create Lambda function
- Configure Google Drive access
- Set up scheduled sync

### Step 2: Get Your CloudFront Domain

After CloudFront setup, you'll have a domain like: `d123abc.cloudfront.net`

### Step 3: Update App Configuration

Create `.env.local`:
```
CLOUDFRONT_DOMAIN=d123abc.cloudfront.net
```

### Step 4: Test Sync

1. Manually trigger Lambda in AWS Console
2. Check CloudWatch logs
3. Verify files appear in S3
4. Check CloudFront has them cached

### Step 5: Verify App Works

1. Run `npm run dev`
2. Go to http://localhost:3000
3. Should see images loading from CloudFront

## How It Works

### Image Flow
1. **Friend uploads to Google Drive shared folder**
2. **Every 6 hours, Lambda:**
   - Connects to Google Drive
   - Lists all images in folder
   - Downloads each image
   - Uploads to S3
   - Creates `manifest.json` with metadata
3. **App loads:**
   - Fetches `manifest.json` from CloudFront
   - Gets image URLs and metadata
   - Displays images with CloudFront URLs
4. **CloudFront caches:**
   - Subsequent requests are instant
   - Cache expires in 1 year (images are immutable)

### Manifest Format

The Lambda creates JSON manifests like:

```json
[
  {
    "id": "drive-file-id-123",
    "alt": "My Photo.jpg",
    "caption": "My Photo",
    "description": "Description from Drive metadata",
    "width": 1600,
    "height": 1200,
    "s3Key": "events/drive-file-id-123-My Photo.jpg"
  }
]
```

The app transforms this to construct CloudFront URLs:
- `https://d123abc.cloudfront.net/events/drive-file-id-123-My Photo.jpg`

## Fallback Behavior

If CloudFront/S3 isn't available:
- App shows placeholder cat images
- No API keys needed (works offline)

## Monitoring

### Lambda Logs
- AWS Console → CloudWatch → `/aws/lambda/sleeper-hit-drive-sync`
- See sync status every 6 hours

### S3 Console
- See all uploaded images organized by section
- Monitor storage usage

### CloudFront
- Check cache statistics
- Monitor bandwidth costs

## Troubleshooting

### "Can't resolve 'CLOUDFRONT_DOMAIN'"
- Make sure `.env.local` has `CLOUDFRONT_DOMAIN=d123abc.cloudfront.net`
- Restart dev server: `npm run dev`

### Images still slow
- Wait 5 minutes for CloudFront cache to populate
- Manually invalidate in CloudFront console if needed

### Lambda fails
- Check CloudWatch logs for errors
- Verify Google credentials are correct
- Verify Drive folder is shared with service account
- Verify folder IDs are correct

### Lambda times out
- Increase timeout to 15 minutes in Lambda configuration
- Check Drive API for rate limiting

## File Structure

```
sleeper_hit_photography/
├── app/                           # Next.js app
│   ├── page.tsx                  # Loads manifest, displays gallery
│   └── ...
├── src/
│   └── features/photography/
│       └── SleeperHitPhotographyDrive.server.ts  # Fetches manifest from CloudFront
├── lambda/                        # AWS Lambda sync function
│   ├── sync-function.js          # Downloads from Drive, uploads to S3
│   └── package.json
├── AWS_SETUP_GUIDE.md            # Step-by-step AWS setup
├── CLOUDFRONT_MIGRATION.md       # This file
├── .env.example                  # App config (CloudFront only)
└── lambda/.env.example           # Lambda config (Drive + S3)
```

## Cost Breakdown

| Item | Monthly Cost |
|------|--------|
| S3 storage (1GB) | $0.02 |
| CloudFront CDN (100GB cached) | $0.08 |
| Lambda (free tier) | FREE |
| EventBridge (free tier) | FREE |
| **Total** | **~$0.10** |

(Will stay under free tier unless you have massive traffic)

## Next Steps

1. ✅ Follow AWS_SETUP_GUIDE.md completely
2. ✅ Get CloudFront domain
3. ✅ Add `CLOUDFRONT_DOMAIN` to `.env.local`
4. ✅ Test sync manually
5. ✅ Verify app loads images
6. ✅ Deploy to production

Questions? Check the AWS_SETUP_GUIDE.md or CloudWatch logs.
