#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
from watermark_settings import WatermarkSettings

class WatermarkTemplates:
    def __init__(self):
        # 创建模板目录
        self.templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
        os.makedirs(self.templates_dir, exist_ok=True)
        
        # 上次设置文件路径
        self.last_settings_path = os.path.join(self.templates_dir, "last_settings.json")
    
    def save_template(self, name, settings):
        """保存水印模板"""
        # 确保名称有效
        name = self._sanitize_name(name)
        
        # 将设置转换为字典
        settings_dict = settings.to_dict()
        
        # 保存到文件
        template_path = os.path.join(self.templates_dir, f"{name}.json")
        with open(template_path, "w", encoding="utf-8") as f:
            json.dump(settings_dict, f, ensure_ascii=False, indent=2)
    
    def load_template(self, name):
        """加载水印模板"""
        # 确保名称有效
        name = self._sanitize_name(name)
        
        # 加载文件
        template_path = os.path.join(self.templates_dir, f"{name}.json")
        if not os.path.exists(template_path):
            return None
        
        try:
            with open(template_path, "r", encoding="utf-8") as f:
                settings_dict = json.load(f)
            
            # 从字典创建设置对象
            return WatermarkSettings.from_dict(settings_dict)
        except Exception as e:
            print(f"加载模板 {name} 失败: {e}")
            return None
    
    def delete_template(self, name):
        """删除水印模板"""
        # 确保名称有效
        name = self._sanitize_name(name)
        
        # 删除文件
        template_path = os.path.join(self.templates_dir, f"{name}.json")
        if os.path.exists(template_path):
            os.remove(template_path)
            return True
        return False
    
    def get_template_names(self):
        """获取所有模板名称"""
        template_names = []
        for filename in os.listdir(self.templates_dir):
            if filename.endswith(".json") and filename != "last_settings.json":
                template_names.append(os.path.splitext(filename)[0])
        return template_names
    
    def save_last_settings(self, settings):
        """保存上次使用的设置"""
        # 将设置转换为字典
        settings_dict = settings.to_dict()
        
        # 保存到文件
        with open(self.last_settings_path, "w", encoding="utf-8") as f:
            json.dump(settings_dict, f, ensure_ascii=False, indent=2)
    
    def load_last_settings(self):
        """加载上次使用的设置"""
        if not os.path.exists(self.last_settings_path):
            return None
        
        try:
            with open(self.last_settings_path, "r", encoding="utf-8") as f:
                settings_dict = json.load(f)
            
            # 从字典创建设置对象
            return WatermarkSettings.from_dict(settings_dict)
        except Exception as e:
            print(f"加载上次设置失败: {e}")
            return None
    
    def _sanitize_name(self, name):
        """确保名称有效"""
        # 移除不允许的字符
        invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
        for char in invalid_chars:
            name = name.replace(char, '_')
        
        # 确保名称不为空
        if not name:
            name = "default"
        
        return name