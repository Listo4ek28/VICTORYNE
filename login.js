document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = '/api.php'; // или 'api.php' если файлы в одной папке
    const form = document.getElementById('login-form');
    const backBtn = document.getElementById('back-btn');
    const resultDiv = document.getElementById('login-result');
    const resultText = document.getElementById('result-text');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!username || !password) {
            showResult('Пожалуйста, заполните все поля', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            // Получаем данные независимо от статуса ответа
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                showResult('Вход выполнен успешно! Перенаправляем...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                // Показываем ошибку от сервера, если есть
                showResult(data.error || 'Ошибка входа. Проверьте логин и пароль.', 'error');
            }
        } catch (error) {
            console.error('Ошибка при входе:', error);
            
            // Проверяем, является ли ошибка ошибкой парсинга JSON
            if (error instanceof SyntaxError) {
                showResult('Ошибка формата данных от сервера', 'error');
            } else {
                showResult('Ошибка соединения с сервером. Проверьте консоль для подробностей.', 'error');
            }
        }
    });
    
    function showResult(message, type) {
        resultText.textContent = message;
        resultDiv.style.display = 'block';
        resultDiv.className = type === 'success' ? 'success' : 'error';
    }
    
    backBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
});