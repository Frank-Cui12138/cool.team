class AdminPanel {
    constructor() {
        this.apiBaseUrl = 'https://w2cejf1r69.hzh.sealos.run/feedback';
        this.currentPage = 1;
        this.pageSize = 10;
        this.isAuthenticated = false;
        this.initializeElements();
        this.setupEventListeners();
        this.loadExcelLibrary();
    }

    initializeElements() {
        this.authForm = document.getElementById('auth-form');
        this.adminPanel = document.getElementById('admin-panel');
        this.passwordInput = document.getElementById('admin-password');
        this.authButton = document.getElementById('auth-button');
        this.statusFilter = document.getElementById('status-filter');
        this.productFilter = document.getElementById('product-filter');
        this.searchButton = document.getElementById('search-button');
        this.exportButton = document.getElementById('export-button');
        this.feedbackStats = document.getElementById('feedback-stats');
        this.feedbackTable = document.getElementById('feedback-table');
        this.pagination = document.getElementById('pagination');
    }

    setupEventListeners() {
        this.authButton.addEventListener('click', () => this.authenticate());
        this.searchButton.addEventListener('click', () => this.loadFeedbackList());
        this.exportButton.addEventListener('click', () => this.exportToExcel());
        this.statusFilter.addEventListener('change', () => this.currentPage = 1);
        this.productFilter.addEventListener('change', () => this.currentPage = 1);
    }

    loadExcelLibrary() {
        // 动态加载 xlsx 库
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js';
        script.onload = () => console.log('XLSX library loaded');
        script.onerror = () => console.error('Failed to load XLSX library');
        document.head.appendChild(script);
    }

    async exportToExcel() {
        if (!this.isAuthenticated || !window.XLSX) {
            alert('请先登录或等待Excel导出组件加载完成');
            return;
        }

        try {
            // 获取所有反馈数据
            const response = await axios.get(`${this.apiBaseUrl}`, {
                params: {
                    password: this.passwordInput.value.trim(),
                    export: true
                }
            });

            if (!response.data.ok || !response.data.data) {
                throw new Error(response.data.error || '导出失败');
            }

            const feedbackList = response.data.data;
            
            // 准备Excel数据
            const excelData = feedbackList.map(feedback => ({
                '提交时间': new Date(feedback.createdAt).toLocaleString('zh-CN'),
                '用户名': feedback.name,
                '电话': feedback.phone,
                '邮箱': feedback.email,
                '产品': feedback.productId,
                '评分': feedback.rating,
                '状态': this.getStatusText(feedback.status),
                '反馈内容': feedback.content,
                '回复内容': feedback.reply || '',
                '回复时间': feedback.replyAt ? new Date(feedback.replyAt).toLocaleString('zh-CN') : ''
            }));

            // 创建工作簿
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            // 设置列宽
            const colWidths = [
                { wch: 20 }, // 提交时间
                { wch: 10 }, // 用户名
                { wch: 15 }, // 电话
                { wch: 25 }, // 邮箱
                { wch: 20 }, // 产品
                { wch: 8 },  // 评分
                { wch: 10 }, // 状态
                { wch: 40 }, // 反馈内容
                { wch: 40 }, // 回复内容
                { wch: 20 }  // 回复时间
            ];
            ws['!cols'] = colWidths;

            // 添加工作表到工作簿
            XLSX.utils.book_append_sheet(wb, ws, '用户反馈');

            // 生成Excel文件并下载
            const fileName = `用户反馈_${new Date().toLocaleDateString('zh-CN')}.xlsx`;
            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error('Export error:', error);
            alert('导出失败，请稍后重试');
        }
    }

    getStatusText(status) {
        const statusMap = {
            0: '未处理',
            1: '已处理',
            2: '已回复'
        };
        return statusMap[status] || '未知';
    }

    async authenticate() {
        const password = this.passwordInput.value.trim();
        
        if (!password) {
            alert('请输入管理密码');
            return;
        }

        try {
            const response = await axios.get(`${this.apiBaseUrl}`, {
                params: {
                    password: password,
                    auth: true
                }
            });
            
            if (response.data.ok) {
                this.isAuthenticated = true;
                this.authForm.style.display = 'none';
                this.adminPanel.style.display = 'block';
                this.loadFeedbackStats();
                this.loadFeedbackList();
            } else {
                alert(response.data.error || '密码错误');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            alert('验证失败，请稍后重试');
        }
    }

    async loadFeedbackStats() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}`, {
                params: { 
                    password: this.passwordInput.value.trim(),
                    stats: true
                }
            });

            if (response.data.ok) {
                const stats = response.data.data;
                this.feedbackStats.innerHTML = `
                    <div class="stat-item">
                        <div class="stat-value">${stats.totalCount}</div>
                        <div class="stat-label">总反馈数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.pendingCount}</div>
                        <div class="stat-label">待处理</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.processedCount}</div>
                        <div class="stat-label">已处理</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.repliedCount}</div>
                        <div class="stat-label">已回复</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.averageRating.toFixed(1)}</div>
                        <div class="stat-label">平均评分</div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            this.feedbackStats.innerHTML = '<div class="error-message">加载统计信息失败</div>';
        }
    }

    async loadFeedbackList() {
        if (!this.isAuthenticated) return;

        try {
            const response = await axios.get(`${this.apiBaseUrl}`, {
                params: {
                    password: this.passwordInput.value.trim(),
                    page: this.currentPage,
                    pageSize: this.pageSize,
                    status: this.statusFilter.value,
                    productId: this.productFilter.value
                }
            });

            if (response.data.ok) {
                const { list, pagination } = response.data.data;
                this.renderFeedbackTable(list);
                this.renderPagination(pagination);
            } else {
                this.feedbackTable.innerHTML = '<div class="error-message">加载失败</div>';
            }
        } catch (error) {
            console.error('Error loading feedback list:', error);
            this.feedbackTable.innerHTML = '<div class="error-message">加载失败，请稍后重试</div>';
        }
    }

    renderFeedbackTable(feedbackList) {
        const statusMap = {
            0: { text: '未处理', class: 'status-pending' },
            1: { text: '已处理', class: 'status-processed' },
            2: { text: '已回复', class: 'status-replied' }
        };

        this.feedbackTable.innerHTML = `
            <table class="feedback-table">
                <thead>
                    <tr>
                        <th>提交时间</th>
                        <th>用户</th>
                        <th>产品</th>
                        <th>评分</th>
                        <th>状态</th>
                        <th>内容</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${feedbackList.map(feedback => `
                        <tr>
                            <td>${new Date(feedback.createdAt).toLocaleString('zh-CN')}</td>
                            <td>
                                ${feedback.name}<br>
                                <small>${feedback.phone}</small><br>
                                <small>${feedback.email}</small>
                            </td>
                            <td>${feedback.productId}</td>
                            <td>${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}</td>
                            <td>
                                <span class="status-badge ${statusMap[feedback.status].class}">
                                    ${statusMap[feedback.status].text}
                                </span>
                            </td>
                            <td>${feedback.content}</td>
                            <td>
                                <button class="btn btn-small" onclick="adminPanel.updateStatus('${feedback._id}')">
                                    更新状态
                                </button>
                                ${feedback.status !== 2 ? `
                                    <button class="btn btn-small" onclick="adminPanel.replyFeedback('${feedback._id}')">
                                        回复
                                    </button>
                                ` : ''}
                                <button class="btn btn-small btn-danger" onclick="adminPanel.deleteFeedback('${feedback._id}')">
                                    删除
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderPagination(pagination) {
        const { total, page, pageSize, totalPages } = pagination;
        
        let buttons = [];
        
        // 上一页按钮
        buttons.push(`
            <button class="page-button" 
                    ${page === 1 ? 'disabled' : ''}
                    onclick="adminPanel.goToPage(${page - 1})">
                上一页
            </button>
        `);

        // 页码按钮
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || // 第一页
                i === totalPages || // 最后一页
                (i >= page - 2 && i <= page + 2) // 当前页码附近的页码
            ) {
                buttons.push(`
                    <button class="page-button ${i === page ? 'active' : ''}"
                            onclick="adminPanel.goToPage(${i})">
                        ${i}
                    </button>
                `);
            } else if (
                (i === page - 3 && page > 4) || // 当前页码前的省略号
                (i === page + 3 && page < totalPages - 3) // 当前页码后的省略号
            ) {
                buttons.push('<span class="page-button">...</span>');
            }
        }

        // 下一页按钮
        buttons.push(`
            <button class="page-button"
                    ${page === totalPages ? 'disabled' : ''}
                    onclick="adminPanel.goToPage(${page + 1})">
                下一页
            </button>
        `);

        this.pagination.innerHTML = buttons.join('');
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadFeedbackList();
    }

    async updateStatus(id) {
        const status = prompt('请输入新状态 (0: 未处理, 1: 已处理, 2: 已回复)：');
        if (status === null) return;

        const statusNum = parseInt(status);
        if (isNaN(statusNum) || statusNum < 0 || statusNum > 2) {
            alert('状态值无效');
            return;
        }

        try {
            const response = await axios.put(`${this.apiBaseUrl}`, {
                id,
                status: statusNum,
                password: this.passwordInput.value.trim()
            });

            if (response.data.ok) {
                alert('状态更新成功');
                this.loadFeedbackList();
                this.loadFeedbackStats();
            } else {
                alert(response.data.error || '更新失败');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('更新失败，请稍后重试');
        }
    }

    async replyFeedback(id) {
        const reply = prompt('请输入回复内容：');
        if (!reply) return;

        try {
            const response = await axios.put(`${this.apiBaseUrl}`, {
                id,
                status: 2,
                reply,
                password: this.passwordInput.value.trim()
            });

            if (response.data.ok) {
                alert('回复成功');
                this.loadFeedbackList();
                this.loadFeedbackStats();
            } else {
                alert(response.data.error || '回复失败');
            }
        } catch (error) {
            console.error('Error replying feedback:', error);
            alert('回复失败，请稍后重试');
        }
    }

    async deleteFeedback(id) {
        if (!confirm('确定要删除这条反馈吗？')) return;

        try {
            const response = await axios.delete(`${this.apiBaseUrl}`, {
                data: {
                    id,
                    password: this.passwordInput.value.trim()
                }
            });

            if (response.data.ok) {
                alert('删除成功');
                this.loadFeedbackList();
                this.loadFeedbackStats();
            } else {
                alert(response.data.error || '删除失败');
            }
        } catch (error) {
            console.error('Error deleting feedback:', error);
            alert('删除失败，请稍后重试');
        }
    }
}

// 初始化管理面板
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    function initWhenAxiosReady() {
        if (window.axios) {
            adminPanel = new AdminPanel();
        } else {
            setTimeout(initWhenAxiosReady, 100);
        }
    }

    initWhenAxiosReady();
}); 