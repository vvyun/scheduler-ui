let currentSearchTerm = '';

document.addEventListener('DOMContentLoaded', function() {
    // 创建任务按钮事件
    const createJobBtn = document.getElementById('create-job-btn');
    const createJobModal = document.getElementById('create-job-modal');
    const closeCreateModal = createJobModal.querySelector('.close');
    
    createJobBtn.addEventListener('click', () => {
        createJobModal.classList.remove('hidden');
    });
    
    closeCreateModal.addEventListener('click', () => {
        createJobModal.classList.add('hidden');
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target == createJobModal) {
            createJobModal.classList.add('hidden');
        }
    });

    // 表单切换功能
    const jobTypeSelect = document.getElementById('job-type');
    const shellForm = document.getElementById('shell-job-form');
    const httpForm = document.getElementById('http-job-form');

    jobTypeSelect.addEventListener('change', function() {
        if (this.value === 'shell') {
            shellForm.classList.remove('hidden');
            httpForm.classList.add('hidden');
        } else if (this.value === 'http') {
            shellForm.classList.add('hidden');
            httpForm.classList.remove('hidden');
        } else {
            shellForm.classList.add('hidden');
            httpForm.classList.add('hidden');
        }
    });

    // 创建任务表单提交
    const createJobForm = document.getElementById('create-job-form');
    createJobForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const jobType = document.getElementById('job-type').value;
        const jobId = document.getElementById('job-id').value;
        
        let jobData = {
            id: jobId,
            type: jobType,
            schedule: {
                second: document.getElementById('schedule-second').value || undefined,
                minute: document.getElementById('schedule-minute').value || undefined,
                hour: document.getElementById('schedule-hour').value || undefined,
                day: document.getElementById('schedule-day').value || undefined,
                month: document.getElementById('schedule-month').value || undefined,
                day_of_week: document.getElementById('schedule-day-of-week').value || undefined
            }
        };

        // 清理空值
        Object.keys(jobData.schedule).forEach(key => {
            if (jobData.schedule[key] === undefined) {
                delete jobData.schedule[key];
            }
        });

        if (jobType === 'shell') {
            jobData.command = document.getElementById('shell-command').value;
        } else if (jobType === 'http') {
            jobData.url = document.getElementById('http-url').value;
            jobData.method = document.getElementById('http-method').value;
            const headersStr = document.getElementById('http-headers').value;
            if (headersStr) {
                try {
                    jobData.headers = JSON.parse(headersStr);
                } catch (e) {
                    alert('Headers格式不正确，请输入有效的JSON格式');
                    return;
                }
            }
            const body = document.getElementById('http-body').value;
            if (body) {
                jobData.body = body;
            }
        }

        fetch('/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jobData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showMessage(data.error, 'error');
            } else {
                showMessage(`任务 "${jobId}" 创建成功!`, 'success');
                createJobForm.reset();
                createJobModal.classList.add('hidden');
                loadJobs(); // 重新加载任务列表
            }
        })
        .catch(error => {
            showMessage('创建任务失败: ' + error.message, 'error');
        });
    });

    // 查询功能
    const searchInput = document.getElementById('search-job-id');
    const searchBtn = document.getElementById('search-btn');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    
    searchBtn.addEventListener('click', () => {
        currentSearchTerm = searchInput.value.trim();
        loadJobs();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        loadJobs();
    });
    
    // 回车查询
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchBtn.click();
        }
    });

    // 加载任务列表
    loadJobs();

    // 全局函数供HTML调用
    window.viewJobDetail = function(jobId) {
        fetch(`/jobs/${jobId}`)
            .then(response => response.json())
            .then(job => {
                if (job.error) {
                    showMessage(job.error, 'error');
                } else {
                    showJobDetailModal(job);
                }
            })
            .catch(error => {
                showMessage('获取任务详情失败: ' + error.message, 'error');
            });
    };

    window.deleteJob = function(jobId) {
        if (confirm(`确定要删除任务 "${jobId}" 吗?`)) {
            fetch(`/jobs/${jobId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showMessage(data.error, 'error');
                } else {
                    showMessage(data.message, 'success');
                    loadJobs(); // 重新加载任务列表
                }
            })
            .catch(error => {
                showMessage('删除任务失败: ' + error.message, 'error');
            });
        }
    };

    window.pauseJob = function(jobId) {
        fetch(`/jobs/${jobId}/pause`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showMessage(data.error, 'error');
            } else {
                showMessage(data.message, 'success');
                loadJobs(); // 重新加载任务列表
            }
        })
        .catch(error => {
            showMessage('暂停任务失败: ' + error.message, 'error');
        });
    };

    window.resumeJob = function(jobId) {
        fetch(`/jobs/${jobId}/resume`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showMessage(data.error, 'error');
            } else {
                showMessage(data.message, 'success');
                loadJobs(); // 重新加载任务列表
            }
        })
        .catch(error => {
            showMessage('恢复任务失败: ' + error.message, 'error');
        });
    };

    // 显示任务详情模态框
    function showJobDetailModal(job) {
        const modal = document.getElementById('job-detail-modal');
        const content = document.getElementById('job-detail-content');
        
        // 格式化下次运行时间
        const nextRunTime = job.next_run_time ? 
            new Date(job.next_run_time).toLocaleString() : 
            'N/A';
        
        content.innerHTML = `
            <div class="job-detail-item">
                <span class="job-detail-label">任务ID:</span>
                <span>${job.id}</span>
            </div>
            <div class="job-detail-item">
                <span class="job-detail-label">任务类型:</span>
                <span>${job.name}</span>
            </div>
             <div class="job-detail-item">
                <span class="job-detail-label">任务信息:</span>
                <span>${job.args}</span>
            </div>
            <div class="job-detail-item">
                <span class="job-detail-label">下次执行时间:</span>
                <span>${nextRunTime}</span>
            </div>
            <div class="job-detail-item">
                <span class="job-detail-label">状态:</span>
                <span>${nextRunTime==='N/A' ? '暂停' : '运行中'}</span>
            </div>
            <div class="job-detail-item">
                <span class="job-detail-label">触发器类型:</span>
                <span>${job.trigger.type}</span>
            </div>
            <div class="job-detail-item">
                <span class="job-detail-label">调度设置:</span>
                <span>${formatTriggerFields(job.trigger.fields)}</span>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = function() {
            modal.classList.add('hidden');
        };
        
        // 点击模态框外部关闭
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.classList.add('hidden');
            }
        };
    }
    
    // 格式化触发器字段
    function formatTriggerFields(fields) {
        const fieldDescriptions = {
            'second': '秒',
            'minute': '分钟',
            'hour': '小时',
            'day': '日期',
            'month': '月份',
            'day_of_week': '星期'
        };
        
        const parts = [];
        for (const [key, value] of Object.entries(fields)) {
            const desc = fieldDescriptions[key] || key;
            parts.push(`${desc}: ${value}`);
        }
        
        return parts.join(', ') || '无';
    }

    // 显示消息
    function showMessage(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);
        
        // 3秒后自动移除消息
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
    
    // 全局函数，供其他地方调用重新加载任务列表
    window.loadJobs = loadJobs;
    
    // 加载任务列表
    function loadJobs() {
        let url = '/jobs';
        if (currentSearchTerm) {
            // 这里可以扩展为向后端传递搜索参数
            // 目前我们将在前端进行过滤
        }
        
        fetch(url)
            .then(response => response.json())
            .then(jobs => {
                const tbody = document.querySelector('#jobs-table tbody');
                tbody.innerHTML = '';
                
                // 如果有搜索词，则进行前端过滤
                if (currentSearchTerm) {
                    jobs = jobs.filter(job => 
                        job.id.toLowerCase().includes(currentSearchTerm.toLowerCase())
                    );
                }
                
                jobs.forEach(job => {
                    const row = document.createElement('tr');
                    
                    // 格式化下次运行时间
                    const nextRunTime = job.next_run_time ? 
                        new Date(job.next_run_time).toLocaleString() : 
                        'N/A';
                    
                    row.innerHTML = `
                        <td>${job.id}</td>
                        <td>${job.name}</td>
                        <td>${nextRunTime}</td>
                        <td>
                            <div class="job-actions">
                                <button class="btn" onclick="viewJobDetail('${job.id}')">详情</button>
                                <button class="btn btn-warning"  ${nextRunTime==='N/A'?'disabled':''} onclick="pauseJob('${job.id}')">暂停</button>
                                <button class="btn" ${nextRunTime==='N/A'?'':'disabled'} onclick="resumeJob('${job.id}')">恢复</button>
                                <button class="btn btn-danger"  onclick="deleteJob('${job.id}')">删除</button>
                            </div>
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                });
                
                // 如果没有任务，显示一行提示
                if (jobs.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td colspan="4" style="text-align: center;">${currentSearchTerm ? '没有找到匹配的任务' : '暂无任务'}</td>`;
                    tbody.appendChild(row);
                }
            })
            .catch(error => {
                showMessage('加载任务列表失败: ' + error.message, 'error');
            });
    }
});