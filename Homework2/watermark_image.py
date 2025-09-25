#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import io
from PyQt5.QtGui import QImage, QPixmap, QPainter, QColor, QFont, QTransform
from PyQt5.QtCore import Qt, QPoint, QRect, QSize

class WatermarkImage:
    def __init__(self, path):
        self.path = path
        self.original_image = None
        self.pixmap = None
        self.load_image()
    
    def load_image(self):
        """加载图片并创建QPixmap"""
        try:
            # 使用PIL加载图片
            self.original_image = Image.open(self.path).convert("RGBA")
            
            # 转换为QPixmap用于显示
            qimage = self.pil_to_qimage(self.original_image)
            self.pixmap = QPixmap.fromImage(qimage)
        except Exception as e:
            print(f"无法加载图片 {self.path}: {e}")
            self.original_image = None
            self.pixmap = QPixmap()
    
    def pil_to_qimage(self, pil_image):
        """将PIL图像转换为QImage"""
        if pil_image.mode == "RGBA":
            mode = QImage.Format_RGBA8888
        else:
            mode = QImage.Format_RGB888
            pil_image = pil_image.convert("RGB")
        
        img_data = pil_image.tobytes("raw", pil_image.mode)
        qimage = QImage(img_data, pil_image.width, pil_image.height, mode)
        return qimage
    
    def qimage_to_pil(self, qimage):
        """将QImage转换为PIL图像"""
        buffer = QImage(qimage)
        size = buffer.size()
        
        # 创建字节数组
        byte_array = io.BytesIO()
        buffer.save(byte_array, "PNG")
        byte_array.seek(0)
        
        # 从字节数组创建PIL图像
        return Image.open(byte_array)
    
    def apply_watermark(self, settings):
        """应用水印并返回处理后的PIL图像"""
        if not self.original_image:
            return None
        
        # 创建副本以避免修改原始图像
        result = self.original_image.copy()
        
        # 根据水印类型应用水印
        if settings.watermark_image_path and os.path.exists(settings.watermark_image_path):
            # 应用图片水印
            result = self.apply_image_watermark(result, settings)
        
        if settings.text_content.strip():
            # 应用文本水印
            result = self.apply_text_watermark(result, settings)
        
        return result
    
    def apply_text_watermark(self, image, settings):
        """应用文本水印"""
        if not settings.text_content.strip():
            return image
        
        # 创建绘图对象
        draw = ImageDraw.Draw(image)
        
        # 获取字体
        try:
            # 尝试使用系统字体
            font_size = settings.font.pointSize()
            font_family = settings.font.family()
            is_bold = settings.font.bold()
            is_italic = settings.font.italic()
            
            # 这里需要根据系统找到对应的字体文件
            # 简单起见，这里使用默认字体
            font = ImageFont.truetype("Arial", font_size)
        except Exception:
            # 使用默认字体
            font_size = settings.font.pointSize()
            font = ImageFont.load_default()
        
        # 获取文本颜色和透明度
        r, g, b = settings.text_color.red(), settings.text_color.green(), settings.text_color.blue()
        opacity = settings.text_opacity / 100.0
        text_color = (r, g, b, int(255 * opacity))
        
        # 计算文本大小
        text = settings.text_content
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        # 计算位置
        position = settings.position
        img_width, img_height = image.size
        
        if position == "左上":
            x, y = 10, 10
        elif position == "上中":
            x = (img_width - text_width) // 2
            y = 10
        elif position == "右上":
            x = img_width - text_width - 10
            y = 10
        elif position == "左中":
            x = 10
            y = (img_height - text_height) // 2
        elif position == "中心":
            x = (img_width - text_width) // 2
            y = (img_height - text_height) // 2
        elif position == "右中":
            x = img_width - text_width - 10
            y = (img_height - text_height) // 2
        elif position == "左下":
            x = 10
            y = img_height - text_height - 10
        elif position == "下中":
            x = (img_width - text_width) // 2
            y = img_height - text_height - 10
        else:  # 右下
            x = img_width - text_width - 10
            y = img_height - text_height - 10
        
        # 应用旋转
        if settings.rotation != 0:
            # 创建一个透明图层用于旋转文本
            txt = Image.new('RGBA', image.size, (255, 255, 255, 0))
            d = ImageDraw.Draw(txt)
            
            # 绘制文本
            if settings.text_shadow:
                # 添加阴影
                shadow_offset = 2
                d.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=(0, 0, 0, int(128 * opacity)))
            
            if settings.text_outline:
                # 添加描边
                outline_width = settings.outline_width
                for dx in range(-outline_width, outline_width + 1):
                    for dy in range(-outline_width, outline_width + 1):
                        if dx != 0 or dy != 0:
                            d.text((x + dx, y + dy), text, font=font, fill=(0, 0, 0, int(200 * opacity)))
            
            # 绘制主文本
            d.text((x, y), text, font=font, fill=text_color)
            
            # 旋转文本图层
            center_x = x + text_width // 2
            center_y = y + text_height // 2
            txt = txt.rotate(settings.rotation, center=(center_x, center_y), resample=Image.BICUBIC, expand=False)
            
            # 合并图层
            image = Image.alpha_composite(image, txt)
        else:
            # 直接绘制文本
            if settings.text_shadow:
                # 添加阴影
                shadow_offset = 2
                draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=(0, 0, 0, int(128 * opacity)))
            
            if settings.text_outline:
                # 添加描边
                outline_width = settings.outline_width
                for dx in range(-outline_width, outline_width + 1):
                    for dy in range(-outline_width, outline_width + 1):
                        if dx != 0 or dy != 0:
                            draw.text((x + dx, y + dy), text, font=font, fill=(0, 0, 0, int(200 * opacity)))
            
            # 绘制主文本
            draw.text((x, y), text, font=font, fill=text_color)
        
        return image
    
    def apply_image_watermark(self, image, settings):
        """应用图片水印"""
        if not settings.watermark_image_path or not os.path.exists(settings.watermark_image_path):
            return image
        
        try:
            # 加载水印图片
            watermark = Image.open(settings.watermark_image_path).convert("RGBA")
            
            # 调整大小
            if settings.keep_aspect_ratio:
                # 按比例缩放
                scale = settings.watermark_image_scale
                new_width = int(watermark.width * scale)
                new_height = int(watermark.height * scale)
            else:
                # 自由调整大小
                new_width = settings.watermark_image_width
                new_height = settings.watermark_image_height
            
            watermark = watermark.resize((new_width, new_height), Image.LANCZOS)
            
            # 调整透明度
            if settings.watermark_image_opacity < 100:
                alpha = watermark.split()[3]
                alpha = ImageEnhance.Brightness(alpha).enhance(settings.watermark_image_opacity / 100.0)
                watermark.putalpha(alpha)
            
            # 计算位置
            position = settings.position
            img_width, img_height = image.size
            wm_width, wm_height = watermark.size
            
            if position == "左上":
                x, y = 10, 10
            elif position == "上中":
                x = (img_width - wm_width) // 2
                y = 10
            elif position == "右上":
                x = img_width - wm_width - 10
                y = 10
            elif position == "左中":
                x = 10
                y = (img_height - wm_height) // 2
            elif position == "中心":
                x = (img_width - wm_width) // 2
                y = (img_height - wm_height) // 2
            elif position == "右中":
                x = img_width - wm_width - 10
                y = (img_height - wm_height) // 2
            elif position == "左下":
                x = 10
                y = img_height - wm_height - 10
            elif position == "下中":
                x = (img_width - wm_width) // 2
                y = img_height - wm_height - 10
            else:  # 右下
                x = img_width - wm_width - 10
                y = img_height - wm_height - 10
            
            # 应用旋转
            if settings.rotation != 0:
                # 创建一个透明图层用于旋转水印
                layer = Image.new('RGBA', image.size, (255, 255, 255, 0))
                
                # 粘贴水印到图层
                layer.paste(watermark, (x, y), watermark)
                
                # 旋转图层
                center_x = x + wm_width // 2
                center_y = y + wm_height // 2
                layer = layer.rotate(settings.rotation, center=(center_x, center_y), resample=Image.BICUBIC, expand=False)
                
                # 合并图层
                image = Image.alpha_composite(image, layer)
            else:
                # 直接粘贴水印
                image.paste(watermark, (x, y), watermark)
            
            return image
        except Exception as e:
            print(f"应用图片水印失败: {e}")
            return image