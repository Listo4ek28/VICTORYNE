document.addEventListener('DOMContentLoaded', () => {
    const topicsContainer = document.getElementById('topics-list');
    const searchInput = document.getElementById('search-input');
    let allTopics = []; // Сохраняем все темы для фильтрации
    
    if (!topicsContainer) {
        console.error('Контейнер #topics-list не найден');
        return;
    }
    
    // Функция для отображения тем
    function displayTopics(topics) {
        topicsContainer.innerHTML = '';
        
        if (topics.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = `
                <span class="no-results-icon">🔍</span>
                <p>По вашему запросу ничего не найдено</p>
                <p style="font-size: 0.9em; margin-top: 10px;">Попробуйте изменить поисковый запрос</p>
            `;
            topicsContainer.appendChild(noResults);
            return;
        }
        
        topics.forEach(topic => {
            const btn = document.createElement('button');
            btn.className = 'topic-button';
            btn.innerHTML = `
                <span class="topic-icon">${topic.icon || '📚'}</span>
                <span class="topic-name">${topic.name || topic.naming}</span>
            `;
            
            btn.addEventListener('click', () => {
                window.location.href = `quiz.html?topic_id=${topic.id}`;
            });
            
            topicsContainer.appendChild(btn);
        });
    }
    
    // Функция для фильтрации тем
    function filterTopics(searchTerm) {
        if (!searchTerm.trim()) {
            displayTopics(allTopics);
            return;
        }
        
        const filtered = allTopics.filter(topic => {
            const topicName = (topic.name || topic.naming || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            
            // Ищем в названии темы
            if (topicName.includes(searchLower)) {
                return true;
            }
            
            // Также можно добавить поиск по описанию, если оно есть
            if (topic.description) {
                return topic.description.toLowerCase().includes(searchLower);
            }
            
            return false;
        });
        
        displayTopics(filtered);
    }
    
    // Загрузка тем с сервера
    fetch('api.php?action=topics')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Topics data:', data);
            
            if (data.success && data.topics && data.topics.length > 0) {
                allTopics = data.topics;
                displayTopics(allTopics);
            } else {
                topicsContainer.innerHTML = '<p style="color: var(--beta-text-secondary); text-align: center;">Темы не найдены</p>';
                console.error('No topics in response:', data);
            }
        })
        .catch(err => {
            console.error('Ошибка загрузки тем:', err);
            topicsContainer.innerHTML = `
                <div class="no-results">
                    <span class="no-results-icon">⚠️</span>
                    <p>Не удалось загрузить темы</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">Проверьте подключение к серверу</p>
                </div>
            `;
        });
    
    // Обработчик поиска
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTopics(e.target.value);
        });
        
        // Очистка поиска при нажатии Esc
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                filterTopics('');
                searchInput.blur();
            }
        });
    }
    
    // Кнопка назад
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
});