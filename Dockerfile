# 使用官方Python运行时作为基础镜像
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/python:3.10-alpine

# 设置工作目录
WORKDIR /app

# 复制requirements.txt文件到工作目录
COPY requirements.txt .

# 安装项目依赖
RUN pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

# 复制项目代码到工作目录
COPY . .

# 暴露端口
EXPOSE 5000

# 设置环境变量
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# 启动应用
CMD ["python", "app.py"]