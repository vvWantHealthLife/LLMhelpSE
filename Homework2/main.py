#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
水印文件本地应用 - 主程序入口

这个程序允许用户为图片添加文本或图片水印，并提供丰富的自定义选项。
"""

import sys
import os
from PyQt5.QtWidgets import QApplication
from PyQt5.QtGui import QIcon
from watermark_app import WatermarkApp


def main():
    """主函数，启动水印应用程序"""
    # 确保templates目录存在
    if not os.path.exists('templates'):
        os.makedirs('templates')
        
    # 创建应用程序实例
    app = QApplication(sys.argv)
    app.setStyle('Fusion')  # 使用Fusion风格，在不同平台上保持一致的外观
    
    # 设置应用程序图标和名称
    app.setApplicationName("水印文件本地应用")
    
    # 创建并显示主窗口
    main_window = WatermarkApp()
    main_window.show()
    
    # 运行应用程序事件循环
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()