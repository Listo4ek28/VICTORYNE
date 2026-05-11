document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const topicId = params.get('topic_id');

    if (!topicId) {
        alert('Тема не выбрана');
        location.href = 'topics.html';
        return;
    }

    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (!userData) {
        location.href = 'login.html';
        return;
    }

    const avatarImg = document.getElementById('avatar-img');
    if (avatarImg && userData.avatar) {
        avatarImg.src = userData.avatar;
    }

    fetch('api.php?action=topics')
        .then(r => r.json())
        .then(d => {
            if (!d.success) return;
            const topic = d.topics.find(t => t.id == topicId);
            const topicName = document.getElementById('topic-name');
            if (topic && topicName) {
                topicName.textContent = topic.name;
            }
        });

    fetch(`api.php?action=questions&topic_id=${topicId}&limit=10`)
        .then(r => r.json())
        .then(d => {
            if (d.success && d.questions.length) {
                initQuiz(d.questions);
            } else {
                const qt = document.getElementById('question-text');
                if (qt) qt.innerHTML = '<p>В этой теме нет вопросов</p>';
            }
        });

    function initQuiz(questions) {
        let current = 0;
        let score = 0;
        const answersLog = [];
        let timer = null;
        let timeLeft = 0;

        const questionText = document.getElementById('question-text');
        const answersBox = document.getElementById('answers-container');
        const scoreEl = document.getElementById('score');
        const currEl = document.getElementById('current-question');
        const totalEl = document.getElementById('total-questions');
        const nextBtn = document.getElementById('next-question');
        const endBtn = document.getElementById('end-quiz');
        const msgBox = document.getElementById('save-result-message');
        const timeLeftEl = document.getElementById('time-left');

        if (totalEl) totalEl.textContent = questions.length;

        function startTimer(duration) {
            clearInterval(timer);
            timeLeft = duration;
            if (timeLeftEl) timeLeftEl.textContent = timeLeft;
            
            timer = setInterval(() => {
                timeLeft--;
                if (timeLeftEl) timeLeftEl.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    // Автоматически переходим к следующему вопросу при истечении времени
                    if (current < questions.length - 1) {
                        if (nextBtn) nextBtn.click();
                    } else {
                        finishQuiz();
                    }
                }
            }, 1000);
        }

        function stopTimer() {
            clearInterval(timer);
        }

        function getPointsForDifficulty(difficulty) {
            switch(difficulty) {
                case 1: return 1; // легкий
                case 2: return 2; // средний
                case 3: return 3; // тяжелый
                default: return 1;
            }
        }

        function getTimeForDifficulty(difficulty) {
            switch(difficulty) {
                case 1: return 15; // легкий - 15 сек
                case 2: return 30; // средний - 30 сек
                case 3: return 45; // тяжелый - 45 сек
                default: return 30;
            }
        }

        function renderQuestion() {
            const q = questions[current];
            if (!q) return;

            if (currEl) currEl.textContent = current + 1;
            if (questionText) questionText.textContent = q.quest_text;
            if (answersBox) answersBox.innerHTML = '';
            
            console.log(q);
            console.log(q.answers);

            // Запускаем таймер в зависимости от сложности
            const timeForQuestion = getTimeForDifficulty(q.difficulty);
            startTimer(timeForQuestion);

            q.answers.forEach(a => {
                const btn = document.createElement('button');
                btn.textContent = a.answer_text;

                btn.onclick = () => {
                    stopTimer();
                    
                    answersLog[current] = {
                        question_id: q.id,
                        user_answer: a.id,
                        right_answer: a.is_correct,
                        difficulty: q.difficulty
                    };

                    if (a.is_correct) {
                        // Начисляем баллы в зависимости от сложности
                        const points = getPointsForDifficulty(q.difficulty);
                        score += points;
                        btn.style.background = '#4caf50';
                    } else {
                        btn.style.background = '#f44336';
                    }

                    if (scoreEl) scoreEl.textContent = score;

                    document
                        .querySelectorAll('#answers-container button')
                        .forEach(b => b.disabled = true);

                    if (nextBtn) nextBtn.style.display = 'inline-block';
                    if (endBtn) endBtn.style.display = 'inline-block';
                };

                if (answersBox) answersBox.appendChild(btn);
            });
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                stopTimer();
                nextBtn.style.display = 'none';
                if (endBtn) endBtn.style.display = 'none';

                current++;
                if (current < questions.length) {
                    renderQuestion();
                } else {
                    finishQuiz();
                }
            };
        }

        if (endBtn) {
            endBtn.onclick = () => {
                stopTimer();
                finishQuiz();
            };
        }

        function finishQuiz() {
            stopTimer();
            
            if (questionText) {
                questionText.innerHTML = `
                    <h3>Викторина завершена</h3>
                    <p>Результат: ${score} из ${questions.reduce((total, q) => total + getPointsForDifficulty(q.difficulty), 0)} баллов</p>
                `;
            }

            if (answersBox) answersBox.innerHTML = '';
            if (timeLeftEl) timeLeftEl.textContent = '0';
            if (nextBtn) nextBtn.style.display = 'none';
            if (endBtn) endBtn.style.display = 'none';

            saveResult();
        }

        async function saveResult() {
            const maxScore = questions.reduce((total, q) => total + getPointsForDifficulty(q.difficulty), 0);
            
            const payload = {
                user_id: userData.id,
                topic_id: parseInt(topicId),
                score: score,
                total_questions: questions.length,
                max_possible_score: maxScore,
                questions_data: answersLog.filter(Boolean)
            };

            try {
                const response = await fetch(
                    'api.php?action=save-result',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }
                );

                const data = await response.json();

                if (msgBox) {
                    msgBox.innerHTML = data.success
                        ? `✅ Результат сохранён (ID: ${data.game_id})`
                        : `❌ Ошибка сохранения`;
                    msgBox.style.display = 'block';
                }

            } catch (err) {
                console.error(err);
                if (msgBox) {
                    msgBox.innerHTML = '❌ Ошибка соединения с сервером';
                    msgBox.style.display = 'block';
                }
            }
        }

        renderQuestion();
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.onclick = () => location.href = 'topics.html';
});