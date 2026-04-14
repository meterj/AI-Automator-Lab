// public/js/app.js - Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const statTotal = document.querySelector('#stat-total .value');
    const statAi = document.querySelector('#stat-ai .value');
    const statRss = document.querySelector('#stat-rss .value');
    const wpSiteUrl = document.querySelector('#wp-site-url');
    const schedulerStatus = document.querySelector('#scheduler-status');
    const topicInput = document.querySelector('#topic-input');
    const btnGenerate = document.querySelector('#btn-generate');
    const btnRefresh = document.querySelector('#btn-refresh');
    const postsContainer = document.querySelector('#posts-container');
    const previewModal = document.querySelector('#preview-modal');
    const previewTitle = document.querySelector('#preview-title');
    const previewBody = document.querySelector('#preview-body');
    const closeModal = document.querySelector('.close-modal');
    
    let generatedPost = null;

    // Load Initial Data
    fetchStats();
    fetchPosts();
    fetchConfig();

    // Event Listeners
    btnGenerate.addEventListener('click', handleGenerate);
    btnRefresh.addEventListener('click', fetchPosts);
    closeModal.addEventListener('click', () => previewModal.style.display = 'none');

    // Functions
    async function fetchStats() {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            statTotal.textContent = data.total;
            statAi.textContent = data.bySource.ai || 0;
            statRss.textContent = data.bySource.rss || 0;
        } catch (err) {
            console.error('Stats fetch failed:', err);
        }
    }

    async function fetchPosts() {
        postsContainer.innerHTML = '<div class="loading-state">Loading posts...</div>';
        try {
            const res = await fetch('/api/posts?limit=12');
            const posts = await res.json();
            
            if (posts.length === 0) {
                postsContainer.innerHTML = '<div class="loading-state">발행된 글이 없습니다.</div>';
                return;
            }

            postsContainer.innerHTML = '';
            posts.forEach(post => {
                const card = document.createElement('div');
                card.className = 'post-card glass';
                card.innerHTML = `
                    <span class="tag">${post.source.toUpperCase()}</span>
                    <h3>${post.title}</h3>
                    <div class="meta">
                        <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                        <span>${post.status}</span>
                    </div>
                `;
                card.onclick = () => showPreview(post);
                postsContainer.appendChild(card);
            });
        } catch (err) {
            console.error('Posts fetch failed:', err);
        }
    }

    async function fetchConfig() {
        try {
            const res = await fetch('/health');
            const data = await res.json();
            wpSiteUrl.textContent = `Site: ${data.config.wordpress}`;
            if (data.config.schedulerEnabled) {
                schedulerStatus.classList.add('active');
                schedulerStatus.innerHTML = '<i class="fa-solid fa-clock"></i> Scheduler: ON';
                schedulerStatus.style.background = 'rgba(34, 197, 94, 0.2)';
                schedulerStatus.style.color = '#4ade80';
            }
        } catch (err) {
            console.error('Config fetch failed:', err);
        }
    }

    async function handleGenerate() {
        const topic = topicInput.value.trim();
        if (!topic) {
            alert('주제를 입력해 주세요!');
            return;
        }

        const btnText = btnGenerate.querySelector('.btn-text');
        const loader = btnGenerate.querySelector('.loader');

        btnText.style.display = 'none';
        loader.style.display = 'block';
        btnGenerate.disabled = true;

        try {
            const res = await fetch('/api/publish/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, publish: false })
            });
            const data = await res.json();

            if (data.success) {
                generatedPost = data.post;
                showPreview(data.post);
                topicInput.value = '';
            } else {
                alert('글 생성 실패: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            alert('오류 발생: ' + err.message);
        } finally {
            btnText.style.display = 'block';
            loader.style.display = 'none';
            btnGenerate.disabled = false;
        }
    }

    function showPreview(post) {
        previewTitle.textContent = post.title;
        previewBody.innerHTML = post.content;
        previewModal.style.display = 'flex';
    }
});
