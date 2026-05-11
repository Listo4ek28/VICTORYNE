document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    loadResults();
    
    document.getElementById('back-btn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    function loadUserData() {
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        if (userData) {
            document.getElementById('avatar-img').src = userData.avatar;
        }
    }
    
    function loadResults() {
        const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        const resultsContainer = document.getElementById('results-container');
        
        if (history.length === 0) {
            resultsContainer.innerHTML = '<p>У вас еще нет результатов викторин.</p>';
            return;
        }
        
        let html = '<h3>История ваших викторин:</h3>';
        
        history.forEach((result, index) => {
            const percentage = (result.score / (result.totalQuestions * 10)) * 100;
            const date = new Date(result.date).toLocaleDateString('ru-RU');
            
            html += `
                <div class="result-item">
                    <p><strong>Викторина #${index + 1}</strong></p>
                    <p>Тема: ${result.topic}</p>
                    <p>Дата: ${date}</p>
                    <p>Результат: ${result.score} / ${result.totalQuestions * 10}</p>
                    <p>Процент: ${percentage.toFixed(1)}%</p>
                    <hr>
                </div>
            `;
        });
        
        // Статистика
        const totalScore = history.reduce((sum, result) => sum + result.score, 0);
        const totalQuestions = history.reduce((sum, result) => sum + result.totalQuestions, 0);
        const averagePercentage = totalQuestions > 0 ? (totalScore / (totalQuestions * 10)) * 100 : 0;
        
        html += `
            <div id="statistics">
                <h3>Общая статистика:</h3>
                <p>Всего викторин: ${history.length}</p>
                <p>Всего вопросов: ${totalQuestions}</p>
                <p>Общий счет: ${totalScore}</p>
                <p>Средний процент: ${averagePercentage.toFixed(1)}%</p>
            </div>
        `;
        
        resultsContainer.innerHTML = html;
    }
});