import os

class Config:
    # 基础目录
    basedir = os.path.abspath(os.path.dirname(__file__))
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f'sqlite:///{os.path.join(basedir, "/data/app.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 调度器配置
    SCHEDULER_API_ENABLED = True
    
    # 安全配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-for-scheduled-jobs-platform'