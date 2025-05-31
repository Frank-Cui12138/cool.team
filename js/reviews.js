class ReviewSystem {
    constructor() {
        this.reviews = [];
        this.currentRating = 0;
        this.apiBaseUrl = 'https://w2cejf1r69.hzh.sealos.run/feedback';
        this.initializeElements();
        if (this.reviewForm && this.ratingStars.length > 0) {
            this.setupEventListeners();
        }
        this.loadReviews();
    }

    initializeElements() {
        this.reviewForm = document.getElementById('review-form');
        this.reviewsList = document.getElementById('reviews-list');
        this.ratingStars = document.querySelectorAll('.star');
        this.reviewInput = document.getElementById('review-input');
        this.nameInput = document.getElementById('name-input');
        this.phoneInput = document.getElementById('phone-input');
        this.emailInput = document.getElementById('email-input');
        this.productSelect = document.getElementById('product-select');
    }

    setupEventListeners() {
        if (this.ratingStars) {
            this.ratingStars.forEach((star, index) => {
                star.addEventListener('click', () => this.setRating(index + 1));
                star.addEventListener('mouseover', () => this.highlightStars(index + 1));
                star.addEventListener('mouseout', () => this.highlightStars(this.currentRating));
            });
        }

        if (this.reviewForm) {
            this.reviewForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    setRating(rating) {
        this.currentRating = rating;
        this.highlightStars(rating);
    }

    highlightStars(count) {
        this.ratingStars.forEach((star, index) => {
            star.textContent = index < count ? '★' : '☆';
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: this.nameInput.value.trim(),
            phone: this.phoneInput.value.trim(),
            email: this.emailInput.value.trim(),
            productId: this.productSelect.value,
            rating: this.currentRating,
            content: this.reviewInput.value.trim()
        };

        if (!formData.name) {
            alert('请输入您的称呼');
            return;
        }
        if (!formData.phone) {
            alert('请输入联系电话');
            return;
        }
        if (!formData.email) {
            alert('请输入电子邮箱');
            return;
        }
        if (!formData.productId) {
            alert('请选择产品');
            return;
        }
        if (!formData.rating) {
            alert('请选择评分');
            return;
        }
        if (!formData.content) {
            alert('请输入反馈内容');
            return;
        }

        try {
            const response = await axios.post(`${this.apiBaseUrl}`, formData);

            if (response.data.ok) {
                alert('感谢您的反馈！');
                this.resetForm();
                this.loadReviews();
            } else {
                alert(response.data.error || '提交失败，请稍后重试');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            if (error.response) {
                alert(error.response.data?.error || `提交失败: ${error.response.status}`);
            } else if (error.request) {
                alert('服务器无响应，请稍后重试');
            } else {
                alert('提交失败，请检查网络连接后重试');
            }
        }
    }

    resetForm() {
        this.reviewForm.reset();
        this.currentRating = 0;
        this.highlightStars(0);
    }

    async loadReviews() {
        if (!this.reviewsList) return;

        try {
            console.log('Attempting to fetch reviews...');
            const response = await axios.get(`${this.apiBaseUrl}`, {
                params: {
                    page: 1,
                    pageSize: 10
                }
            });

            if (response.data.ok && response.data.data.list) {
                console.log('Successfully fetched reviews:', response.data);
                this.reviews = response.data.data.list;
                this.displayReviews();
            } else {
                console.error('Server response format error:', response.data);
                this.reviewsList.innerHTML = '<div class="error-message">暂时无法加载评论，请稍后重试。</div>';
            }
        } catch (error) {
            console.error('Error loading reviews:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
            
            if (error.response) {
                console.error('Server error details:', error.response.data);
                this.reviewsList.innerHTML = `<div class="error-message">加载失败 (${error.response.status}): ${error.response.data.error || '未知错误'}</div>`;
            } else if (error.request) {
                this.reviewsList.innerHTML = '<div class="error-message">服务器无响应，请检查网络连接</div>';
            } else {
                this.reviewsList.innerHTML = '<div class="error-message">加载评论时出现错误，请稍后重试</div>';
            }
        }
    }

    displayReviews() {
        if (!this.reviewsList) return;
        
        this.reviewsList.innerHTML = this.reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <span class="review-author">${review.name}</span>
                    <span class="review-date">${new Date(review.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
                <div class="rating">
                    ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                </div>
                <div class="review-content">
                    ${review.content}
                </div>
                ${review.reply ? `
                    <div class="review-reply">
                        <strong>官方回复：</strong>
                        <p>${review.reply}</p>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
}

// 当DOM加载完成后等待Axios加载完成再初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查Axios是否已加载
    function initWhenAxiosReady() {
        if (window.axios) {
            new ReviewSystem();
        } else {
            // 如果还没加载完成，等待100ms后再次检查
            setTimeout(initWhenAxiosReady, 100);
        }
    }

    initWhenAxiosReady();
}); 