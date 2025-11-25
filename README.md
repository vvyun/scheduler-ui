# Scheduler-UI - 定时任务平台

一个基于Python的定时任务管理平台，支持创建和管理定时任务。

## 功能特性

- 创建和管理定时任务
- 支持执行Shell脚本
- 支持执行HTTP/HTTPS请求
- 提供RESTful API接口
- 可视化Web管理界面

## 技术栈

- Python 3.x
- Flask - Web框架
- APScheduler - 定时任务调度
- SQLite - 数据存储
- Requests - HTTP请求处理

## 安装与运行

### 环境要求

- Python 3.10+

### 安装依赖

```bash
pip install -r requirements.txt
```

### 运行应用

```bash
python app.py
```

应用默认运行在 `http://localhost:5000`

## Docker部署

### 构建镜像

```bash
docker build -t py-scheduler-ui .
```

### 运行容器

```bash
docker run -d -p 5000:5000 --name py-scheduler-ui py-scheduler-ui
```

### 挂载数据卷（可选，用于持久化任务数据）

```bash
docker run -d -p 5000:5000 -v scheduler-data:/app/data --name py-scheduler-ui py-scheduler-ui
```

## API接口

### 创建任务

#### Shell脚本任务

POST `/jobs`

```json
{
  "id": "unique_job_id",
  "type": "shell",
  "command": "echo 'Hello World'",
  "schedule": {
    "second": "*/10"
  }
}
```

#### HTTP请求任务

POST `/jobs`

```json
{
  "id": "http_job_id",
  "type": "http",
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token"
  },
  "schedule": {
    "minute": "*/5"
  }
}
```

### 管理任务

- GET `/jobs` - 获取所有任务列表
- GET `/jobs/<job_id>` - 获取特定任务详情
- DELETE `/jobs/<job_id>` - 删除任务
- POST `/jobs/<job_id>/pause` - 暂停任务
- POST `/jobs/<job_id>/resume` - 恢复任务

## 任务调度格式

调度参数遵循cron表达式格式:

- `year`: 年 (4位数字)
- `month`: 月 (1-12)
- `day`: 日 (1-31)
- `week`: 周 (1-53)
- `day_of_week`: 星期几 (0-6 或 mon,tue,wed,thu,fri,sat,sun)
- `hour`: 小时 (0-23)
- `minute`: 分钟 (0-59)
- `second`: 秒 (0-59)

示例:
- 每10秒执行一次: `{ "second": "*/10" }`
- 每天上午9点执行: `{ "hour": "9", "minute": "0" }`
- 每周一上午9点执行: `{ "day_of_week": "mon", "hour": "9", "minute": "0" }`

## Web界面使用

1. 访问 `http://localhost:5000` 进入主页面
2. 默认显示任务列表
3. 使用搜索框根据任务ID进行模糊查询
4. 点击"创建任务"按钮打开任务创建表单
5. 点击任务行的"详情"按钮查看任务详细信息
6. 使用操作列中的按钮管理任务（查看详情、删除、暂停、恢复）

## 开发计划

- [x] 基础框架搭建
- [x] 定时任务核心功能实现
- [x] Web管理界面开发
- [ ] 用户认证与权限管理
- [ ] 任务执行历史记录与查询
- [ ] 任务失败重试机制
- [ ] 更多任务类型支持