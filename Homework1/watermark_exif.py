#!/usr/bin/env python3
import os
import sys
from PIL import Image, ImageDraw, ImageFont
import piexif
from datetime import datetime

def get_exif_date(image_path):
    """尽量从EXIF获取拍摄时间，没有则用文件修改时间"""
    try:
        exif_dict = piexif.load(image_path)

        # 1. 优先 DateTimeOriginal
        if piexif.ExifIFD.DateTimeOriginal in exif_dict['Exif']:
            date_str = exif_dict['Exif'][piexif.ExifIFD.DateTimeOriginal].decode()
        # 2. 其次 DateTimeDigitized
        elif piexif.ExifIFD.DateTimeDigitized in exif_dict['Exif']:
            date_str = exif_dict['Exif'][piexif.ExifIFD.DateTimeDigitized].decode()
        # 3. 再其次 ImageIFD.DateTime
        elif 0x0132 in exif_dict['0th']:  # 0x0132 = DateTime
            date_str = exif_dict['0th'][0x0132].decode()
        else:
            # 没有EXIF则用文件修改时间
            ts = os.path.getmtime(image_path)
            return datetime.fromtimestamp(ts).strftime("%Y-%m-%d")

        # 格式：YYYY:MM:DD HH:MM:SS
        dt = datetime.strptime(date_str, "%Y:%m:%d %H:%M:%S")
        return dt.strftime("%Y-%m-%d")
    except Exception:
        # 出现异常也用文件修改时间
        ts = os.path.getmtime(image_path)
        return datetime.fromtimestamp(ts).strftime("%Y-%m-%d")


def add_watermark(image_path, text, font_size, color, position):
    """在图片上添加水印并返回新图像对象"""
    image = Image.open(image_path).convert("RGBA")
    draw = ImageDraw.Draw(image)

    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()

    # Pillow 10 推荐用 textbbox 计算大小
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]

    width, height = image.size

    if position == "left-top":
        x, y = 10, 10
    elif position == "center":
        x = (width - text_w) / 2
        y = (height - text_h) / 2
    elif position == "right-bottom":
        x = width - text_w - 10
        y = height - text_h - 10
    else:
        x, y = 10, 10

    draw.text((x, y), text, font=font, fill=color)
    # 关键：JPEG 不支持 RGBA，转换回 RGB
    return image.convert("RGB")

def main():
    if len(sys.argv) < 2:
        print("用法：python watermark_exif.py <图片路径>")
        sys.exit(1)

    input_path = sys.argv[1]
    dir_path = os.path.dirname(input_path)
    base_dir = os.path.basename(dir_path)
    out_dir = os.path.join(dir_path, base_dir + "_watermark")
    os.makedirs(out_dir, exist_ok=True)

    font_size = int(input("请输入字体大小(默认80): ") or 80)
    color = input("请输入字体颜色(例如 #FF0000，默认黑色): ") or "#000000"
    position = input("请输入位置(left-top/center/right-bottom，默认right-bottom): ") or "right-bottom"

    for fname in os.listdir(dir_path):
        if fname.lower().endswith((".jpg", ".jpeg", ".png")):
            full_path = os.path.join(dir_path, fname)
            date_text = get_exif_date(full_path)
            new_image = add_watermark(full_path, date_text, font_size, color, position)
            save_path = os.path.join(out_dir, fname)
            new_image.save(save_path)
            print(f"已保存：{save_path}")

if __name__ == "__main__":
    main()
