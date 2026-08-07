# 📸 View-Img - 媒体文件浏览器

> 一个基于 Next.js 16 的现代化图片和视频浏览器，提供优雅的媒体文件管理体验。

[English](./README_EN.md) | 中文

## ✨ 特性

- 🖼️ **高级图片预览** - 支持缩放、平移、完整显示任意比例的图片
- 🎬 **智能视频缩略图** - 自动生成视频首帧缩略图
- 📱 **响应式设计** - 从手机（2列）到桌面（8列）自适应网格布局
- 🔗 **URL 同步** - 文件夹路径与 URL 同步，刷新页面保持位置
- 🍞 **面包屑导航** - 点击任意面包屑直接跳转到指定目录
- 🎨 **优雅交互** - 平滑动画和过渡效果，非侵入式错误提示
- 📂 **无限嵌套** - 支持任意深度的文件夹结构

## 🚀 快速开始

### 环境要求

- Node.js 20.9.0 或更高版本
- npm 或 yarn 包管理器


#### Linux 安装 24.x 版本 Node.js
```shell
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```


### 安装和启动本项目

```bash
# 克隆项目
git clone https://github.com/1061186575/view-img
cd view-img

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 项目结构

```
├── app/                    # Next.js App Router 页面和布局
│   ├── layout.js          # 根布局，包含 Geist 字体和中文设置
│   ├── page.js            # 主页欢迎页面和导航
│   ├── media/page.js      # 媒体浏览器，支持 URL 同步
│   ├── api/media/route.js # 目录列表 API 端点
│   └── globals.css        # 全局样式和动画
├── components/            # 可复用的 React 组件
│   └── VideoThumbnail.js # 视频首帧缩略图生成器
├── lib/                   # 工具函数
│   └── api.js            # API 请求辅助工具，包含错误处理
├── public/               # 静态资源和媒体文件
│   └── media/           # 媒体目录（图片、视频、文件夹）
└── 配置文件...
```

## 🛠️ 技术栈

- **框架**: Next.js 16.1.1 with App Router
- **React**: 19.2.3
- **样式**: Tailwind CSS 4
- **图片预览**: react-photo-view
- **图像处理**: Sharp
- **字体**: Geist Sans & Mono

## 📊 支持的媒体格式

### 图片格式
- JPG, PNG, GIF, WebP, SVG, BMP, **HEIC**

### 视频格式
- MP4, WebM, OGG, AVI, MOV, WMV, FLV, MKV

### 音频格式
- MP3, WAV, OGG, M4A

## 💡 使用说明

### 1. 配置媒体文件路径

默认情况下，媒体文件存储在 `public/media/` 目录下。您也可以通过环境变量配置自定义路径：

```bash
# 在 .env.local 文件中配置
MEDIA_ROOT_PATH=public/media      # 默认：项目内媒体目录
# MEDIA_ROOT_PATH=../my-media     # 项目外的媒体目录
# MEDIA_ROOT_PATH=/Users/username/Pictures  # 绝对路径
```

### 2. 添加媒体文件

将图片和视频文件放入配置的媒体目录下：

```
[媒体根目录]/
├── 风景照片/
│   ├── 山川.jpg
│   └── 海滩.png
├── 家庭视频/
│   └── 生日聚会.mp4
└── 我的照片.jpg
```

### 3. 浏览文件
- 访问 `/media` 页面开始浏览
- 点击文件夹进入子目录
- 点击图片打开高级预览模式
- 点击视频直接播放

### 4. 高级图片预览功能
- **鼠标滚轮**: 缩放图片
- **拖拽**: 平移查看图片细节
- **移动端**: 双指缩放和平移
- **键盘**: ESC 键退出预览

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

```

## 🚀 部署指南

```bash
npm run build
npm start

# 或使用 PM2
npm i -g pm2
pm2 start npm --name "view-img" -- start

# 使用 PM2 并且指定端口为 8080
pm2 start npm --name "view-img" -- start -- -p 8080

# 使用 PM2 并且设置环境变量
MEDIA_ROOT_PATH=/home/user/media PORT=8080 pm2 start npm --name "view-img" -- start
```

### Docker 部署
```bash
docker build -t view-img .
docker run -p 3000:3000 view-img
```


## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [react-photo-view](https://github.com/MinJieLiu/react-photo-view) - 图片预览组件
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Geist Font](https://vercel.com/font) - 优雅的字体系统
