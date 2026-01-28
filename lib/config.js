/**
 * 媒体路径配置
 */

export const MEDIA_CONFIG = {
    // 媒体文件根目录路径
    // 可以是相对于项目根目录的路径，也可以是绝对路径
    // 例如:
    // - 'public/media'  (默认，项目内媒体目录)
    // - '../media'      (项目外的媒体目录)
    // - '/Users/username/Pictures'  (绝对路径)
    ROOT_PATH: process.env.MEDIA_ROOT_PATH || 'public/media',
};
