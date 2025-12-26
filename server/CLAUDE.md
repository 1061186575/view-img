# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Project Overview

This is a Next.js 16 project with the App Router architecture, featuring React 19 and Tailwind CSS 4. The project appears to be named "view-img" (based on directory structure) and is set up as a standard Next.js application with modern tooling.

## Technology Stack

- **Framework**: Next.js 16.1.1 with App Router
- **React**: Version 19.2.3
- **Styling**: Tailwind CSS 4 with PostCSS
- **Language**: JavaScript (JSX) with JSConfig path aliases
- **Linting**: ESLint 9 with Next.js configuration
- **Fonts**: Geist (Sans and Mono) from Google Fonts

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
│   ├── page.js            # Homepage (starter template content)
│   ├── test/page.js       # Test page with Tailwind styling
│   └── globals.css        # Global styles
├── public/                # Static assets (SVGs for Next.js branding)
├── package.json           # Dependencies and scripts
├── next.config.mjs        # Next.js configuration (minimal)
├── eslint.config.mjs      # ESLint configuration
├── postcss.config.mjs     # PostCSS with Tailwind
└── jsconfig.json          # Path aliases (@/* -> ./*)
```

## Key Configuration Details

- **Language**: Set to Chinese (`lang="zh"`) in root layout
- **Path Aliases**: `@/*` maps to root directory via jsconfig.json
- **Styling**: Uses Tailwind CSS 4 with dark mode classes
- **ESLint**: Configured with Next.js core web vitals rules
- **Build Output**: Excludes `.next/`, `out/`, `build/` directories

## Current State

This appears to be a fresh Next.js project with minimal customization beyond the initial template. The main page still contains starter content, and there's a basic test page demonstrating Tailwind classes.

## Notes for Development

- The project uses JavaScript (not TypeScript)
- App Router pattern is used throughout
- All pages are in the `app/` directory following Next.js 13+ conventions
- Static assets are served from the `public/` directory
- The layout includes proper font optimization with Geist fonts
