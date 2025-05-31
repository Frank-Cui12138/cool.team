class Navbar extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <nav class="navbar">
                <a href="index.html" class="nav-brand">
                    <img src="./images/logo.png" alt="煎饼狗子" class="logo">
                    <span>煎饼狗子</span>
                </a>
                <ul class="nav-links">
                    <li><a href="index.html">首页</a></li>
                    <li><a href="products.html">产品</a></li>
                    <li><a href="feedback.html">用户反馈</a></li>
                    <li><a href="admin.html">反馈管理</a></li>
                    <li><a href="about.html">关于我们</a></li>
                </ul>
                <div class="nav-toggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </nav>
        `;
        this.addEventListeners();
    }

    addEventListeners() {
        const toggle = this.querySelector('.nav-toggle');
        const navLinks = this.querySelector('.nav-links');
        
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            toggle.classList.toggle('active');
        });
    }
}

customElements.define('nav-bar', Navbar); 