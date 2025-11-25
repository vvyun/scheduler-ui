import os
from flask import Flask, request, jsonify, render_template
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor
import subprocess
import requests
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')

# 配置数据库路径
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'data/jobs.sqlite')

# APScheduler配置
jobstores = {
    'default': SQLAlchemyJobStore(url=f'sqlite:///{db_path}')
}

executors = {
    'default': ThreadPoolExecutor(20),
}

job_defaults = {
    'coalesce': False,
    'max_instances': 3
}

# 初始化调度器
scheduler = BackgroundScheduler(jobstores=jobstores, executors=executors, job_defaults=job_defaults)


def execute_shell_command(command):
    """
    执行shell命令的任务函数
    """
    try:
        logger.info(f"Executing shell command: {command}")
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        logger.info(f"Command output: {result.stdout}")
        if result.stderr:
            logger.error(f"Command error: {result.stderr}")
        return result.stdout
    except Exception as e:
        logger.error(f"Error executing shell command: {str(e)}")
        raise


def execute_http_request(url, method='GET', headers=None, data=None):
    """
    执行HTTP/HTTPS请求的任务函数
    """
    try:
        logger.info(f"Executing HTTP request: {method} {url}")
        if headers is None:
            headers = {}
        
        response = requests.request(method, url, headers=headers, data=data, timeout=30)
        logger.info(f"HTTP response status: {response.status_code}")
        if response.text:
            logger.info(f"HTTP response output: {response.text}")
        return {
            'status_code': response.status_code,
            'content': response.text
        }
    except Exception as e:
        logger.error(f"Error executing HTTP request: {str(e)}")
        raise


@app.route('/')
def index():
    """
    主页 - Web界面
    """
    return render_template('index.html')


@app.route('/jobs', methods=['POST'])
def add_job():
    """
    创建新的定时任务
    """
    try:
        data = request.get_json()
        
        job_type = data.get('type')
        job_id = data.get('id')
        job_schedule = data.get('schedule')
        
        if not job_type or not job_id or not job_schedule:
            return jsonify({'error': 'Missing required fields: type, id, schedule'}), 400
        
        # 根据任务类型添加不同的任务
        if job_type == 'shell':
            command = data.get('command')
            if not command:
                return jsonify({'error': 'Missing command for shell job'}), 400
            
            job = scheduler.add_job(
                execute_shell_command,
                trigger='cron',
                id=job_id,
                replace_existing=True,
                **job_schedule,
                args=[command]
            )
            
        elif job_type == 'http':
            url = data.get('url')
            method = data.get('method', 'GET')
            headers = data.get('headers', {})
            body = data.get('body')
            
            if not url:
                return jsonify({'error': 'Missing URL for HTTP job'}), 400
            
            job = scheduler.add_job(
                execute_http_request,
                trigger='cron',
                id=job_id,
                replace_existing=True,
                **job_schedule,
                args=[url, method, headers, body]
            )
        else:
            return jsonify({'error': 'Invalid job type. Supported types: shell, http'}), 400
        
        return jsonify({
            'message': 'Job created successfully',
            'job_id': job.id,
            'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None
        }), 201
    
    except Exception as e:
        logger.error(f"Error adding job: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/jobs', methods=['GET'])
def list_jobs():
    """
    获取所有定时任务列表
    """
    try:
        jobs = scheduler.get_jobs()
        job_list = []
        for job in jobs:
            job_list.append({
                'id': job.id,
                'name': job.name,
                'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
                'pending': job.pending
            })
        return jsonify(job_list), 200
    except Exception as e:
        logger.error(f"Error listing jobs: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/jobs/<job_id>', methods=['GET'])
def get_job(job_id):
    """
    获取特定任务详情
    """
    try:
        job = scheduler.get_job(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # 获取任务的触发器信息
        trigger_info = {}
        if hasattr(job.trigger, 'fields'):
            for field in job.trigger.fields:
                trigger_info[field.name] = str(field)
        
        return jsonify({
            'id': job.id,
            'name': job.name,
            'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
            'pending': job.pending,
            'func_ref': job.func_ref if hasattr(job, 'func_ref') else None,
            'trigger': {
                'type': type(job.trigger).__name__,
                'fields': trigger_info
            },
            'args': job.args,
        }), 200
    except Exception as e:
        logger.error(f"Error getting job: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/jobs/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    """
    删除指定任务
    """
    try:
        job = scheduler.get_job(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        scheduler.remove_job(job_id)
        return jsonify({'message': f'Job {job_id} deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting job: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/jobs/<job_id>/pause', methods=['POST'])
def pause_job(job_id):
    """
    暂停指定任务
    """
    try:
        job = scheduler.get_job(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        scheduler.pause_job(job_id)
        return jsonify({'message': f'Job {job_id} paused successfully'}), 200
    except Exception as e:
        logger.error(f"Error pausing job: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/jobs/<job_id>/resume', methods=['POST'])
def resume_job(job_id):
    """
    恢复指定任务
    """
    try:
        job = scheduler.get_job(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        scheduler.resume_job(job_id)
        return jsonify({'message': f'Job {job_id} resumed successfully'}), 200
    except Exception as e:
        logger.error(f"Error resuming job: {str(e)}")
        return jsonify({'error': str(e)}), 500


# API信息端点（保持向后兼容）
@app.route('/api', methods=['GET'])
def api_info():
    """
    API信息
    """
    return jsonify({
        'message': 'Scheduler UI - Scheduled Jobs Platform',
        'endpoints': {
            'create_job': 'POST /jobs',
            'list_jobs': 'GET /jobs',
            'get_job': 'GET /jobs/<job_id>',
            'delete_job': 'DELETE /jobs/<job_id>',
            'pause_job': 'POST /jobs/<job_id>/pause',
            'resume_job': 'POST /jobs/<job_id>/resume'
        }
    }), 200


if __name__ == '__main__':
    # 启动调度器
    scheduler.start()
    logger.info("Scheduler started")
    
    # 启动Flask应用
    app.run(debug=True, host='0.0.0.0', port=5000)