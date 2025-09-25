#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from PyQt5.QtWidgets import QWidget, QLabel, QVBoxLayout, QSizePolicy
from PyQt5.QtGui import QPainter, QPixmap, QColor, QPen, QCursor, QMouseEvent
from PyQt5.QtCore import Qt, QPoint, QRect, QSize, pyqtSignal

class WatermarkPreview(QWidget):
    # 自定义信号，用于通知位置变化
    position_changed = pyqtSignal(QPoint)
    
    def __init__(self, settings):
        super().__init__()
        self.settings = settings
        self.image = None
        self.pixmap = None
        self.scaled_pixmap = None
        self.dragging = False
        self.drag_start_pos = QPoint()
        self.watermark_pos = QPoint()
        self.watermark_rect = QRect()
        
        # 设置鼠标跟踪
        self.setMouseTracking(True)
        
        # 设置焦点策略
        self.setFocusPolicy(Qt.StrongFocus)
        
        # 设置大小策略
        self.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        
        # 设置最小大小
        self.setMinimumSize(400, 300)
    
    def set_image(self, image):
        """设置要预览的图像"""
        self.image = image
        if image and image.pixmap:
            self.pixmap = image.pixmap
            self.update()
    
    def update(self):
        """更新预览"""
        super().update()
    
    def paintEvent(self, event):
        """绘制预览"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.setRenderHint(QPainter.SmoothPixmapTransform)
        
        # 填充背景
        painter.fillRect(self.rect(), QColor(240, 240, 240))
        
        if not self.pixmap or self.pixmap.isNull():
            # 没有图片，显示提示
            painter.drawText(self.rect(), Qt.AlignCenter, "请导入图片")
            return
        
        # 计算缩放后的图片大小，保持宽高比
        scaled_size = self.calculate_scaled_size()
        
        # 计算居中位置
        x = (self.width() - scaled_size.width()) // 2
        y = (self.height() - scaled_size.height()) // 2
        
        # 绘制缩放后的图片
        self.scaled_pixmap = self.pixmap.scaled(scaled_size, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        painter.drawPixmap(x, y, self.scaled_pixmap)
        
        # 保存图片区域
        self.image_rect = QRect(x, y, scaled_size.width(), scaled_size.height())
        
        # 应用水印预览
        self.draw_watermark_preview(painter)
    
    def calculate_scaled_size(self):
        """计算缩放后的图片大小"""
        if not self.pixmap or self.pixmap.isNull():
            return QSize(0, 0)
        
        # 获取控件大小和图片大小
        widget_width = self.width()
        widget_height = self.height()
        pixmap_width = self.pixmap.width()
        pixmap_height = self.pixmap.height()
        
        # 计算缩放比例
        width_ratio = widget_width / pixmap_width
        height_ratio = widget_height / pixmap_height
        scale_ratio = min(width_ratio, height_ratio) * 0.9  # 留出一些边距
        
        # 计算缩放后的大小
        scaled_width = int(pixmap_width * scale_ratio)
        scaled_height = int(pixmap_height * scale_ratio)
        
        return QSize(scaled_width, scaled_height)
    
    def draw_watermark_preview(self, painter):
        """绘制水印预览"""
        if not self.image or not self.image_rect.isValid():
            return
        
        # 保存当前状态
        painter.save()
        
        # 限制绘制区域在图片范围内
        painter.setClipRect(self.image_rect)
        
        # 计算水印位置
        position = self.settings.position
        img_rect = self.image_rect
        
        # 文本水印
        if self.settings.text_content.strip():
            self.draw_text_watermark_preview(painter, img_rect, position)
        
        # 图片水印
        if self.settings.watermark_image_path:
            self.draw_image_watermark_preview(painter, img_rect, position)
        
        # 恢复状态
        painter.restore()
    
    def draw_text_watermark_preview(self, painter, img_rect, position):
        """绘制文本水印预览"""
        text = self.settings.text_content
        if not text.strip():
            return
        
        # 设置字体
        font = self.settings.font
        painter.setFont(font)
        
        # 设置颜色和透明度
        color = self.settings.text_color
        opacity = self.settings.text_opacity / 100.0
        color.setAlpha(int(255 * opacity))
        painter.setPen(color)
        
        # 计算文本大小
        fm = painter.fontMetrics()
        text_width = fm.horizontalAdvance(text)
        text_height = fm.height()
        
        # 计算位置
        x, y = self.calculate_position(img_rect, text_width, text_height, position)
        
        # 保存当前位置用于拖拽
        self.watermark_rect = QRect(x, y, text_width, text_height)
        
        # 应用旋转
        if self.settings.rotation != 0:
            painter.save()
            
            # 设置旋转中心
            center_x = x + text_width / 2
            center_y = y + text_height / 2
            painter.translate(center_x, center_y)
            painter.rotate(self.settings.rotation)
            painter.translate(-center_x, -center_y)
            
            # 绘制文本阴影
            if self.settings.text_shadow:
                shadow_color = QColor(0, 0, 0, int(128 * opacity))
                painter.setPen(shadow_color)
                painter.drawText(x + 2, y + 2 + fm.ascent(), text)
            
            # 绘制文本描边
            if self.settings.text_outline:
                outline_color = QColor(0, 0, 0, int(200 * opacity))
                painter.setPen(outline_color)
                outline_width = self.settings.outline_width
                for dx in range(-outline_width, outline_width + 1):
                    for dy in range(-outline_width, outline_width + 1):
                        if dx != 0 or dy != 0:
                            painter.drawText(x + dx, y + dy + fm.ascent(), text)
            
            # 绘制文本
            painter.setPen(color)
            painter.drawText(x, y + fm.ascent(), text)
            
            painter.restore()
        else:
            # 绘制文本阴影
            if self.settings.text_shadow:
                shadow_color = QColor(0, 0, 0, int(128 * opacity))
                painter.setPen(shadow_color)
                painter.drawText(x + 2, y + 2 + fm.ascent(), text)
            
            # 绘制文本描边
            if self.settings.text_outline:
                outline_color = QColor(0, 0, 0, int(200 * opacity))
                painter.setPen(outline_color)
                outline_width = self.settings.outline_width
                for dx in range(-outline_width, outline_width + 1):
                    for dy in range(-outline_width, outline_width + 1):
                        if dx != 0 or dy != 0:
                            painter.drawText(x + dx, y + dy + fm.ascent(), text)
            
            # 绘制文本
            painter.setPen(color)
            painter.drawText(x, y + fm.ascent(), text)
    
    def draw_image_watermark_preview(self, painter, img_rect, position):
        """绘制图片水印预览"""
        if not self.settings.watermark_image_path:
            return
        
        # 加载水印图片
        watermark_pixmap = QPixmap(self.settings.watermark_image_path)
        if watermark_pixmap.isNull():
            return
        
        # 调整大小
        if self.settings.keep_aspect_ratio:
            # 按比例缩放
            scale = self.settings.watermark_image_scale
            new_width = int(watermark_pixmap.width() * scale)
            new_height = int(watermark_pixmap.height() * scale)
        else:
            # 自由调整大小
            new_width = self.settings.watermark_image_width
            new_height = self.settings.watermark_image_height
        
        watermark_pixmap = watermark_pixmap.scaled(new_width, new_height, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        
        # 计算位置
        x, y = self.calculate_position(img_rect, watermark_pixmap.width(), watermark_pixmap.height(), position)
        
        # 保存当前位置用于拖拽
        self.watermark_rect = QRect(x, y, watermark_pixmap.width(), watermark_pixmap.height())
        
        # 设置透明度
        opacity = self.settings.watermark_image_opacity / 100.0
        painter.setOpacity(opacity)
        
        # 应用旋转
        if self.settings.rotation != 0:
            painter.save()
            
            # 设置旋转中心
            center_x = x + watermark_pixmap.width() / 2
            center_y = y + watermark_pixmap.height() / 2
            painter.translate(center_x, center_y)
            painter.rotate(self.settings.rotation)
            painter.translate(-center_x, -center_y)
            
            # 绘制水印图片
            painter.drawPixmap(x, y, watermark_pixmap)
            
            painter.restore()
        else:
            # 绘制水印图片
            painter.drawPixmap(x, y, watermark_pixmap)
    
    def calculate_position(self, img_rect, width, height, position):
        """计算水印位置"""
        if self.dragging:
            # 如果正在拖拽，使用拖拽位置
            return self.watermark_pos.x(), self.watermark_pos.y()
        
        # 根据预设位置计算
        padding = 10  # 边距
        
        if position == "左上":
            x = img_rect.left() + padding
            y = img_rect.top() + padding
        elif position == "上中":
            x = img_rect.left() + (img_rect.width() - width) // 2
            y = img_rect.top() + padding
        elif position == "右上":
            x = img_rect.right() - width - padding
            y = img_rect.top() + padding
        elif position == "左中":
            x = img_rect.left() + padding
            y = img_rect.top() + (img_rect.height() - height) // 2
        elif position == "中心":
            x = img_rect.left() + (img_rect.width() - width) // 2
            y = img_rect.top() + (img_rect.height() - height) // 2
        elif position == "右中":
            x = img_rect.right() - width - padding
            y = img_rect.top() + (img_rect.height() - height) // 2
        elif position == "左下":
            x = img_rect.left() + padding
            y = img_rect.bottom() - height - padding
        elif position == "下中":
            x = img_rect.left() + (img_rect.width() - width) // 2
            y = img_rect.bottom() - height - padding
        else:  # 右下
            x = img_rect.right() - width - padding
            y = img_rect.bottom() - height - padding
        
        return x, y
    
    def mousePressEvent(self, event):
        """鼠标按下事件"""
        if event.button() == Qt.LeftButton and self.watermark_rect.contains(event.pos()):
            self.dragging = True
            self.drag_start_pos = event.pos()
            self.watermark_pos = self.watermark_rect.topLeft()
            self.setCursor(QCursor(Qt.ClosedHandCursor))
            event.accept()
        else:
            super().mousePressEvent(event)
    
    def mouseMoveEvent(self, event):
        """鼠标移动事件"""
        if self.dragging:
            # 计算偏移量
            delta = event.pos() - self.drag_start_pos
            
            # 降低拖拽灵敏度，使水印移动速度与鼠标移动速度匹配
            # 使用0.5的系数来减缓水印移动速度
            scaled_delta = QPoint(int(delta.x() * 0.5), int(delta.y() * 0.5))
            new_pos = self.watermark_pos + scaled_delta
            
            # 获取水印宽度和高度
            watermark_width = self.watermark_rect.width()
            watermark_height = self.watermark_rect.height()
            
            # 确保水印不会完全移出图片范围
            x = new_pos.x()
            y = new_pos.y()
            
            # 限制水印左边界不超出图片左边界
            if x < self.image_rect.left():
                x = self.image_rect.left()
            # 限制水印右边界不超出图片右边界
            elif x + watermark_width > self.image_rect.right():
                x = self.image_rect.right() - watermark_width
            
            # 限制水印上边界不超出图片上边界
            if y < self.image_rect.top():
                y = self.image_rect.top()
            # 限制水印下边界不超出图片下边界
            elif y + watermark_height > self.image_rect.bottom():
                y = self.image_rect.bottom() - watermark_height
            
            # 更新水印位置
            self.watermark_pos = QPoint(x, y)
            self.update()
            
            # 更新拖拽起始位置，使拖拽更加平滑
            self.drag_start_pos = event.pos()
            
            event.accept()
        elif self.watermark_rect.contains(event.pos()):
            # 鼠标悬停在水印上，显示可拖动光标
            self.setCursor(QCursor(Qt.OpenHandCursor))
        else:
            # 恢复默认光标
            self.setCursor(QCursor(Qt.ArrowCursor))
            super().mouseMoveEvent(event)
    
    def mouseReleaseEvent(self, event):
        """鼠标释放事件"""
        if event.button() == Qt.LeftButton and self.dragging:
            self.dragging = False
            self.setCursor(QCursor(Qt.ArrowCursor))
            
            # 发送位置变化信号
            self.position_changed.emit(self.watermark_pos)
            
            event.accept()
        else:
            super().mouseReleaseEvent(event)