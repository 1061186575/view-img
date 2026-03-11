import heicConvert from 'heic-convert';

export default async function processHeic(buffer) {
    // 执行耗时的转码计算
    const jpegBuffer = await heicConvert({
        buffer: buffer,
        format: 'JPEG',
        quality: 0.8
    });

    return jpegBuffer;
}
