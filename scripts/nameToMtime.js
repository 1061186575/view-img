/**
 * 获取文件名称里面的时间, 设置为文件的更新时间, 支持的文件格式:
 * IMG_20240109_111946.jpg
 * IMG_20240109_111948_1.jpg
 * VID_20230910_194707.mp4
 * VID_20240301_122201(0).mp4
 */

const fs = require('fs').promises;
const path = require('path');

async function fixFileTimes(directory) {
    let count = 0;
    const files = await fs.readdir(directory);

    for (const file of files) {
        const filePath = path.join(directory, file);

        try {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) continue;
            count++;

            // 匹配20xx年的日期时间
            const match = file.match(/(IMG|VID)_20(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})[._(]/);
            if (!match) {
                console.log('跳过不匹配 file', file)
                continue;
            }

            const [_name, _type, yy, mm, dd, hh, mi, ss] = match;
            const year = 2000 + parseInt(yy);
            const month = parseInt(mm) - 1;
            const day = parseInt(dd);
            const hour = parseInt(hh);
            const minute = parseInt(mi);
            const second = parseInt(ss);

            const newDate = new Date(year, month, day, hour, minute, second);
            // console.log('newDate', newDate)
            if (isNaN(newDate.getTime())) {
                console.log('跳过 isNaN', file)
                continue;
            }

            // 只修改mtime，保持atime不变
            await fs.utimes(filePath, stats.atime, newDate);
            // console.log(`已修改: ${file} -> ${newDate.toLocaleString()}`);
        } catch (err) {
            console.log(`跳过: ${file} (${err.message})`);
        }
    }
    console.log('已处理', count, '个文件')
}

// 使用
// fixFileTimes('D:\\project\\view-img\\public\\media\\test').catch(console.error);
fixFileTimes('/home/admin/Desktop/project/media/红米手机/dir1').catch(console.error);
