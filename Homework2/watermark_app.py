#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
                             QPushButton, QLabel, QFileDialog, QListWidget, QListWidgetItem,
                             QComboBox, QSlider, QLineEdit, QGroupBox, QRadioButton, QCheckBox,
                             QSpinBox, QColorDialog, QTabWidget, QScrollArea, QMessageBox,
                             QGridLayout, QSizePolicy, QFrame, QSplitter, QButtonGroup)
from PyQt5.QtGui import (QPixmap, QImage, QPainter, QColor, QFont, QFontDatabase,
                         QDrag, QIcon, QCursor, QPen, QBrush, QTransform)
from PyQt5.QtCore import (Qt, QSize, QPoint, QRect, QMimeData, QByteArray, QBuffer,
                          QSettings, QTimer, QEvent, QFileInfo, QDir, pyqtSignal)
import json
import uuid
from PIL import Image, ImageDraw, ImageFont
import io

from watermark_image import WatermarkImage
from watermark_preview import WatermarkPreview
from watermark_settings import WatermarkSettings
from watermark_templates import WatermarkTemplates

class WatermarkApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("水印文件应用")
        self.resize(1200, 800)
        
        # 初始化应用程序状态
        self.images = []  # 存储导入的图片
        self.current_image_index = -1  # 当前选中的图片索引
        self.settings = WatermarkSettings()  # 水印设置
        self.templates = WatermarkTemplates()  # 水印模板
        
        # 创建UI
        self.init_ui()
        
        # 加载上次的设置
        self.load_last_settings()
    
    def init_ui(self):
        # 创建主窗口布局
        main_widget = QWidget()
        main_layout = QHBoxLayout(main_widget)
        
        # 左侧面板 - 图片列表和导入/导出控件
        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)
        
        # 图片导入按钮
        import_layout = QHBoxLayout()
        self.btn_import_image = QPushButton("导入图片")
        self.btn_import_folder = QPushButton("导入文件夹")
        import_layout.addWidget(self.btn_import_image)
        import_layout.addWidget(self.btn_import_folder)
        left_layout.addLayout(import_layout)
        
        # 图片列表
        self.image_list = QListWidget()
        self.image_list.setIconSize(QSize(80, 80))
        self.image_list.setResizeMode(QListWidget.Adjust)
        self.image_list.setViewMode(QListWidget.IconMode)
        self.image_list.setSelectionMode(QListWidget.SingleSelection)
        left_layout.addWidget(QLabel("已导入图片:"))
        left_layout.addWidget(self.image_list)
        
        # 导出控件
        export_group = QGroupBox("导出设置")
        export_layout = QVBoxLayout(export_group)
        
        # 输出格式
        format_layout = QHBoxLayout()
        format_layout.addWidget(QLabel("输出格式:"))
        self.output_format = QComboBox()
        self.output_format.addItems(["JPEG", "PNG"])
        format_layout.addWidget(self.output_format)
        export_layout.addLayout(format_layout)
        
        # JPEG质量设置
        quality_layout = QHBoxLayout()
        quality_layout.addWidget(QLabel("JPEG质量:"))
        self.jpeg_quality = QSlider(Qt.Horizontal)
        self.jpeg_quality.setRange(1, 100)
        self.jpeg_quality.setValue(90)
        self.jpeg_quality_label = QLabel("90")
        quality_layout.addWidget(self.jpeg_quality)
        quality_layout.addWidget(self.jpeg_quality_label)
        export_layout.addLayout(quality_layout)
        
        # 文件命名规则
        naming_group = QGroupBox("文件命名规则")
        naming_layout = QVBoxLayout(naming_group)
        
        self.naming_original = QRadioButton("保留原文件名")
        self.naming_prefix = QRadioButton("添加前缀")
        self.naming_suffix = QRadioButton("添加后缀")
        
        self.naming_original.setChecked(True)
        
        prefix_layout = QHBoxLayout()
        prefix_layout.addWidget(self.naming_prefix)
        self.prefix_input = QLineEdit("wm_")
        prefix_layout.addWidget(self.prefix_input)
        
        suffix_layout = QHBoxLayout()
        suffix_layout.addWidget(self.naming_suffix)
        self.suffix_input = QLineEdit("_watermarked")
        suffix_layout.addWidget(self.suffix_input)
        
        naming_layout.addWidget(self.naming_original)
        naming_layout.addLayout(prefix_layout)
        naming_layout.addLayout(suffix_layout)
        
        export_layout.addWidget(naming_group)
        
        # 导出按钮
        self.btn_export = QPushButton("导出图片")
        export_layout.addWidget(self.btn_export)
        
        left_layout.addWidget(export_group)
        
        # 中间面板 - 图片预览
        middle_panel = QWidget()
        middle_layout = QVBoxLayout(middle_panel)
        
        # 预览区域
        middle_layout.addWidget(QLabel("预览:"))
        self.preview = WatermarkPreview(self.settings)
        middle_layout.addWidget(self.preview)
        
        # 右侧面板 - 水印设置
        right_panel = QWidget()
        right_layout = QVBoxLayout(right_panel)
        
        # 水印类型选项卡
        watermark_tabs = QTabWidget()
        
        # 文本水印选项卡
        text_tab = QWidget()
        text_layout = QVBoxLayout(text_tab)
        
        # 文本内容
        text_content_layout = QHBoxLayout()
        text_content_layout.addWidget(QLabel("文本内容:"))
        self.text_content = QLineEdit()
        text_content_layout.addWidget(self.text_content)
        text_layout.addLayout(text_content_layout)
        
        # 字体设置
        font_group = QGroupBox("字体设置")
        font_layout = QVBoxLayout(font_group)
        
        # 字体选择
        font_select_layout = QHBoxLayout()
        font_select_layout.addWidget(QLabel("字体:"))
        self.font_family = QComboBox()
        # 添加系统字体
        for family in QFontDatabase().families():
            self.font_family.addItem(family)
        font_select_layout.addWidget(self.font_family)
        font_layout.addLayout(font_select_layout)
        
        # 字体大小
        font_size_layout = QHBoxLayout()
        font_size_layout.addWidget(QLabel("字号:"))
        self.font_size = QSpinBox()
        self.font_size.setRange(8, 120)
        self.font_size.setValue(36)
        font_size_layout.addWidget(self.font_size)
        font_layout.addLayout(font_size_layout)
        
        # 字体样式
        font_style_layout = QHBoxLayout()
        self.font_bold = QCheckBox("粗体")
        self.font_italic = QCheckBox("斜体")
        font_style_layout.addWidget(self.font_bold)
        font_style_layout.addWidget(self.font_italic)
        font_layout.addLayout(font_style_layout)
        
        # 字体颜色
        color_layout = QHBoxLayout()
        color_layout.addWidget(QLabel("颜色:"))
        self.text_color_btn = QPushButton()
        self.text_color_btn.setFixedSize(30, 30)
        self.text_color = QColor(0, 0, 0, 255)  # 默认黑色
        self.update_color_button()
        color_layout.addWidget(self.text_color_btn)
        font_layout.addLayout(color_layout)
        
        # 文本透明度
        text_opacity_layout = QHBoxLayout()
        text_opacity_layout.addWidget(QLabel("透明度:"))
        self.text_opacity = QSlider(Qt.Horizontal)
        self.text_opacity.setRange(0, 100)
        self.text_opacity.setValue(100)
        self.text_opacity_label = QLabel("100%")
        text_opacity_layout.addWidget(self.text_opacity)
        text_opacity_layout.addWidget(self.text_opacity_label)
        font_layout.addLayout(text_opacity_layout)
        
        # 文本样式效果
        text_effect_group = QGroupBox("文本效果")
        text_effect_layout = QVBoxLayout(text_effect_group)
        
        # 阴影效果
        self.text_shadow = QCheckBox("添加阴影")
        text_effect_layout.addWidget(self.text_shadow)
        
        # 描边效果
        outline_layout = QHBoxLayout()
        self.text_outline = QCheckBox("添加描边")
        outline_layout.addWidget(self.text_outline)
        self.outline_width = QSpinBox()
        self.outline_width.setRange(1, 10)
        self.outline_width.setValue(2)
        outline_layout.addWidget(self.outline_width)
        text_effect_layout.addLayout(outline_layout)
        
        font_layout.addWidget(text_effect_group)
        text_layout.addWidget(font_group)
        
        watermark_tabs.addTab(text_tab, "文本水印")
        
        # 图片水印选项卡
        image_tab = QWidget()
        image_layout = QVBoxLayout(image_tab)
        
        # 选择水印图片
        self.btn_select_watermark = QPushButton("选择水印图片")
        image_layout.addWidget(self.btn_select_watermark)
        
        # 水印图片预览
        self.watermark_image_preview = QLabel("未选择水印图片")
        self.watermark_image_preview.setAlignment(Qt.AlignCenter)
        self.watermark_image_preview.setMinimumHeight(100)
        self.watermark_image_preview.setFrameShape(QFrame.Box)
        image_layout.addWidget(self.watermark_image_preview)
        
        # 图片水印大小调整
        size_group = QGroupBox("大小调整")
        size_layout = QVBoxLayout(size_group)
        
        # 按比例缩放
        scale_layout = QHBoxLayout()
        scale_layout.addWidget(QLabel("缩放比例:"))
        self.image_scale = QSlider(Qt.Horizontal)
        self.image_scale.setRange(10, 200)
        self.image_scale.setValue(100)
        self.image_scale_label = QLabel("100%")
        scale_layout.addWidget(self.image_scale)
        scale_layout.addWidget(self.image_scale_label)
        size_layout.addLayout(scale_layout)
        
        # 自由调整大小
        self.keep_aspect_ratio = QCheckBox("保持宽高比")
        self.keep_aspect_ratio.setChecked(True)
        size_layout.addWidget(self.keep_aspect_ratio)
        
        width_layout = QHBoxLayout()
        width_layout.addWidget(QLabel("宽度:"))
        self.image_width = QSpinBox()
        self.image_width.setRange(10, 2000)
        self.image_width.setValue(100)
        width_layout.addWidget(self.image_width)
        size_layout.addLayout(width_layout)
        
        height_layout = QHBoxLayout()
        height_layout.addWidget(QLabel("高度:"))
        self.image_height = QSpinBox()
        self.image_height.setRange(10, 2000)
        self.image_height.setValue(100)
        height_layout.addWidget(self.image_height)
        size_layout.addLayout(height_layout)
        
        image_layout.addWidget(size_group)
        
        # 图片水印透明度
        image_opacity_layout = QHBoxLayout()
        image_opacity_layout.addWidget(QLabel("透明度:"))
        self.image_opacity = QSlider(Qt.Horizontal)
        self.image_opacity.setRange(0, 100)
        self.image_opacity.setValue(100)
        self.image_opacity_label = QLabel("100%")
        image_opacity_layout.addWidget(self.image_opacity)
        image_opacity_layout.addWidget(self.image_opacity_label)
        image_layout.addLayout(image_opacity_layout)
        
        watermark_tabs.addTab(image_tab, "图片水印")
        right_layout.addWidget(watermark_tabs)
        
        # 水印位置设置
        position_group = QGroupBox("水印位置")
        position_layout = QVBoxLayout(position_group)
        
        # 九宫格位置选择
        grid_layout = QGridLayout()
        self.position_buttons = {}
        positions = [
            ("左上", 0, 0), ("上中", 0, 1), ("右上", 0, 2),
            ("左中", 1, 0), ("中心", 1, 1), ("右中", 1, 2),
            ("左下", 2, 0), ("下中", 2, 1), ("右下", 2, 2)
        ]
        
        self.position_group = QButtonGroup()
        for name, row, col in positions:
            btn = QPushButton(name)
            btn.setCheckable(True)
            if name == "右下":  # 默认右下角
                btn.setChecked(True)
            self.position_buttons[name] = btn
            grid_layout.addWidget(btn, row, col)
            self.position_group.addButton(btn)
        
        position_layout.addLayout(grid_layout)
        
        # 手动拖拽提示
        position_layout.addWidget(QLabel("提示: 您也可以直接在预览图上拖拽水印"))
        
        # 旋转设置
        rotation_layout = QHBoxLayout()
        rotation_layout.addWidget(QLabel("旋转角度:"))
        self.rotation_slider = QSlider(Qt.Horizontal)
        self.rotation_slider.setRange(0, 359)
        self.rotation_slider.setValue(0)
        self.rotation_value = QLabel("0°")
        rotation_layout.addWidget(self.rotation_slider)
        rotation_layout.addWidget(self.rotation_value)
        position_layout.addLayout(rotation_layout)
        
        right_layout.addWidget(position_group)
        
        # 模板管理
        template_group = QGroupBox("水印模板")
        template_layout = QVBoxLayout(template_group)
        
        template_buttons_layout = QHBoxLayout()
        self.btn_save_template = QPushButton("保存当前设置为模板")
        self.btn_load_template = QPushButton("加载模板")
        template_buttons_layout.addWidget(self.btn_save_template)
        template_buttons_layout.addWidget(self.btn_load_template)
        template_layout.addLayout(template_buttons_layout)
        
        self.template_name = QLineEdit()
        self.template_name.setPlaceholderText("模板名称")
        template_layout.addWidget(self.template_name)
        
        right_layout.addWidget(template_group)
        
        # 设置拉伸因子
        left_panel.setSizePolicy(QSizePolicy.Preferred, QSizePolicy.Expanding)
        middle_panel.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        right_panel.setSizePolicy(QSizePolicy.Preferred, QSizePolicy.Expanding)
        
        # 添加面板到主布局
        splitter = QSplitter(Qt.Horizontal)
        splitter.addWidget(left_panel)
        splitter.addWidget(middle_panel)
        splitter.addWidget(right_panel)
        splitter.setSizes([200, 600, 300])
        main_layout.addWidget(splitter)
        
        self.setCentralWidget(main_widget)
        
        # 连接信号和槽
        self.connect_signals()
    
    def connect_signals(self):
        # 图片导入
        self.btn_import_image.clicked.connect(self.import_images)
        self.btn_import_folder.clicked.connect(self.import_folder)
        self.image_list.itemClicked.connect(self.on_image_selected)
        
        # 导出
        self.btn_export.clicked.connect(self.export_images)
        self.jpeg_quality.valueChanged.connect(self.update_jpeg_quality_label)
        
        # 文本水印
        self.text_content.textChanged.connect(self.update_preview)
        self.font_family.currentIndexChanged.connect(self.update_preview)
        self.font_size.valueChanged.connect(self.update_preview)
        self.font_bold.stateChanged.connect(self.update_preview)
        self.font_italic.stateChanged.connect(self.update_preview)
        self.text_color_btn.clicked.connect(self.select_text_color)
        self.text_opacity.valueChanged.connect(self.update_text_opacity)
        self.text_shadow.stateChanged.connect(self.update_preview)
        self.text_outline.stateChanged.connect(self.update_preview)
        self.outline_width.valueChanged.connect(self.update_preview)
        
        # 图片水印
        self.btn_select_watermark.clicked.connect(self.select_watermark_image)
        self.image_scale.valueChanged.connect(self.update_image_scale)
        self.keep_aspect_ratio.stateChanged.connect(self.update_aspect_ratio)
        self.image_width.valueChanged.connect(self.update_image_width)
        self.image_height.valueChanged.connect(self.update_image_height)
        self.image_opacity.valueChanged.connect(self.update_image_opacity)
        
        # 位置和旋转
        for btn in self.position_buttons.values():
            btn.clicked.connect(self.update_position)
        self.rotation_slider.valueChanged.connect(self.update_rotation)
        
        # 模板
        self.btn_save_template.clicked.connect(self.save_template)
        self.btn_load_template.clicked.connect(self.load_template)
    
    def import_images(self):
        file_paths, _ = QFileDialog.getOpenFileNames(
            self, "选择图片", "", "图片文件 (*.jpg *.jpeg *.png *.bmp *.tiff *.tif)"
        )
        if file_paths:
            self.add_images(file_paths)
    
    def import_folder(self):
        folder_path = QFileDialog.getExistingDirectory(self, "选择文件夹")
        if folder_path:
            image_paths = []
            for root, _, files in os.walk(folder_path):
                for file in files:
                    if file.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif")):
                        image_paths.append(os.path.join(root, file))
            if image_paths:
                self.add_images(image_paths)
    
    def add_images(self, file_paths):
        for path in file_paths:
            # 检查是否已经添加过
            existing_items = [self.image_list.item(i).data(Qt.UserRole) for i in range(self.image_list.count())]
            if path in existing_items:
                continue
                
            try:
                # 创建缩略图
                pixmap = QPixmap(path)
                if pixmap.isNull():
                    continue
                    
                thumbnail = pixmap.scaled(80, 80, Qt.KeepAspectRatio, Qt.SmoothTransformation)
                
                # 创建列表项
                item = QListWidgetItem()
                item.setIcon(QIcon(thumbnail))
                item.setText(os.path.basename(path))
                item.setData(Qt.UserRole, path)  # 存储完整路径
                
                self.image_list.addItem(item)
                
                # 添加到图片列表
                self.images.append(WatermarkImage(path))
            except Exception as e:
                print(f"无法加载图片 {path}: {e}")
        
        # 如果这是第一批图片，选择第一张
        if self.current_image_index == -1 and self.image_list.count() > 0:
            self.image_list.setCurrentRow(0)
            self.on_image_selected(self.image_list.item(0))
    
    def on_image_selected(self, item):
        path = item.data(Qt.UserRole)
        for i, img in enumerate(self.images):
            if img.path == path:
                self.current_image_index = i
                self.preview.set_image(self.images[i])
                self.update_preview()
                break
    
    def update_preview(self):
        if self.current_image_index >= 0:
            # 更新设置
            self.update_settings()
            
            # 更新预览
            self.preview.update()
    
    def update_settings(self):
        # 文本水印设置
        self.settings.text_content = self.text_content.text()
        
        font = QFont()
        font.setFamily(self.font_family.currentText())
        font.setPointSize(self.font_size.value())
        font.setBold(self.font_bold.isChecked())
        font.setItalic(self.font_italic.isChecked())
        self.settings.font = font
        
        self.settings.text_color = self.text_color
        self.settings.text_opacity = self.text_opacity.value()
        
        self.settings.text_shadow = self.text_shadow.isChecked()
        self.settings.text_outline = self.text_outline.isChecked()
        self.settings.outline_width = self.outline_width.value()
        
        # 图片水印设置
        self.settings.watermark_image_scale = self.image_scale.value() / 100.0
        self.settings.keep_aspect_ratio = self.keep_aspect_ratio.isChecked()
        self.settings.watermark_image_width = self.image_width.value()
        self.settings.watermark_image_height = self.image_height.value()
        self.settings.watermark_image_opacity = self.image_opacity.value()
        
        # 位置和旋转
        for name, btn in self.position_buttons.items():
            if btn.isChecked():
                self.settings.position = name
                break
        
        self.settings.rotation = self.rotation_slider.value()
    
    def update_color_button(self):
        # 设置颜色按钮的背景色
        style = f"background-color: rgba({self.text_color.red()}, {self.text_color.green()}, {self.text_color.blue()}, {self.text_color.alpha()});"
        self.text_color_btn.setStyleSheet(style)
    
    def select_text_color(self):
        color = QColorDialog.getColor(self.text_color, self, "选择文本颜色", QColorDialog.ShowAlphaChannel)
        if color.isValid():
            self.text_color = color
            self.update_color_button()
            self.update_preview()
    
    def update_text_opacity(self):
        value = self.text_opacity.value()
        self.text_opacity_label.setText(f"{value}%")
        self.update_preview()
    
    def select_watermark_image(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "选择水印图片", "", "图片文件 (*.png *.jpg *.jpeg *.bmp)"
        )
        if file_path:
            try:
                # 加载水印图片
                self.settings.watermark_image_path = file_path
                pixmap = QPixmap(file_path)
                
                # 更新预览
                scaled_pixmap = pixmap.scaled(200, 100, Qt.KeepAspectRatio, Qt.SmoothTransformation)
                self.watermark_image_preview.setPixmap(scaled_pixmap)
                
                # 更新尺寸
                self.image_width.setValue(pixmap.width())
                self.image_height.setValue(pixmap.height())
                
                self.update_preview()
            except Exception as e:
                QMessageBox.warning(self, "错误", f"无法加载水印图片: {e}")
    
    def update_image_scale(self):
        value = self.image_scale.value()
        self.image_scale_label.setText(f"{value}%")
        
        if self.settings.watermark_image_path and self.keep_aspect_ratio.isChecked():
            # 按比例更新宽高
            pixmap = QPixmap(self.settings.watermark_image_path)
            new_width = int(pixmap.width() * value / 100)
            new_height = int(pixmap.height() * value / 100)
            
            self.image_width.blockSignals(True)
            self.image_height.blockSignals(True)
            self.image_width.setValue(new_width)
            self.image_height.setValue(new_height)
            self.image_width.blockSignals(False)
            self.image_height.blockSignals(False)
        
        self.update_preview()
    
    def update_aspect_ratio(self):
        if self.keep_aspect_ratio.isChecked() and self.settings.watermark_image_path:
            # 恢复原始宽高比
            pixmap = QPixmap(self.settings.watermark_image_path)
            ratio = pixmap.width() / pixmap.height()
            
            # 以当前宽度为基准调整高度
            new_height = int(self.image_width.value() / ratio)
            
            self.image_height.blockSignals(True)
            self.image_height.setValue(new_height)
            self.image_height.blockSignals(False)
            
            self.update_preview()
    
    def update_image_width(self):
        if self.keep_aspect_ratio.isChecked() and self.settings.watermark_image_path:
            pixmap = QPixmap(self.settings.watermark_image_path)
            ratio = pixmap.width() / pixmap.height()
            
            new_height = int(self.image_width.value() / ratio)
            
            self.image_height.blockSignals(True)
            self.image_height.setValue(new_height)
            self.image_height.blockSignals(False)
        
        self.update_preview()
    
    def update_image_height(self):
        if self.keep_aspect_ratio.isChecked() and self.settings.watermark_image_path:
            pixmap = QPixmap(self.settings.watermark_image_path)
            ratio = pixmap.width() / pixmap.height()
            
            new_width = int(self.image_height.value() * ratio)
            
            self.image_width.blockSignals(True)
            self.image_width.setValue(new_width)
            self.image_width.blockSignals(False)
        
        self.update_preview()
    
    def update_image_opacity(self):
        value = self.image_opacity.value()
        self.image_opacity_label.setText(f"{value}%")
        self.update_preview()
    
    def update_position(self):
        self.update_preview()
    
    def update_rotation(self):
        value = self.rotation_slider.value()
        self.rotation_value.setText(f"{value}°")
        self.update_preview()
    
    def update_jpeg_quality_label(self):
        value = self.jpeg_quality.value()
        self.jpeg_quality_label.setText(str(value))
    
    def export_images(self):
        if not self.images:
            QMessageBox.warning(self, "警告", "没有可导出的图片")
            return
        
        # 选择输出目录
        output_dir = QFileDialog.getExistingDirectory(self, "选择输出目录")
        if not output_dir:
            return
        
        # 检查是否为原目录
        for img in self.images:
            if os.path.dirname(img.path) == output_dir:
                result = QMessageBox.question(
                    self, "警告", "您选择的输出目录与原图片目录相同，这可能会覆盖原图片。是否继续？",
                    QMessageBox.Yes | QMessageBox.No
                )
                if result == QMessageBox.No:
                    return
                break
        
        # 获取输出格式
        output_format = self.output_format.currentText().lower()
        
        # 获取JPEG质量
        jpeg_quality = self.jpeg_quality.value() if output_format == "jpeg" else 95
        
        # 获取命名规则
        if self.naming_original.isChecked():
            naming_rule = "original"
            prefix = ""
            suffix = ""
        elif self.naming_prefix.isChecked():
            naming_rule = "prefix"
            prefix = self.prefix_input.text()
            suffix = ""
        else:  # suffix
            naming_rule = "suffix"
            prefix = ""
            suffix = self.suffix_input.text()
        
        # 更新设置
        self.update_settings()
        
        # 导出每张图片
        success_count = 0
        for img in self.images:
            try:
                # 获取输出文件名
                base_name = os.path.basename(img.path)
                name, ext = os.path.splitext(base_name)
                
                if naming_rule == "original":
                    output_name = f"{name}.{output_format}"
                elif naming_rule == "prefix":
                    output_name = f"{prefix}{name}.{output_format}"
                else:  # suffix
                    output_name = f"{name}{suffix}.{output_format}"
                
                output_path = os.path.join(output_dir, output_name)
                
                # 应用水印并保存
                result_image = img.apply_watermark(self.settings)
                
                if output_format == "jpeg":
                    # 转换为RGB模式，因为JPEG不支持透明通道
                    if result_image.mode == "RGBA":
                        result_image = result_image.convert("RGB")
                    result_image.save(output_path, quality=jpeg_quality)
                else:
                    result_image.save(output_path)
                
                success_count += 1
            except Exception as e:
                print(f"导出图片 {img.path} 失败: {e}")
        
        QMessageBox.information(self, "导出完成", f"成功导出 {success_count} 张图片到 {output_dir}")
    
    def save_template(self):
        name = self.template_name.text().strip()
        if not name:
            QMessageBox.warning(self, "警告", "请输入模板名称")
            return
        
        # 更新设置
        self.update_settings()
        
        # 保存模板
        self.templates.save_template(name, self.settings)
        QMessageBox.information(self, "成功", f"模板 '{name}' 已保存")
    
    def load_template(self):
        template_names = self.templates.get_template_names()
        if not template_names:
            QMessageBox.information(self, "提示", "没有保存的模板")
            return
        
        # 简单实现，实际应用中可以使用对话框让用户选择
        from PyQt5.QtWidgets import QInputDialog
        name, ok = QInputDialog.getItem(
            self, "加载模板", "选择模板:", template_names, 0, False
        )
        
        if ok and name:
            settings = self.templates.load_template(name)
            if settings:
                self.apply_template_settings(settings)
                QMessageBox.information(self, "成功", f"已加载模板 '{name}'")
    
    def apply_template_settings(self, settings):
        # 应用文本水印设置
        self.text_content.setText(settings.text_content)
        
        font_index = self.font_family.findText(settings.font.family())
        if font_index >= 0:
            self.font_family.setCurrentIndex(font_index)
        
        self.font_size.setValue(settings.font.pointSize())
        self.font_bold.setChecked(settings.font.bold())
        self.font_italic.setChecked(settings.font.italic())
        
        self.text_color = settings.text_color
        self.update_color_button()
        
        self.text_opacity.setValue(settings.text_opacity)
        self.text_shadow.setChecked(settings.text_shadow)
        self.text_outline.setChecked(settings.text_outline)
        self.outline_width.setValue(settings.outline_width)
        
        # 应用图片水印设置
        if settings.watermark_image_path:
            self.settings.watermark_image_path = settings.watermark_image_path
            pixmap = QPixmap(settings.watermark_image_path)
            scaled_pixmap = pixmap.scaled(200, 100, Qt.KeepAspectRatio, Qt.SmoothTransformation)
            self.watermark_image_preview.setPixmap(scaled_pixmap)
        
        self.image_scale.setValue(int(settings.watermark_image_scale * 100))
        self.keep_aspect_ratio.setChecked(settings.keep_aspect_ratio)
        self.image_width.setValue(settings.watermark_image_width)
        self.image_height.setValue(settings.watermark_image_height)
        self.image_opacity.setValue(settings.watermark_image_opacity)
        
        # 应用位置和旋转设置
        for name, btn in self.position_buttons.items():
            btn.setChecked(name == settings.position)
        
        self.rotation_slider.setValue(settings.rotation)
        
        # 更新预览
        self.update_preview()
    
    def load_last_settings(self):
        # 加载上次的设置或默认模板
        last_settings = self.templates.load_last_settings()
        if last_settings:
            self.apply_template_settings(last_settings)
    
    def closeEvent(self, event):
        # 保存当前设置
        self.update_settings()
        self.templates.save_last_settings(self.settings)
        super().closeEvent(event)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = WatermarkApp()
    window.show()
    sys.exit(app.exec_())