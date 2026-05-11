document.addEventListener('DOMContentLoaded', function() {
    console.log('Editor.js загружен'); // Отладочное сообщение
    
    const API_BASE = '/api.php';
    let currentUser = null;
    
    // Проверка авторизации и прав
    checkAdminAccess();
    initializeEditor();
    
    async function checkAdminAccess() {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser) {
            showResult('Доступ запрещен. Пожалуйста, войдите в систему.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }
        
        if (currentUser.role !== 1 && currentUser.role !== '1') {
            showResult('Доступ к редактору только для администраторов.', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
        
        // Загружаем аватар
        if (currentUser.avatar) {
            document.getElementById('avatar-img').src = currentUser.avatar;
        }
    }
    
    function initializeEditor() {
        console.log('Инициализация редактора...');
        
        // Загружаем темы для выпадающих списков
        loadTopics();
        
        // Инициализируем начальные варианты ответов ПЕРВЫМ ДЕЛОМ
        initializeAnswerFields();
        
        // Обработчики вкладок
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Убираем активный класс у всех кнопок и вкладок
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Добавляем активный класс текущей кнопке
                this.classList.add('active');
                
                // Показываем соответствующую вкладку
                const tabId = this.id.replace('tab-', '') + '-tab';
                console.log('Переключение на вкладку:', tabId);
                document.getElementById(tabId).classList.add('active');
                
                // Загружаем контент при переключении
                if (this.id === 'tab-manage-topics') {
                    loadTopicsList();
                } else if (this.id === 'tab-manage-questions') {
                    loadQuestions();
                }
            });
        });
        
        // Кнопки сложности
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('question-difficulty').value = this.dataset.value;
                console.log('Установлена сложность:', this.dataset.value);
            });
        });
        
        // Добавление варианта ответа
        document.getElementById('add-answer-btn').addEventListener('click', function() {
            console.log('Добавление варианта ответа...');
            addAnswerField();
        });
        
        // Форма вопроса
        document.getElementById('question-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveQuestion();
        });
        
        // Форма темы
        document.getElementById('topic-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveTopic();
        });
        
        // Кнопка очистки формы
        document.getElementById('clear-form-btn').addEventListener('click', function() {
            console.log('Очистка формы...');
            clearQuestionForm();
        });
        
        // Загрузка вопросов
        document.getElementById('load-questions-btn').addEventListener('click', function() {
            console.log('Загрузка вопросов...');
            loadQuestions();
        });
        
        // Обновление списка тем
        document.getElementById('refresh-topics-btn').addEventListener('click', function() {
            console.log('Обновление списка тем...');
            loadTopicsList();
        });
        
        // Поиск тем
        document.getElementById('search-topic').addEventListener('input', function() {
            filterTopics(this.value);
        });
        
        // Фильтр тем
        document.getElementById('filter-topic').addEventListener('change', function() {
            console.log('Изменен фильтр темы:', this.value);
            loadQuestions();
        });
        
        // Кнопка назад
        document.getElementById('back-btn').addEventListener('click', function() {
            window.location.href = 'index.html';
        });
        
        console.log('Редактор инициализирован');
    }
    
    function initializeAnswerFields() {
        console.log('Инициализация полей ответов...');
        const container = document.getElementById('answers-container');
        
        if (!container) {
            console.error('Контейнер answers-container не найден!');
            return;
        }
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        // Создаем 2 начальных варианта ответа
        for (let i = 0; i < 2; i++) {
            createAnswerField(i);
        }
        
        console.log('Создано', container.children.length, 'начальных вариантов ответа');
    }
    
    function createAnswerField(index) {
        const container = document.getElementById('answers-container');
        
        const answerItem = document.createElement('div');
        answerItem.className = 'answer-item';
        answerItem.dataset.index = index;
        
        answerItem.innerHTML = `
            <div class="answer-footer">
                <input type="text" class="answer-text" placeholder="Введите текст варианта ответа" required>
            </div>
            <p></p>
            <div class="answer-footer">
                <label class="correct-checkbox">
                    <input type="radio" name="correct_answer" value="${index}" ${index === 0 ? 'checked' : ''}>
                    <span>Правильный ответ</span>
                </label>
                <button type="button" class="remove-answer">✕ Удалить</button>
            </div>
        `;
        
        // Добавляем обработчик для кнопки удаления
        const removeBtn = answerItem.querySelector('.remove-answer');
        removeBtn.addEventListener('click', function() {
            removeAnswerField(this);
        });
        
        container.appendChild(answerItem);
        return answerItem;
    }
    
    function addAnswerField() {
        const container = document.getElementById('answers-container');
        const answerCount = container.children.length;
        
        if (answerCount >= 6) {
            showResult('Максимум 6 вариантов ответа', 'error');
            return;
        }
        
        createAnswerField(answerCount);
        console.log('Добавлен вариант ответа #', answerCount);
    }
    
    function removeAnswerField(button) {
        const container = document.getElementById('answers-container');
        
        if (container.children.length <= 2) {
            showResult('Минимум 2 варианта ответа', 'error');
            return;
        }
        
        const answerItem = button.closest('.answer-item');
        const index = parseInt(answerItem.dataset.index);
        const isChecked = answerItem.querySelector('input[type="radio"]').checked;
        
        console.log('Удаление варианта ответа #', index, 'checked:', isChecked);
        
        // Удаляем элемент
        container.removeChild(answerItem);
        
        // Обновляем индексы и значения radio кнопок
        Array.from(container.children).forEach((item, i) => {
            item.dataset.index = i;
            const radio = item.querySelector('input[type="radio"]');
            radio.value = i;
            
            // Если удалили выбранный вариант, выбираем первый
            if (isChecked && i === 0) {
                radio.checked = true;
            }
        });
        
        console.log('Осталось вариантов:', container.children.length);
    }
    
    async function loadTopics() {
        try {
            console.log('Загрузка тем...');
            const response = await fetch(`${API_BASE}?action=topics`);
            const data = await response.json();
            
            if (data.success && data.topics) {
                // Заполняем выпадающий список для выбора темы
                const topicSelect = document.getElementById('question-topic');
                const filterSelect = document.getElementById('filter-topic');
                
                topicSelect.innerHTML = '<option value="">Выберите тему</option>';
                filterSelect.innerHTML = '<option value="">Все темы</option>';
                
                data.topics.forEach(topic => {
                    const option = document.createElement('option');
                    option.value = topic.id;
                    option.textContent = `${topic.icon || '📚'} ${topic.name || topic.naming}`;
                    
                    topicSelect.appendChild(option.cloneNode(true));
                    filterSelect.appendChild(option);
                });
                
                console.log('Загружено тем:', data.topics.length);
            }
        } catch (error) {
            console.error('Ошибка загрузки тем:', error);
            showResult('Ошибка загрузки тем', 'error');
        }
    }
    
    async function loadTopicsList() {
        try {
            console.log('Загрузка списка тем для управления...');
            const response = await fetch(`${API_BASE}?action=topics`);
            const data = await response.json();
            
            if (data.success && data.topics) {
                const container = document.getElementById('topics-list-container');
                container.innerHTML = '';
                
                if (data.topics.length === 0) {
                    container.innerHTML = '<p style="color: var(--beta-text-secondary); text-align: center; padding: 20px;">Темы не найдены</p>';
                    return;
                }
                
                data.topics.forEach(topic => {
                    const topicCard = document.createElement('div');
                    topicCard.className = 'topic-card';
                    topicCard.innerHTML = `
                        <div class="topic-card-header">
                            <span class="topic-icon">${topic.icon || '📚'}</span>
                            <span class="topic-name">${topic.name || topic.naming}</span>
                            <span class="topic-id">ID: ${topic.id}</span>
                        </div>
                        <div class="topic-card-body">
                            <p class="topic-description">${topic.description || 'Нет описания'}</p>
                            <div class="topic-stats">
                                <span class="topic-stat">Вопросов: <span id="question-count-${topic.id}">Загрузка...</span></span>
                            </div>
                        </div>
                        <div class="topic-card-actions">
                            <button class="delete-topic-btn" data-id="${topic.id}" data-name="${topic.name || topic.naming}">
                                🗑️ Удалить тему
                            </button>
                        </div>
                    `;
                    container.appendChild(topicCard);
                    
                    // Загружаем количество вопросов для темы
                    loadQuestionCount(topic.id);
                });
                
                // Добавляем обработчики для кнопок удаления тем
                document.querySelectorAll('.delete-topic-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const topicId = this.dataset.id;
                        const topicName = this.dataset.name;
                        deleteTopicWithConfirmation(topicId, topicName);
                    });
                });
                
                console.log('Загружено тем для управления:', data.topics.length);
            }
        } catch (error) {
            console.error('Ошибка загрузки списка тем:', error);
            showResult('Ошибка загрузки списка тем', 'error');
        }
    }
    
    function filterTopics(searchTerm) {
        const container = document.getElementById('topics-list-container');
        const topicCards = container.querySelectorAll('.topic-card');
        
        if (!searchTerm) {
            // Показываем все темы, если поиск пустой
            topicCards.forEach(card => {
                card.style.display = 'block';
            });
            return;
        }
        
        const searchLower = searchTerm.toLowerCase();
        let visibleCount = 0;
        
        topicCards.forEach(card => {
            const topicName = card.querySelector('.topic-name').textContent.toLowerCase();
            const topicDescription = card.querySelector('.topic-description').textContent.toLowerCase();
            
            if (topicName.includes(searchLower) || topicDescription.includes(searchLower)) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Показываем сообщение, если ничего не найдено
        if (visibleCount === 0) {
            const noResults = document.createElement('p');
            noResults.style.color = 'var(--beta-text-secondary)';
            noResults.style.textAlign = 'center';
            noResults.style.padding = '20px';
            noResults.textContent = `Темы по запросу "${searchTerm}" не найдены`;
            
            // Удаляем старое сообщение, если есть
            const oldMessage = container.querySelector('.no-results-message');
            if (oldMessage) oldMessage.remove();
            
            noResults.className = 'no-results-message';
            container.appendChild(noResults);
        } else {
            // Удаляем сообщение "не найдено", если есть
            const oldMessage = container.querySelector('.no-results-message');
            if (oldMessage) oldMessage.remove();
        }
    }
    
    async function loadQuestionCount(topicId) {
        try {
            const response = await fetch(`${API_BASE}?action=questions&topic_id=${topicId}&limit=1`);
            const data = await response.json();
            
            const countElement = document.getElementById(`question-count-${topicId}`);
            if (countElement && data.questions) {
                // Чтобы получить точное количество, нужно загрузить все вопросы
                const fullResponse = await fetch(`${API_BASE}?action=questions&topic_id=${topicId}&limit=1000`);
                const fullData = await fullResponse.json();
                
                if (fullData.questions) {
                    countElement.textContent = fullData.questions.length;
                } else {
                    countElement.textContent = '0';
                }
            } else if (countElement) {
                countElement.textContent = '0';
            }
        } catch (error) {
            console.error('Ошибка загрузки количества вопросов:', error);
            const countElement = document.getElementById(`question-count-${topicId}`);
            if (countElement) {
                countElement.textContent = '?';
            }
        }
    }
    
    async function saveQuestion() {
        console.log('Сохранение вопроса...');
        
        const topicSelect = document.getElementById('question-topic');
        const questionText = document.getElementById('question-text').value.trim();
        const difficulty = document.getElementById('question-difficulty').value;
        
        if (!topicSelect.value) {
            showResult('Выберите тему', 'error');
            return;
        }
        
        if (!questionText) {
            showResult('Введите текст вопроса', 'error');
            return;
        }
        
        // Собираем ответы
        const answerItems = document.querySelectorAll('.answer-item');
        const answers = [];
        let hasCorrect = false;
        
        answerItems.forEach((item, index) => {
            const textInput = item.querySelector('.answer-text');
            const text = textInput ? textInput.value.trim() : '';
            const radio = item.querySelector('input[type="radio"]');
            const isCorrect = radio ? radio.checked : false;
            
            if (!text) {
                showResult(`Заполните текст ответа #${index + 1}`, 'error');
                textInput.focus();
                throw new Error('Empty answer');
            }
            
            answers.push({
                text: text,
                is_correct: isCorrect
            });
            
            if (isCorrect) hasCorrect = true;
        });
        
        if (answers.length < 2) {
            showResult('Добавьте минимум 2 варианта ответа', 'error');
            return;
        }
        
        if (!hasCorrect) {
            showResult('Выберите правильный вариант ответа', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=add-question`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic_id: parseInt(topicSelect.value),
                    question_text: questionText,
                    difficulty: parseInt(difficulty),
                    answers: answers
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showResult(`✅ Вопрос успешно добавлен! ID: ${data.question_id}`, 'success');
                clearQuestionForm();
                // Обновляем список вопросов и счетчики
                if (document.getElementById('tab-manage-questions').classList.contains('active')) {
                    loadQuestions();
                }
                if (document.getElementById('tab-manage-topics').classList.contains('active')) {
                    loadTopicsList();
                }
            } else {
                showResult(`❌ ${data.error || 'Ошибка при сохранении вопроса'}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка сохранения вопроса:', error);
            showResult('❌ Ошибка соединения с сервером', 'error');
        }
    }
    
    function clearQuestionForm() {
        console.log('Очистка формы вопроса...');
        
        document.getElementById('question-text').value = '';
        
        if (document.getElementById('question-topic').options.length > 0) {
            document.getElementById('question-topic').selectedIndex = 0;
        }
        
        document.getElementById('question-difficulty').value = '2';
        
        // Сбрасываем кнопки сложности
        document.querySelectorAll('.difficulty-btn').forEach((btn, index) => {
            btn.classList.toggle('active', index === 1); // Средний по умолчанию
        });
        
        // Очищаем и добавляем 2 базовых варианта ответа
        const container = document.getElementById('answers-container');
        container.innerHTML = '';
        
        for (let i = 0; i < 2; i++) {
            createAnswerField(i);
        }
    }
    
    async function saveTopic() {
        const name = document.getElementById('topic-name').value.trim();
        const description = document.getElementById('topic-description').value.trim();
        const icon = document.getElementById('topic-icon').value.trim() || '📚';
        
        if (!name) {
            showResult('Введите название темы', 'error');
            return;
        }
        
        if (!description) {
            showResult('Введите описание темы', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=add-topic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    icon: icon
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showResult(`✅ Тема "${name}" успешно создана!`, 'success');
                document.getElementById('topic-form').reset();
                loadTopics(); // Обновляем выпадающие списки
                loadTopicsList(); // Обновляем список тем
                
                // Переключаемся на вкладку управления темами
                document.getElementById('tab-manage-topics').click();
            } else {
                showResult(`❌ ${data.error || 'Ошибка при создании темы'}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка сохранения темы:', error);
            showResult('❌ Ошибка соединения с сервером', 'error');
        }
    }
    
    async function loadQuestions() {
        const topicId = document.getElementById('filter-topic').value;
        let url = `${API_BASE}?action=questions`;
        
        if (topicId) {
            url += `&topic_id=${topicId}`;
        }
        
        url += `&limit=50`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success && data.questions) {
                displayQuestions(data.questions);
            } else {
                document.getElementById('questions-list').innerHTML = 
                    '<p style="color: var(--beta-text-secondary); text-align: center; padding: 30px;">Вопросы не найдены</p>';
            }
        } catch (error) {
            console.error('Ошибка загрузки вопросов:', error);
            showResult('❌ Ошибка загрузки вопросов', 'error');
        }
    }
    
    function displayQuestions(questions) {
        const container = document.getElementById('questions-list');
        
        if (questions.length === 0) {
            container.innerHTML = '<p style="color: var(--beta-text-secondary); text-align: center; padding: 30px;">Вопросы не найдены</p>';
            return;
        }
        
        let html = '<div class="questions-grid">';
        
        questions.forEach((question, index) => {
            const correctAnswer = question.answers.find(a => a.is_correct);
            const difficultyText = ['Легкий', 'Средний', 'Сложный'][question.difficulty - 1] || 'Неизвестно';
            
            html += `
                <div class="question-card">
                    <div class="question-header">
                        <span class="question-id">#${question.id}</span>
                        <span class="question-difficulty difficulty-${question.difficulty}">${difficultyText}</span>
                    </div>
                    <p class="question-text">${question.quest_text}</p>
                    <p class="question-topic">Тема: ${question.topic_name}</p>
                    <p class="correct-answer">Правильный ответ: ${correctAnswer ? correctAnswer.answer_text : 'Не указан'}</p>
                    <div class="question-actions">
                        <button class="edit-question" data-id="${question.id}">Редактировать</button>
                        <button class="delete-question" data-id="${question.id}">🗑️ Удалить</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Добавляем обработчики для кнопок действий
        document.querySelectorAll('.edit-question').forEach(btn => {
            btn.addEventListener('click', function() {
                editQuestion(this.dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-question').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteQuestion(this.dataset.id);
            });
        });
    }
    
    function editQuestion(questionId) {
        showResult(`Редактирование вопроса #${questionId} (функция в разработке)`, 'info');
    }
    
    async function deleteQuestion(questionId) {
        if (!confirm(`Вы уверены, что хотите удалить вопрос #${questionId}? Это действие нельзя отменить.`)) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=delete-question`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question_id: parseInt(questionId)
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showResult(`✅ ${data.message}`, 'success');
                // Обновляем список вопросов и счетчики тем
                setTimeout(() => {
                    loadQuestions();
                    if (document.getElementById('tab-manage-topics').classList.contains('active')) {
                        loadTopicsList();
                    }
                }, 1000);
            } else {
                showResult(`❌ Ошибка: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления вопроса:', error);
            showResult('❌ Ошибка соединения с сервером', 'error');
        }
    }
    
    async function deleteTopicWithConfirmation(topicId, topicName) {
        if (!confirm(`ВНИМАНИЕ! Вы уверены, что хотите удалить тему "${topicName}"?\n\nЭто приведет к удалению:\n• Всех вопросов этой темы\n• Всех ответов на эти вопросы\n• Результатов викторин по этой теме\n\nЭто действие НЕЛЬЗЯ отменить!`)) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=delete-topic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic_id: parseInt(topicId)
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showResult(`✅ ${data.message}`, 'success');
                // Обновляем все списки
                setTimeout(() => {
                    loadTopics();
                    loadTopicsList();
                    loadQuestions();
                    // Переключаемся на вкладку управления темами
                    document.getElementById('tab-manage-topics').click();
                }, 1500);
            } else {
                showResult(`❌ Ошибка: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления темы:', error);
            showResult('❌ Ошибка соединения с сервером', 'error');
        }
    }
    
    function showResult(message, type) {
        const resultDiv = document.getElementById('editor-result');
        const resultText = document.getElementById('result-text');
        
        if (!resultDiv || !resultText) {
            console.error('Элементы результата не найдены');
            return;
        }
        
        resultText.textContent = message;
        resultDiv.className = type;
        resultDiv.style.display = 'block';
        
        // Прокручиваем к результату
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 5000);
    }
    
    // Глобальная функция для отладки (можно удалить после тестирования)
    window.debugEditor = function() {
        console.log('=== DEBUG EDITOR ===');
        console.log('User:', currentUser);
        console.log('Answer container:', document.getElementById('answers-container'));
        console.log('Answer items:', document.querySelectorAll('.answer-item').length);
        console.log('====================');
    };
});