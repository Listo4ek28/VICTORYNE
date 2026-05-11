document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'api.php';
    const form = document.getElementById('register-form');
    const avatarFileInput = document.getElementById('avatar-file-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const previewImage = document.getElementById('preview-image');
    const backBtn = document.getElementById('back-btn');
    const resultDiv = document.getElementById('registration-result');
    const resultText = document.getElementById('result-text');
    const phoneInput = document.getElementById('phone');
    
    // Обработка ввода телефона
    phoneInput.addEventListener('input', handlePhoneInput);
    phoneInput.addEventListener('keydown', handlePhoneKeydown);
    phoneInput.addEventListener('focus', handlePhoneFocus);
    
    // Обработка загрузки файла аватара
    avatarFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Проверяем размер файла (макс. 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showResult('Размер файла не должен превышать 5MB', 'error');
                this.value = '';
                return;
            }
            
            // Проверяем тип файла
            if (!file.type.startsWith('image/')) {
                showResult('Пожалуйста, выберите изображение', 'error');
                this.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                avatarPreview.querySelector('p').textContent = 'Выбранный аватар';
            };
            reader.readAsDataURL(file);
        } else {
            // Если файл не выбран, показываем стандартный аватар
            previewImage.src = 'img/default_avatar.jpg';
            avatarPreview.querySelector('p').textContent = 'Текущий аватар (стандартный)';
        }
    });
    
    // Обработка отправки формы
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Добавляем анимацию нажатия
        const submitBtn = document.getElementById('register-btn');
        submitBtn.classList.add('pulse');
        submitBtn.innerHTML = '<span class="spinner"></span> Создание аккаунта...';
        submitBtn.disabled = true;
        
        const username = document.getElementById('username').value.trim();
        const phone = phoneInput.value;
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();
        
        // Валидация
        let hasError = false;
        
        if (!username || !phone || !password || !confirmPassword) {
            showResult('Пожалуйста, заполните все обязательные поля', 'error');
            hasError = true;
        }
        
        if (password !== confirmPassword) {
            showResult('Пароли не совпадают', 'error');
            hasError = true;
        }
        
        // Валидация пароля
        if (password.length < 4 || password.length > 16) {
            showResult('Пароль должен содержать от 4 до 16 символов', 'error');
            hasError = true;
        }

        // Проверка на запрещенные символы
        const forbiddenChars = /[*&{}|+]/;
        if (forbiddenChars.test(password)) {
            showResult('Пароль не должен содержать символы: * & { } | +', 'error');
            hasError = true;
        }

        // Проверка на наличие заглавных букв (латинских и кириллических)
        if (!/[A-ZА-Я]/.test(password)) {
            showResult('Пароль должен содержать хотя бы одну заглавную букву', 'error');
            hasError = true;
        }

        // Проверка на наличие цифр
        if (!/\d/.test(password)) {
            showResult('Пароль должен содержать хотя бы одну цифру', 'error');
            hasError = true;
        }

        // Проверка на кириллические символы (опционально, для совместимости)
        if (/[а-яА-Я]/.test(password)) {
            console.log('В пароле используются кириллические символы');
        }
        
        // Валидация телефона
        const cleanedPhone = phone.replace(/[^\d]/g, '');
        
        // Проверяем общую длину (должно быть 11 цифр с кодом страны)
        if (cleanedPhone.length !== 11) {
            showResult('Номер телефона должен содержать 11 цифр (включая код страны)', 'error');
            hasError = true;
        }
        
        // Проверяем, что номер начинается с 7 (код России)
        if (!cleanedPhone.startsWith('7')) {
            showResult('Номер телефона должен начинаться с 7 (код России)', 'error');
            hasError = true;
        }
        
        if (hasError) {
            submitBtn.innerHTML = 'Создать аккаунт';
            submitBtn.disabled = false;
            submitBtn.classList.remove('pulse');
            return;
        }
        
        // Определение аватара
        let avatar = null;
        
        try {
            if (avatarFileInput.files[0]) {
                avatar = await convertFileToBase64(avatarFileInput.files[0]);
            } else {
                // Если аватар не выбран, используем null (в базе будет стандартный)
                avatar = null;
            }
            
            // Форматируем телефон для отправки (+7 в начале)
            const formattedPhone = '+7' + cleanedPhone.substring(1);
            
            // Отправка данных на сервер
            const response = await fetch(`${API_BASE}?action=register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    phone: formattedPhone, // отправляем номер с +7
                    password: password,
                    avatar: avatar  // может быть null или base64
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Сохранение пользователя в localStorage
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                
                showResult('✅ Аккаунт успешно создан! Вы будете перенаправлены на главную страницу...', 'success');
                
                // Перенаправление через 2 секунды
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showResult(`❌ ${data.error || 'Ошибка создания аккаунта'}`, 'error');
                submitBtn.innerHTML = 'Создать аккаунт';
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            showResult('❌ Ошибка соединения с сервером.', 'error');
            submitBtn.innerHTML = 'Создать аккаунт';
            submitBtn.disabled = false;
        } finally {
            submitBtn.classList.remove('pulse');
        }
    });
    
    // Функции для работы с вводом телефона
    function handlePhoneInput(e) {
        const input = e.target;
        let value = input.value;
        
        // Убираем все нецифровые символы
        const digitsOnly = value.replace(/[^\d]/g, '');
        
        // Если введено больше 11 цифр, обрезаем
        const limitedDigits = digitsOnly.substring(0, 11);
        
        // Обновляем значение поля
        input.value = limitedDigits;
        
        // Показываем форматированный номер при вводе (опционально)
        formatPhoneInput(input, limitedDigits);
        
        // Ставим курсор в конец
        setTimeout(() => {
            input.setSelectionRange(input.value.length, input.value.length);
        }, 0);
    }
    
    function formatPhoneInput(input, digits) {
        if (digits.length === 0) {
            input.value = '';
            return;
        }
        
        // Форматируем номер: +7 (XXX) XXX-XX-XX
        let formatted = '';
        
        if (digits.length > 0) {
            formatted = '+7';
        }
        
        if (digits.length > 1) {
            formatted += ' (' + digits.substring(1, 4);
        }
        
        if (digits.length > 4) {
            formatted += ') ' + digits.substring(4, 7);
        }
        
        if (digits.length > 7) {
            formatted += '-' + digits.substring(7, 9);
        }
        
        if (digits.length > 9) {
            formatted += '-' + digits.substring(9, 11);
        }
        
        input.value = formatted;
    }
    
    function handlePhoneKeydown(e) {
        const input = e.target;
        const selectionStart = input.selectionStart;
        
        // Разрешаем навигационные клавиши
        const navKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
        if (navKeys.includes(e.key)) {
            return;
        }
        
        // Разрешаем управляющие клавиши
        const controlKeys = ['Backspace', 'Delete', 'Enter', 'Escape'];
        if (controlKeys.includes(e.key)) {
            return;
        }
        
        // Если вводится не цифра, предотвращаем ввод
        if (e.key.length === 1 && !/\d/.test(e.key)) {
            e.preventDefault();
        }
    }
    
    function handlePhoneFocus(e) {
        const input = e.target;
        // Если поле пустое, ставим курсор в начало
        if (input.value.length === 0) {
            setTimeout(() => {
                input.setSelectionRange(0, 0);
            }, 0);
        }
    }
    
    // Функция для конвертации файла в base64
    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // Функция для отображения результата
    function showResult(message, type) {
        resultText.textContent = message;
        resultDiv.className = type;
        resultDiv.style.display = 'block';
        
        // Прокручиваем к результату
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Автоматическое скрытие через 5 секунд (только для ошибок)
        if (type === 'error') {
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 5000);
        }
    }
    
    // Кнопка "Отмена"
    backBtn.addEventListener('click', function() {
        window.location.href = 'login.html';
    });
});