document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = '/api.php';
    
    // Инициализация UI
    initializeUI();
    
    // Обработчики кнопок
    document.getElementById('random-topic').addEventListener('click', function() {
        startRandomQuiz();
    });
    
    document.getElementById('choose-topic').addEventListener('click', function() {
        window.location.href = 'topics.html';
    });
    
    document.getElementById('statistics').addEventListener('click', function() {
        showStatistics();
    });
    
    document.getElementById('login-btn').addEventListener('click', function() {
        window.location.href = 'login.html';
    });
    
    document.getElementById('editor-btn').addEventListener('click', function() {
        window.location.href = 'editor.html';
    });
    
    // Функция инициализации UI
    function initializeUI() {
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        
        if (userData) {
            // Пользователь авторизован
            document.getElementById('login-btn').style.display = 'none';
            document.getElementById('username-display').style.display = 'inline-flex';
            document.getElementById('user-avatar').style.display = 'block';
            
            document.getElementById('username-display').textContent = userData.username;
            
            // Устанавливаем аватар
            if (userData.avatar && userData.avatar.startsWith('data:image')) {
                document.getElementById('avatar-img').src = userData.avatar;
            } else if (userData.avatar) {
                document.getElementById('avatar-img').src = userData.avatar;
            } else {
                document.getElementById('avatar-img').src = 'https://i.pravatar.cc/50?img=12';
            }
            
            // Проверка роли администратора
            if (userData.role === 1 || userData.role === '1') { // 1 = администратор
                document.getElementById('editor-section').style.display = 'block';
            } else {
                document.getElementById('editor-section').style.display = 'none';
            }
        } else {
            // Пользователь не авторизован
            document.getElementById('login-btn').style.display = 'inline-block';
            document.getElementById('username-display').style.display = 'none';
            document.getElementById('user-avatar').style.display = 'none';
            document.getElementById('editor-section').style.display = 'none';
        }
    }
    
    // Функция для старта викторины со случайной темой
    async function startRandomQuiz() {
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        if (!userData) {
            showNotification('Для начала викторины необходимо войти в систему', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
            return;
        }
        
        try {
            const response = await fetch('api.php?action=topics');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.success && data.topics && data.topics.length > 0) {
                const randomTopic = data.topics[Math.floor(Math.random() * data.topics.length)];
                localStorage.setItem('selectedTopic', JSON.stringify(randomTopic));
                window.location.href = `quiz.html?topic_id=${randomTopic.id}`;
            } else {
                showNotification('Темы викторины не найдены. Пожалуйста, попробуйте позже.', 'error');
            }
        } catch (error) {
            console.error('Ошибка при загрузке тем:', error);
            showNotification('Ошибка при загрузке тем викторины. Проверьте подключение к серверу.', 'error');
        }
    }
    
    // Функция для отображения статистики
    async function showStatistics() {
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        if (!userData) {
            showNotification('Для просмотра статистики необходимо войти в систему', 'error');
            window.location.href = 'login.html';
            return;
        }
        
        try {
            window.location.href = 'statistics.html';
        } catch (error) {
            console.error('Ошибка при переходе к статистике:', error);
            showNotification('Не удалось загрузить страницу статистики', 'error');
        }
    }
    
    // Функция выхода
    function logoutUser() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('currentUser');
            showNotification('Вы вышли из системы', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
    
    // Добавляем обработчик клика на имя пользователя для перехода в профиль
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'profile.html';
        });
    }
    
    // Добавляем обработчик клика на аватар для перехода в профиль
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) {
        userAvatar.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'profile.html';
        });
    }
    
    // Функция для отображения уведомлений
    function showNotification(message, type = 'info') {
        // Удаляем старое уведомление, если есть
        const oldNotification = document.querySelector('.notification');
        if (oldNotification) {
            oldNotification.remove();
        }
        
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.5s ease, fadeOut 0.5s ease 2.5s forwards;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            max-width: 350px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, rgba(0, 255, 136, 0.9) 0%, rgba(0, 204, 119, 0.9) 100%)';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, rgba(255, 68, 68, 0.9) 0%, rgba(204, 51, 51, 0.9) 100%)';
        } else {
            notification.style.background = 'linear-gradient(135deg, rgba(255, 81, 125, 0.9) 0%, rgba(255, 107, 147, 0.9) 100%)';
        }
        
        document.body.appendChild(notification);
        
        // Автоматическое удаление через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
});