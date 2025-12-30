# 📸 View-Img - Media File Browser

> A modern image and video browser built with Next.js 16, providing an elegant media file management experience.

English | [中文](./README.md)

## ✨ Features

- 🖼️ **Advanced Image Preview** - Support zooming, panning, and complete display of images with any aspect ratio
- 🎬 **Smart Video Thumbnails** - Automatically generate thumbnails from video first frames
- 📱 **Responsive Design** - Adaptive grid layout from mobile (2 cols) to desktop (8 cols)
- 🔗 **URL Synchronization** - Folder paths sync with URL, maintain position on page refresh
- 🍞 **Breadcrumb Navigation** - Click any breadcrumb to navigate directly to that directory
- 🎨 **Elegant Interactions** - Smooth animations and transitions, non-intrusive error notifications
- 📂 **Unlimited Nesting** - Support arbitrary depth folder structures

## 🚀 Quick Start

### Requirements

- Node.js 20.9.0 or higher
- npm or yarn package manager

### Installation

```bash
# Clone the project
git clone <your-repository-url>
cd view-img

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages and layouts
│   ├── layout.js          # Root layout with Geist fonts and Chinese settings
│   ├── page.js            # Homepage welcome page with navigation
│   ├── media/page.js      # Media browser with URL synchronization
│   ├── api/media/route.js # Directory listing API endpoint
│   └── globals.css        # Global styles and animations
├── components/            # Reusable React components
│   └── VideoThumbnail.js # Video first frame thumbnail generator
├── lib/                   # Utility functions
│   └── api.js            # API request helpers with error handling
├── public/               # Static assets and media files
│   └── media/           # Media directory (images, videos, folders)
└── Configuration files...
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **React**: 19.2.3
- **Styling**: Tailwind CSS 4
- **Image Preview**: react-photo-view
- **Image Processing**: Sharp
- **Fonts**: Geist Sans & Mono

## 📊 Supported Media Formats

### Image Formats
- JPG, PNG, GIF, WebP, SVG, BMP

### Video Formats
- MP4, WebM, OGG, AVI, MOV, WMV, FLV, MKV

## 💡 Usage Guide

### 1. Adding Media Files
Place image and video files in the `public/media/` directory:

```
public/
└── media/
    ├── landscape-photos/
    │   ├── mountains.jpg
    │   └── beach.png
    ├── family-videos/
    │   └── birthday-party.mp4
    └── my-photo.jpg
```

### 2. Browsing Files
- Visit the `/media` page to start browsing
- Click folders to enter subdirectories
- Click images to open advanced preview mode
- Click videos to play directly

### 3. Advanced Image Preview Features
- **Mouse Wheel**: Zoom in/out
- **Drag**: Pan to view image details
- **Mobile**: Pinch-to-zoom and pan gestures
- **Keyboard**: ESC key to exit preview

## 🔧 Development Commands

```bash
# Development mode
npm run dev

# Production build
npm run build

# Start production server
npm start

# Code linting
npm run lint
```

## 🚀 Deployment Guide

### Vercel Deployment (Recommended)
```bash
npm i -g vercel
vercel
```

### Self-hosted Server
```bash
npm run build
npm start

# Or using PM2
npm i -g pm2
pm2 start npm --name "view-img" -- start
```

### Docker Deployment
```bash
docker build -t view-img .
docker run -p 3000:3000 view-img
```

## 📝 API Response Format

```javascript
// Success response (200 OK)
{
  currentPath: "folder/subfolder",
  items: [
    {
      name: "image.jpg",
      type: "image",
      path: "folder/subfolder/image.jpg"
    }
  ]
}

// Error response (400/404/500)
{
  error: "Error message"
}
```

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [react-photo-view](https://github.com/MinJieLiu/react-photo-view) - Image preview component
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Geist Font](https://vercel.com/font) - Elegant font system
