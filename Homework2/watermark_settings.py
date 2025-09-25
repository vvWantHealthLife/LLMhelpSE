#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from PyQt5.QtGui import QFont, QColor
from PyQt5.QtCore import QPoint
import json
import os

class WatermarkSettings:
    def __init__(self):
        # 文本水印设置
        self.text_content = "水印文本"
        self.font = QFont("Arial", 36)
        self.text_color = QColor(0, 0, 0, 255)  # 黑色，完全不透明
        self.text_opacity = 100  # 百分比
        self.text_shadow = False
        self.text_outline = False
        self.outline_width = 2
        
        # 图片水印设置
        self.watermark_image_path = ""
        self.watermark_image_scale = 1.0
        self.keep_aspect_ratio = True
        self.watermark_image_width = 100
        self.watermark_image_height = 100
        self.watermark_image_opacity = 100  # 百分比
        
        # 位置和旋转
        self.position = "右下"  # 默认右下角
        self.rotation = 0  # 旋转角度
    
    def to_dict(self):
        """将设置转换为字典，用于保存"""
        return {
            "text_content": self.text_content,
            "font_family": self.font.family(),
            "font_size": self.font.pointSize(),
            "font_bold": self.font.bold(),
            "font_italic": self.font.italic(),
            "text_color": {
                "r": self.text_color.red(),
                "g": self.text_color.green(),
                "b": self.text_color.blue(),
                "a": self.text_color.alpha()
            },
            "text_opacity": self.text_opacity,
            "text_shadow": self.text_shadow,
            "text_outline": self.text_outline,
            "outline_width": self.outline_width,
            "watermark_image_path": self.watermark_image_path,
            "watermark_image_scale": self.watermark_image_scale,
            "keep_aspect_ratio": self.keep_aspect_ratio,
            "watermark_image_width": self.watermark_image_width,
            "watermark_image_height": self.watermark_image_height,
            "watermark_image_opacity": self.watermark_image_opacity,
            "position": self.position,
            "rotation": self.rotation
        }
    
    @classmethod
    def from_dict(cls, data):
        """从字典创建设置对象"""
        settings = cls()
        
        # 文本水印设置
        settings.text_content = data.get("text_content", settings.text_content)
        
        font = QFont()
        font.setFamily(data.get("font_family", "Arial"))
        font.setPointSize(data.get("font_size", 36))
        font.setBold(data.get("font_bold", False))
        font.setItalic(data.get("font_italic", False))
        settings.font = font
        
        color_data = data.get("text_color", {"r": 0, "g": 0, "b": 0, "a": 255})
        settings.text_color = QColor(
            color_data.get("r", 0),
            color_data.get("g", 0),
            color_data.get("b", 0),
            color_data.get("a", 255)
        )
        
        settings.text_opacity = data.get("text_opacity", 100)
        settings.text_shadow = data.get("text_shadow", False)
        settings.text_outline = data.get("text_outline", False)
        settings.outline_width = data.get("outline_width", 2)
        
        # 图片水印设置
        settings.watermark_image_path = data.get("watermark_image_path", "")
        settings.watermark_image_scale = data.get("watermark_image_scale", 1.0)
        settings.keep_aspect_ratio = data.get("keep_aspect_ratio", True)
        settings.watermark_image_width = data.get("watermark_image_width", 100)
        settings.watermark_image_height = data.get("watermark_image_height", 100)
        settings.watermark_image_opacity = data.get("watermark_image_opacity", 100)
        
        # 位置和旋转
        settings.position = data.get("position", "右下")
        settings.rotation = data.get("rotation", 0)
        
        return settings