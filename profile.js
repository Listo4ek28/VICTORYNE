document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = '/api.php';
    
    // Элементы DOM
    const backToMainBtn = document.getElementById('back-to-main-btn');
    const profileAvatar = document.getElementById('profile-avatar');
    const usernameValue = document.getElementById('username-value');
    const phoneValue = document.getElementById('phone-value');
    const regDateValue = document.getElementById('reg-date-value');
    const roleValue = document.getElementById('role-value');
    const logoutBtn = document.getElementById('logout-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const editUsernameBtn = document.getElementById('edit-username-btn');
    const usernameDisplaySection = document.getElementById('username-display-section');
    const usernameEditSection = document.getElementById('username-edit-section');
    const newUsernameInput = document.getElementById('new-username-input');
    const saveUsernameBtn = document.getElementById('save-username-btn');
    const cancelUsernameBtn = document.getElementById('cancel-username-btn');
    const editAvatarBtn = document.getElementById('edit-avatar-btn');
	const avatarEditSection = document.getElementById('avatar-edit-section');
	const avatarFileInput = document.getElementById('avatar-file-input');
	const avatarPreviewContainer = document.getElementById('avatar-preview-container');
	const avatarPreview = document.getElementById('avatar-preview');
	const saveAvatarBtn = document.getElementById('save-avatar-btn');
	const cancelAvatarBtn = document.getElementById('cancel-avatar-btn');
    
    // Текущий пользователь
    let currentUser = null;
    
    // Инициализация страницы
    initProfilePage();
    
    // Обработчики событий
    backToMainBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
    });
    
    logoutBtn.addEventListener('click', handleLogout);
    deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    editUsernameBtn.addEventListener('click', showUsernameEdit);
    saveUsernameBtn.addEventListener('click', handleSaveUsername);
    cancelUsernameBtn.addEventListener('click', hideUsernameEdit);
    editAvatarBtn.addEventListener('click', showAvatarEdit);
	saveAvatarBtn.addEventListener('click', handleSaveAvatar);
	cancelAvatarBtn.addEventListener('click', hideAvatarEdit);
	avatarFileInput.addEventListener('change', handleAvatarFileSelect);
    
    // Функция инициализации страницы профиля
    function initProfilePage() {
        // Получаем данные пользователя из localStorage
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser) {
            // Если пользователь не авторизован, перенаправляем на главную
            showNotification('Для просмотра профиля необходимо войти в систему', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return;
        }
        
        // Загружаем полные данные пользователя с сервера
        loadUserDataFromServer();
    }
    
    // Функция загрузки данных пользователя с сервера
    async function loadUserDataFromServer() {
        try {
            // Получаем полные данные пользователя
            const response = await fetch(`${API_BASE}?action=get-user-data&user_id=${currentUser.id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Обновляем данные пользователя
                currentUser = { ...currentUser, ...data.user };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Заполняем данные профиля
                fillProfileData();
            } else {
                // Если не удалось загрузить с сервера, используем данные из localStorage
                fillProfileData();
                showNotification('Не удалось загрузить полные данные профиля', 'info');
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных пользователя:', error);
            // Используем данные из localStorage
            fillProfileData();
            showNotification('Ошибка подключения к серверу', 'error');
        }
    }
    
    // Функция заполнения данных профиля
    function fillProfileData() {
	    // Устанавливаем аватар
	    if (currentUser.avatar && currentUser.avatar.startsWith('data:image')) {
	        profileAvatar.src = currentUser.avatar;
	    } else if (currentUser.avatar && currentUser.avatar !== 'img/default_avatar.jpg') {
	        profileAvatar.src = currentUser.avatar;
	    } else {
	        profileAvatar.src = 'img/default_avatar.jpg';
	    }
	    
	    // Устанавливаем имя пользователя
	    usernameValue.textContent = currentUser.username;
	    
	    // Устанавливаем телефон
	    phoneValue.textContent = currentUser.phone || 'Не указан';
	    
	    // Устанавливаем дату регистрации
	    if (currentUser.reg_date) {
	        regDateValue.textContent = formatDate(currentUser.reg_date);
	    } else {
	        regDateValue.textContent = 'Не указана';
	    }
	    
	    // Устанавливаем роль (если есть)
	    if (currentUser.role !== undefined) {
	        const roleText = currentUser.role === 1 ? 'Администратор' : 'Пользователь';
	        roleValue.textContent = roleText;
	        
	        // Добавляем стиль для роли администратора
	        if (currentUser.role === 1) {
	            roleValue.style.color = 'var(--beta-accent)';
	            roleValue.style.fontWeight = '600';
	        }
	    } else {
	        roleValue.textContent = 'Не указана';
	    }
	}
    
    // Функция выхода из системы
    function handleLogout() {
        if (confirm('Вы уверены, что хотите выйти из системы?')) {
            localStorage.removeItem('currentUser');
            showNotification('Вы успешно вышли из системы', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    }
    
    // Функция удаления аккаунта
    function handleDeleteAccount() {
        if (!confirm('ВНИМАНИЕ: Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо и удалит всю вашу статистику и данные.')) {
            return;
        }
        
        // Показываем дополнительное подтверждение
        const password = prompt('Для подтверждения удаления аккаунта введите ваш пароль:');
        
        if (!password) {
            showNotification('Удаление аккаунта отменено', 'info');
            return;
        }
        
        // Отправляем запрос на удаление аккаунта
        deleteAccount(password);
    }
    
    // Функция отправки запроса на удаление аккаунта
    async function deleteAccount(password) {
        try {
            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete-account',
                    user_id: currentUser.id,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.removeItem('currentUser');
                showNotification('Аккаунт успешно удален', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showNotification(data.error || 'Ошибка при удалении аккаунта', 'error');
            }
            
        } catch (error) {
            console.error('Ошибка при удалении аккаунта:', error);
            showNotification('Ошибка при удалении аккаунта. Проверьте подключение к серверу.', 'error');
        }
    }
    
    // Функция показа формы редактирования имени пользователя
    function showUsernameEdit() {
        usernameDisplaySection.style.display = 'none';
        usernameEditSection.style.display = 'flex';
        newUsernameInput.value = currentUser.username;
        newUsernameInput.focus();
    }
    
    // Функция скрытия формы редактирования имени пользователя
    function hideUsernameEdit() {
        usernameDisplaySection.style.display = 'flex';
        usernameEditSection.style.display = 'none';
        newUsernameInput.value = '';
    }
    
    // Функция сохранения нового имени пользователя
    async function handleSaveUsername() {
        const newUsername = newUsernameInput.value.trim();
        
        if (!newUsername) {
            showNotification('Имя пользователя не может быть пустым', 'error');
            return;
        }
        
        if (newUsername === currentUser.username) {
            showNotification('Имя пользователя не изменилось', 'info');
            hideUsernameEdit();
            return;
        }
        
        if (newUsername.length < 3) {
            showNotification('Имя пользователя должно быть не менее 3 символов', 'error');
            return;
        }
        
        if (newUsername.length > 32) {
            showNotification('Имя пользователя должно быть не более 32 символов', 'error');
            return;
        }
        
        try {
            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update-username',
                    user_id: currentUser.id,
                    new_username: newUsername
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentUser.username = newUsername;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                usernameValue.textContent = newUsername;
                showNotification('Имя пользователя успешно обновлено', 'success');
                hideUsernameEdit();
            } else {
                showNotification(data.error || 'Ошибка при обновлении имени пользователя', 'error');
            }
            
        } catch (error) {
            console.error('Ошибка при обновлении имени пользователя:', error);
            showNotification('Ошибка при обновлении имени пользователя. Проверьте подключение к серверу.', 'error');
        }
    }
    
    // Вспомогательные функции
    function formatDate(dateString) {
        if (!dateString) return 'Не указана';
        
        try {
            const date = new Date(dateString);
            
            // Проверяем, что дата валидна
            if (isNaN(date.getTime())) {
                return dateString;
            }
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}.${month}.${year}`;
        } catch (e) {
            return dateString;
        }
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
    
    function showAvatarEdit() {
	    avatarEditSection.style.display = 'block';
	    avatarPreviewContainer.style.display = 'none';
	    avatarFileInput.value = '';
	}

	// Функция скрытия формы редактирования аватара
	function hideAvatarEdit() {
	    avatarEditSection.style.display = 'none';
	    avatarPreviewContainer.style.display = 'none';
	    avatarFileInput.value = '';
	}

	// Функция обработки выбора файла аватара
	function handleAvatarFileSelect(event) {
	    const file = event.target.files[0];
	    
	    if (!file) {
	        avatarPreviewContainer.style.display = 'none';
	        return;
	    }
	    
	    // Проверяем тип файла
	    if (!file.type.match('image.*')) {
	        showNotification('Пожалуйста, выберите файл изображения', 'error');
	        avatarFileInput.value = '';
	        avatarPreviewContainer.style.display = 'none';
	        return;
	    }
	    
	    // Проверяем размер файла (максимум 5MB)
	    if (file.size > 5 * 1024 * 1024) {
	        showNotification('Размер файла не должен превышать 5MB', 'error');
	        avatarFileInput.value = '';
	        avatarPreviewContainer.style.display = 'none';
	        return;
	    }
	    
	    // Создаем предпросмотр изображения
	    const reader = new FileReader();
	    
	    reader.onload = function(e) {
	        avatarPreview.src = e.target.result;
	        avatarPreviewContainer.style.display = 'block';
	    };
	    
	    reader.readAsDataURL(file);
	}

	// Функция сохранения нового аватара
	async function handleSaveAvatar() {
	    const file = avatarFileInput.files[0];
	    
	    if (!file) {
	        showNotification('Пожалуйста, выберите файл для загрузки', 'error');
	        return;
	    }
	    
	    try {
	        // Конвертируем файл в base64
	        const reader = new FileReader();
	        
	        reader.onload = async function(e) {
	            const base64Image = e.target.result;
	            
	            try {
	                // Показываем индикатор загрузки
	                saveAvatarBtn.disabled = true;
	                saveAvatarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
	                
	                // Отправляем запрос на обновление аватара
	                const response = await fetch(API_BASE, {
	                    method: 'POST',
	                    headers: {
	                        'Content-Type': 'application/json',
	                    },
	                    body: JSON.stringify({
	                        action: 'update-avatar',
	                        user_id: currentUser.id,
	                        avatar: base64Image
	                    })
	                });
	                
	                // ДЕБАГ: Проверяем ответ
	                const responseText = await response.text();
	                console.log('Response text:', responseText);
	                
	                let data;
	                try {
	                    data = JSON.parse(responseText);
	                } catch (jsonError) {
	                    console.error('JSON parse error:', jsonError, 'Response was:', responseText);
	                    showNotification('Ошибка сервера при обновлении аватара', 'error');
	                    return;
	                }
	                
	                // Восстанавливаем кнопку
	                saveAvatarBtn.disabled = false;
	                saveAvatarBtn.innerHTML = 'Сохранить аватар';
	                
	                if (data.success) {
	                    // Обновляем аватар пользователя
	                    currentUser.avatar = base64Image;
	                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
	                    
	                    // Обновляем отображение аватара
	                    profileAvatar.src = base64Image;
	                    
	                    // Скрываем форму редактирования
	                    hideAvatarEdit();
	                    
	                    showNotification('Аватар успешно обновлен', 'success');
	                } else {
	                    showNotification(data.error || 'Ошибка при обновлении аватара', 'error');
	                }
	                
	            } catch (error) {
	                console.error('Ошибка при обновлении аватара:', error);
	                
	                // Восстанавливаем кнопку
	                saveAvatarBtn.disabled = false;
	                saveAvatarBtn.innerHTML = 'Сохранить аватар';
	                
	                showNotification('Ошибка при обновлении аватара. Проверьте подключение к серверу.', 'error');
	            }
	        };
	        
	        reader.readAsDataURL(file);
	    } catch (error) {
	        console.error('Ошибка при чтении файла:', error);
	        showNotification('Ошибка при чтении файла', 'error');
	    }
	}
});

