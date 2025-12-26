# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Node.js v22.21.1

## Project Overview

This is a Next.js 16 project with the App Router architecture, featuring React 19 and Tailwind CSS 4. The project appears to be named "view-img" (based on directory structure) and is set up as a standard Next.js application with modern tooling.

## Technology Stack

- **Framework**: Next.js 16.1.1 with App Router
- **React**: Version 19.2.3
- **Styling**: Tailwind CSS 4 with PostCSS
- **Language**: JavaScript (JSX) with JSConfig path aliases
- **Linting**: ESLint 9 with Next.js configuration
- **Fonts**: Geist (Sans and Mono) from Google Fonts
- **Image Viewer**: react-photo-view for advanced image preview with zoom/pan

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

The development server runs on http://localhost:3000 by default.

## Project Structure

```
├── app/                    # Next.js App Router pages and layouts
│   ├── layout.js          # Root layout with Geist fonts and Chinese lang
│   ├── page.js            # Homepage with welcome page and navigation
│   ├── media/page.js      # Media browser with URL synchronization
│   ├── api/media/route.js # API endpoint for directory listing
│   └── globals.css        # Global styles with animations
├── components/            # Reusable React components
│   └── VideoThumbnail.js # Video first frame thumbnail generator
├── lib/                   # Utility functions
│   └── api.js            # API request helpers with error handling
├── public/               # Static assets and media files
│   └── media/           # Media directory (images, videos, folders)
├── package.json          # Dependencies and scripts
├── next.config.mjs       # Next.js configuration with image settings
├── eslint.config.mjs     # ESLint configuration
├── postcss.config.mjs    # PostCSS with Tailwind
└── jsconfig.json         # Path aliases (@/* -> ./*)
```

## Key Configuration Details

- **Language**: Set to Chinese (`lang="zh"`) in root layout
- **Path Aliases**: `@/*` maps to root directory via jsconfig.json
- **Styling**: Uses Tailwind CSS 4 with dark mode classes
- **ESLint**: Configured with Next.js core web vitals rules
- **Build Output**: Excludes `.next/`, `out/`, `build/` directories

## API Response Format

All API responses use standard HTTP status codes:

```javascript
// 成功响应 (200 OK)
{
  currentPath: "...",
  items: [...]
}

// 错误响应 (400/404/500)
{
  error: "错误信息"
}
```

**Error Handling**: The frontend checks HTTP status codes (`response.ok`). When status is not 200, a non-intrusive error notification appears in the top-right corner without blocking the UI.

## Media Management

- **Media Directory**: `public/media/` serves as the root directory for images and videos
- **Supported Formats**:
  - Images: JPG, PNG, GIF, WebP, SVG, BMP
  - Videos: MP4, WebM, OGG, AVI, MOV, WMV, FLV, MKV
- **Folder Navigation**: Supports unlimited nested folder structures
- **File Filtering**: Non-media files are automatically ignored

## Features

### 🏠 **Landing Page (`/`)**
- **Welcome Interface**: Beautiful landing page with feature introduction
- **Navigation**: Direct links to media browser
- **Usage Guide**: Step-by-step instructions for new users

### 📁 **Media Browser (`/media`)**
- **URL Synchronization**: Folder paths are reflected in URL query parameters
- **Refresh Persistence**: Page refresh maintains current folder location
- **Breadcrumb Navigation**: Click any breadcrumb to navigate directly
- **Responsive Grid Layout**: Auto-adjusts for mobile (2 cols) to desktop (8 cols)
- **Advanced Image Preview**:
  - Complete image display regardless of aspect ratio
  - Mouse wheel zoom in/out
  - Touch pinch-to-zoom on mobile devices
  - Pan/drag support when zoomed
  - Smooth animations and transitions
- **Smart Video Thumbnails**: Automatically generates thumbnails from video first frames
- **Video Playback**: Click to play videos with native controls
- **Non-intrusive Error Handling**: Slide-in notifications in top-right corner without blocking content
- **Mobile Optimization**: Touch-friendly interface with optimized controls

## Notes for Development

- The project uses JavaScript (not TypeScript)
- App Router pattern is used throughout
- All pages are in the `app/` directory following Next.js 13+ conventions
- Static assets are served from the `public/` directory
- The layout includes proper font optimization with Geist fonts
- API utilities are in `lib/api.js` for consistent error handling
