document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = '/api.php'; // Используем относительный путь
    
    loadUserData();
    loadStatistics();
    loadTopPlayers(); // Загружаем топ игроков
    
    document.getElementById('back-btn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    async function loadUserData() {
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        if (userData) {
            document.getElementById('avatar-img').src = userData.avatar;
        }
    }
    
    async function loadStatistics() {
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        const statsContainer = document.getElementById('stats-container');
        
        if (!userData || !userData.id) {
            statsContainer.innerHTML = '<p style="color: var(--beta-text-secondary); text-align: center;">Пожалуйста, войдите в систему для просмотра статистики.</p>';
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}?action=statistics&user_id=${userData.id}`);
            const data = await response.json();
            
            if (data.success) {
                displayStatistics(data);
            } else {
                statsContainer.innerHTML = `<p style="color: var(--beta-error); text-align: center;">${data.error || 'Ошибка загрузки статистики'}</p>`;
            }
        } catch (error) {
            console.error('Ошибка при загрузке статистики:', error);
            statsContainer.innerHTML = '<p style="color: var(--beta-error); text-align: center;">Ошибка соединения с сервером</p>';
        }
    }
    
    async function loadTopPlayers() {
        try {
            const response = await fetch(`${API_BASE}?action=top-players`);
            const data = await response.json();
            
            if (data.success) {
                displayTopPlayers(data.top_players);
            } else {
                // Если эндпоинта еще нет, просто не показываем секцию
                console.warn('Топ игроков не доступен:', data.error);
            }
        } catch (error) {
            console.error('Ошибка при загрузке топа игроков:', error);
            // Не показываем ошибку пользователю, просто не отображаем секцию
        }
    }
    
    function displayStatistics(data) {
        const statsContainer = document.getElementById('stats-container');
        
        let html = `
            <div class="stats-summary">
                <h3>📊 Общая статистика</h3>
                <div class="stat-item">
                    <span class="stat-label">Всего викторин:</span>
                    <span class="stat-value">${data.stats.total_games || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Средний счет:</span>
                    <span class="stat-value">${data.stats.avg_score ? Math.round(data.stats.avg_score) : 0} баллов</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Максимальный счет:</span>
                    <span class="stat-value">${data.stats.max_score || 0} баллов</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Общий счет:</span>
                    <span class="stat-value">${data.stats.total_score || 0} баллов</span>
                </div>
            </div>
            <hr>
        `;
        
        if (data.topics_stats && data.topics_stats.length > 0) {
            html += `<h3>📈 Статистика по темам</h3>`;
            data.topics_stats.forEach(topic => {
                if (topic.games_count > 0) {
                    html += `
                        <div class="topic-stats">
                            <div class="stat-item">
                                <span class="stat-label">${topic.topic_name}:</span>
                                <span class="stat-value">${topic.games_count} викторин</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Средний счет:</span>
                                <span class="stat-value">${topic.avg_score ? Math.round(topic.avg_score) : 0} баллов</span>
                            </div>
                        </div>
                    `;
                }
            });
            html += `<hr>`;
        }
        
        if (data.recent_games && data.recent_games.length > 0) {
            html += `<h3>⏱️ Последние викторины</h3>`;
            data.recent_games.forEach(game => {
                const date = new Date(game.PLAYED_DATE).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const maxScore = game.MAX_POSSIBLE_SCORE || game.TOTAL_QUESTIONS * 10;
                let rating = '';
                let percentage = 0;

                // Проверяем, есть ли максимальный балл
                if (maxScore <= 0) {
                    // Если максимальный балл не определен или равен 0
                    rating = 'н/д';
                } else {
                    // Рассчитываем процент только если есть максимальный балл
                    percentage = (game.SCORE / maxScore) * 100;
                    
                    // Определяем рейтинг на основе процента
                    if (percentage >= 90) {
                        rating = '🏆 Отлично!';
                    } else if (percentage >= 70) {
                        rating = '👍 Хорошо';
                    } else if (percentage >= 50) {
                        rating = '👌 Удовлетворительно';
                    } else {
                        rating = '📚 Есть куда расти';
                    }
                }

                html += `
                    <div class="recent-game">
                        <div class="game-header">
                            <span class="game-topic">${game.topic_name}</span>
                            <span class="game-date">${date}</span>
                        </div>
                        <div class="game-stats">
                            <span class="game-score">${game.SCORE} / ${maxScore || 0} баллов</span>
                            <span class="game-percentage">${maxScore > 0 ? percentage.toFixed(1) + '%' : 'н/д'}</span>
                            <span class="game-rating">${rating}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `<p style="color: var(--beta-text-secondary); text-align: center;">У вас еще нет результатов викторин.</p>`;
        }
        
        // Добавляем контейнер для топа игроков (будет заполнен позже)
        html += `<div id="top-players-container"></div>`;
        
        statsContainer.innerHTML = html;
        
        // Добавляем стили для статистики
        const style = document.createElement('style');
        style.textContent = `
            .stats-summary, .topic-stats, .recent-game {
                background: rgba(255, 81, 125, 0.1);
                border: 1px solid rgba(255, 81, 125, 0.2);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 15px;
                transition: all 0.3s ease;
            }
            
            .stats-summary:hover, .topic-stats:hover, .recent-game:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255, 81, 125, 0.1);
            }
            
            .stat-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .stat-label {
                color: var(--beta-text);
                font-weight: 500;
            }
            
            .stat-value {
                color: var(--beta-accent);
                font-weight: 600;
            }
            
            .game-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            
            .game-topic {
                font-weight: 600;
                color: var(--beta-text);
            }
            
            .game-date {
                color: var(--beta-text-secondary);
                font-size: 0.9em;
            }
            
            .game-stats {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .game-score {
                color: var(--beta-text);
                font-weight: 500;
            }
            
            .game-percentage {
                color: var(--beta-accent);
                font-weight: 600;
            }
            
            .game-rating {
                background: rgba(255, 81, 125, 0.2);
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 0.9em;
            }
            
            h3 {
                color: var(--beta-accent);
                margin-bottom: 15px;
                text-align: center;
            }
            
            /* Стили для топа игроков */
            .top-players-section {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 81, 125, 0.2);
            }
            
            .top-player-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 15px 20px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .top-player-card:hover {
                background: rgba(255, 81, 125, 0.1);
                transform: translateX(5px);
                border-color: rgba(255, 81, 125, 0.3);
            }
            
            .top-player-card.current-user {
                background: rgba(255, 81, 125, 0.15);
                border-color: var(--beta-accent);
                box-shadow: 0 0 0 1px rgba(255, 81, 125, 0.3);
            }
            
            .player-rank {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                font-weight: 700;
                font-size: 1.2em;
                margin-right: 15px;
                flex-shrink: 0;
            }
            
            .rank-1 {
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: #000;
            }
            
            .rank-2 {
                background: linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%);
                color: #000;
            }
            
            .rank-3 {
                background: linear-gradient(135deg, #CD7F32 0%, #B5651D 100%);
                color: #000;
            }
            
            .rank-other {
                background: rgba(255, 255, 255, 0.1);
                color: var(--beta-text);
            }
            
            .player-info {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            
            .player-username {
                font-weight: 600;
                font-size: 1.1em;
                color: var(--beta-text);
                margin-bottom: 5px;
            }
            
            .player-stats {
                display: flex;
                gap: 15px;
                font-size: 0.9em;
                color: var(--beta-text-secondary);
            }
            
            .player-stat {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .player-avg-percentage {
                font-weight: 700;
                font-size: 1.1em;
                color: var(--beta-accent);
                min-width: 80px;
                text-align: right;
            }
            
            .player-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                margin-right: 15px;
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            
            .player-left {
                display: flex;
                align-items: center;
                flex: 1;
            }
            
            .no-top-players {
                text-align: center;
                color: var(--beta-text-secondary);
                font-style: italic;
                padding: 30px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                border: 1px dashed rgba(255, 255, 255, 0.1);
            }
        `;
        document.head.appendChild(style);
    }
    
    function displayTopPlayers(topPlayers) {
        const container = document.getElementById('top-players-container');
        if (!container) return;
        
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        const currentUserId = userData ? userData.id : null;
        
        let html = `
            <div class="top-players-section">
                <h3>🏆 Топ 10 игроков</h3>
        `;
        
        if (!topPlayers || topPlayers.length === 0) {
            html += `
                <div class="no-top-players">
                    <p>Пока нет данных о лучших игроках</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">Сыграйте в викторину, чтобы попасть в рейтинг!</p>
                </div>
            `;
        } else {
            topPlayers.forEach((player, index) => {
                const rank = index + 1;
                const isCurrentUser = currentUserId && player.id == currentUserId;
                
                let rankClass = 'rank-other';
                if (rank === 1) rankClass = 'rank-1';
                else if (rank === 2) rankClass = 'rank-2';
                else if (rank === 3) rankClass = 'rank-3';
                
                html += `
                    <div class="top-player-card ${isCurrentUser ? 'current-user' : ''}">
                        <div class="player-left">
                            <div class="player-rank ${rankClass}">${rank}</div>
                            ${player.avatar ? `<img src="${player.avatar}" alt="${player.username}" class="player-avatar">` : ''}
                            <div class="player-info">
                                <div class="player-username">
                                    ${player.username}
                                    ${isCurrentUser ? ' (Вы)' : ''}
                                </div>
                                <div class="player-stats">
                                    <div class="player-stat">
                                        <span>📊</span>
                                        <span>${player.total_games || 0} игр</span>
                                    </div>
                                    <div class="player-stat">
                                        <span>⭐</span>
                                        <span>${player.avg_score ? Math.round(player.avg_score) : 0} ср. балл</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="player-avg-percentage">
                            ${player.avg_percentage ? player.avg_percentage.toFixed(1) + '%' : '0%'}
                        </div>
                    </div>
                `;
            });
        }
        
        html += `</div>`;
        container.innerHTML = html;
    }
});