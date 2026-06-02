# Sleeper Hit Photography

A minimal, standalone photography gallery website with side navigation, Google Drive integration, and a clean gallery interface.

## Features

- Clean, minimal side navigation
- Responsive image gallery with lightbox
- Google Drive integration for photo management
- Fallback placeholder images
- Contact form for bookings
- About page
- Mobile-responsive design

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Vitest
- Google Drive API

## Getting Started

### Requirements

- Node.js
- npm

### Install

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env.local` and add your Google Drive API credentials:

```bash
cp .env.example .env.local
```

Then fill in the credentials:
- `GOOGLE_DRIVE_CLIENT_EMAIL` - Your Google Service Account email
- `GOOGLE_DRIVE_PRIVATE_KEY` - Your Google Service Account private key
- `PHOTOGRAPHY_EVENTS_FOLDER_ID` - Google Drive folder ID for events photos
- `PHOTOGRAPHY_LANDSCAPES_FOLDER_ID` - Google Drive folder ID for landscapes
- `PHOTOGRAPHY_STREET_FOLDER_ID` - Google Drive folder ID for street photos
- `PHOTOGRAPHY_PORTRAITS_FOLDER_ID` - Google Drive folder ID for portraits

### Run in development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run test     # Run tests
npm run lint     # Run linter
```

## Project Structure

```
sleeper_hit_photography/
├── app/
│   ├── api/                    # API routes
│   │   └── drive/photo/        # Google Drive photo serving
│   ├── about/                  # About page
│   ├── contact/                # Contact page
│   ├── events/                 # Events gallery
│   ├── landscapes/             # Landscapes gallery
│   ├── portraits/              # Portraits gallery
│   ├── street/                 # Street gallery
│   ├── layout.tsx              # Root layout with photography wrapper
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── src/
│   ├── features/
│   │   └── photography/        # Photography feature components
│   │       ├── css/            # Gallery styles
│   │       ├── SleeperHitPhotographyData.ts
│   │       ├── SleeperHitPhotographyDrive.server.ts
│   │       ├── SleeperHitPhotographyGalleryClient.tsx
│   │       ├── SleeperHitPhotographyGalleryPage.tsx
│   │       ├── SleeperHitPhotographyHomeClient.tsx
│   │       ├── SleeperHitPhotographyLayout.tsx
│   │       └── SleeperHitPhotographyStaticPages.tsx
│   └── test/
│       ├── mediaMocks.ts
│       └── setup.ts
├── package.json
├── tsconfig.json
├── next.config.mjs
├── eslint.config.js
├── vitest.config.ts
└── .env.example
```

## Gallery Sections

The gallery is organized into four main sections:

- **Events** - Event photography and coverage
- **Landscapes** - Landscape and environmental photography
- **Street** - Street photography
- **Portraits** - Portrait photography

Each section can be populated with photos from its corresponding Google Drive folder, or will show fallback placeholder images if Drive is not configured.

## License

Private project.
