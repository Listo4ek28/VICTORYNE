<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Включаем вывод ошибок для отладки
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Конфигурация подключения к БД
$host = "localhost";
$dbname = "db-name";
$username = "your-name";
$password = "your-pass";

// Создание соединения
$conn = new mysqli($host, $username, $password, $dbname);

// Проверка соединения
if ($conn->connect_error) {
    sendResponse(["error" => "Connection failed: " . $conn->connect_error], 500);
}

$conn->set_charset("utf8mb4");


// Получаем действие из GET или POST
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Если action пустой, проверяем JSON тело
if (empty($action)) {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input && isset($input['action'])) {
        $action = $input['action'];
    }
}

// Если все еще пусто - показываем информацию об API
if (empty($action)) {
    sendResponse([
        'api_name' => 'VICTORYNE API',
        'version' => '1.0',
        'status' => 'running',
        'endpoints' => [
		    'POST ?action=register' => 'Регистрация пользователя',
		    'POST ?action=login' => 'Вход в систему',
		    'GET ?action=get-user-data' => 'Получение данных пользователя',
		    'POST ?action=update-username' => 'Обновление имени пользователя',
		    'POST ?action=delete-account' => 'Удаление аккаунта',
		    'GET ?action=topics' => 'Получение списка тем',
		    'GET ?action=questions' => 'Получение вопросов',
		    'POST ?action=save-result' => 'Сохранение результатов',
		    'GET ?action=statistics' => 'Получение статистики',
		    'GET ?action=top-players' => 'Получение топ 10 игроков', // ← ДОБАВЛЕНО
		    'POST ?action=add-question' => 'Добавление нового вопроса (админ)',
		    'POST ?action=add-topic' => 'Добавление новой темы (админ)',
		    'DELETE ?action=delete-topic' => 'Удаление темы и связанных вопросов (админ)',
		    'DELETE ?action=delete-question' => 'Удаление вопроса (админ)'
		]
    ]);
}

// Маршрутизация
switch ($action) {
    case 'register':
        handleRegister($conn);
        break;
        
    case 'login':
        handleLogin($conn);
        break;
        
    case 'topics':
        getTopics($conn);
        break;
        
    case 'questions':
        getQuestions($conn);
        break;
        
    case 'save-result':
        saveQuizResult($conn);
        break;
        
    case 'statistics':
        getStatistics($conn);
        break;
        
    case 'add-question':
        addQuestion($conn);
        break;
        
    case 'add-topic':
        addTopic($conn);
        break;
        
    case 'delete-topic':
        deleteTopic($conn);
        break;
        
    case 'delete-question':
        deleteQuestion($conn);
        break;
        
    case 'get-user-data':
	    getUserData($conn);
	    break;
	    
	case 'update-username':
	    updateUsername($conn);
	    break;
	    
	case 'delete-account':
	    deleteAccount($conn);
	    break;
	    
	case 'update-avatar':
	    updateAvatar($conn);
	    break;
	    
	case 'top-players':
	    getTopPlayers($conn);
	    break;
	        
    default:
        sendResponse(['error' => 'Endpoint not found', 'requested_action' => $action], 404);
}

// Функция для отправки ответа
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

// Обработка регистрации
function handleRegister($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    if (!isset($data['username']) || !isset($data['phone']) || !isset($data['password'])) {
        sendResponse(['error' => 'Missing required fields'], 400);
    }
    
    $username = $conn->real_escape_string(trim($data['username']));
    $phone = $conn->real_escape_string(trim($data['phone']));
    $password = $conn->real_escape_string(trim($data['password']));
    $avatar = isset($data['avatar']) ? $conn->real_escape_string(trim($data['avatar'])) : null;
    
    if (empty($username) || empty($phone) || empty($password)) {
        sendResponse(['error' => 'All fields are required'], 400);
    }
    
    // Проверка существования пользователя
    $checkSql = "SELECT id FROM ACCOUNTS WHERE USERNAME = '$username' OR PHONE = '$phone'";
    $result = $conn->query($checkSql);
    
    if ($result->num_rows > 0) {
        sendResponse(['error' => 'Пользователь с таким именем/номером уже существует'], 409);
    }
    
    // Создание пользователя
    $sql = "INSERT INTO ACCOUNTS (USERNAME, U_ROLE, PHONE, PASS, REG_DATE) 
            VALUES ('$username', 2, '$phone', '$password', CURDATE())";
    
    if ($conn->query($sql)) {
        $userId = $conn->insert_id;
        
        // Если есть аватар в формате base64, сохраняем его
        if ($avatar && strpos($avatar, 'data:image') !== 0) {
            // Сохраняем как есть (base64)
            $updateSql = "UPDATE ACCOUNTS SET PROFILE_PHOTO = ? WHERE ID = ?";
            $stmt = $conn->prepare($updateSql);
            $stmt->bind_param("si", $avatar, $userId);
            $stmt->execute();
            $stmt->close();
        }
        
        // Получаем данные пользователя для ответа
        $userSql = "SELECT id, username, phone, u_role, PROFILE_PHOTO FROM ACCOUNTS WHERE id = $userId";
        $userResult = $conn->query($userSql);
        $user = $userResult->fetch_assoc();
        
        // Формируем URL аватара
        $avatarUrl = null;
        if (!empty($user['PROFILE_PHOTO'])) {
            // Если есть аватар в базе, используем его (это base64 строка)
            $avatarUrl = $user['PROFILE_PHOTO'];
        } else {
            // Иначе используем стандартный аватар
            $avatarUrl = 'img/default_avatar.jpg';
        }
        
        sendResponse([
            'success' => true,
            'message' => 'Registration successful',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'phone' => $user['phone'],
                'avatar' => $avatarUrl,
                'role' => $user['u_role']
            ]
        ]);
    } else {
        sendResponse(['error' => 'Registration failed: ' . $conn->error], 500);
    }
}

// Обработка входа
function handleLogin($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Если данные пришли не как JSON, пробуем получить из POST
    if (!$data || empty($data)) {
        $data = $_POST;
    }
    
    if (!isset($data['username']) || !isset($data['password'])) {
        sendResponse([
            'success' => false,
            'error' => 'Missing credentials'
        ], 400);
    }
    
    $username = $conn->real_escape_string(trim($data['username']));
    $password = $conn->real_escape_string(trim($data['password']));
    
    $sql = "SELECT id, username, phone, pass, u_role, PROFILE_PHOTO FROM ACCOUNTS WHERE USERNAME = '$username'";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        // Проверка пароля
        if ($user['pass'] === $password) {
            // Получаем аватар пользователя
            $avatarUrl = null;
            if (!empty($user['PROFILE_PHOTO'])) {
                // Если есть аватар в базе, используем его
                $avatarUrl = $user['PROFILE_PHOTO'];
            } else {
                // Иначе используем стандартный аватар
                $avatarUrl = 'img/default_avatar.jpg';
            }
            
            sendResponse([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'phone' => $user['phone'],
                    'role' => $user['u_role'],
                    'avatar' => $avatarUrl
                ]
            ]);
        } else {
            sendResponse([
                'success' => false,
                'error' => 'Пароль неверный'
            ], 401);
        }
    } else {
        sendResponse([
            'success' => false,
            'error' => 'Пользователь не найден'
        ], 404);
    }
}

// Получение тем
function getTopics($conn) {
    $sql = "SELECT id, naming, description, icon FROM TOPICS ORDER BY id";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendResponse(['error' => 'Database error: ' . $conn->error], 500);
    }
    
    $topics = [];
    while ($row = $result->fetch_assoc()) {
        $topics[] = [
            'id' => (int)$row['id'],
            'name' => $row['naming'],
            'naming' => $row['naming'],
            'description' => $row['description'],
            'icon' => $row['icon']
        ];
    }
    
    sendResponse(['success' => true, 'topics' => $topics]);
}

function getQuestions($conn) {
    try {
        $topicId = isset($_GET['topic_id']) ? intval($_GET['topic_id']) : null;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        
        if ($topicId !== null && $topicId > 0) {
            // Используем верхний регистр, как в структуре БД
            $sql = "SELECT q.ID, q.TOPIC, q.QUEST_TEXT, q.DIFFICULTY, t.NAMING as topic_name 
                    FROM QUESTIONS q 
                    JOIN TOPICS t ON q.TOPIC = t.ID 
                    WHERE q.TOPIC = $topicId 
                    ORDER BY RAND() LIMIT $limit";
        } else {
            $sql = "SELECT q.ID, q.TOPIC, q.QUEST_TEXT, q.DIFFICULTY, t.NAMING as topic_name 
                    FROM QUESTIONS q 
                    JOIN TOPICS t ON q.TOPIC = t.ID 
                    ORDER BY RAND() LIMIT $limit";
        }
        
        $result = $conn->query($sql);
        
        if (!$result) {
            throw new Exception('Database error: ' . $conn->error);
        }
        
        $questions = [];
        
        while ($row = $result->fetch_assoc()) {
            $questionId = (int)$row['ID'];
            
            // Используем подготовленное выражение для безопасности
            $stmt = $conn->prepare("SELECT ID, ANSWER_TEXT, IS_CORRECT FROM ANSWERS WHERE QUESTION_ID = ? ORDER BY ID");
            $stmt->bind_param("i", $questionId);
            $stmt->execute();
            $answersResult = $stmt->get_result();
            
            $answers = [];
            while ($answer = $answersResult->fetch_assoc()) {
                $answers[] = [
                    'id' => (int)$answer['ID'],
                    'answer_text' => $answer['ANSWER_TEXT'],
                    'is_correct' => (bool)$answer['IS_CORRECT']
                ];
            }
            $stmt->close();
            
            $questions[] = [
                'id' => $questionId,
                'topic' => (int)$row['TOPIC'],
                'quest_text' => $row['QUEST_TEXT'],
                'topic_name' => $row['topic_name'],
                'difficulty' => (int)$row['DIFFICULTY'],
                'answers' => $answers
            ];
        }
        
        sendResponse([
            'success' => true, 
            'questions' => $questions,
            'count' => count($questions)
        ]);
        
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// Сохранение результатов викторины
function saveQuizResult($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    if (!isset($data['user_id']) || !isset($data['topic_id']) || !isset($data['score']) || !isset($data['total_questions'])) {
        sendResponse(['error' => 'Missing required fields'], 400);
    }
    
    $user_id = intval($data['user_id']);
    $topic_id = intval($data['topic_id']);
    $score = intval($data['score']);
    $total_questions = intval($data['total_questions']);
    $max_possible_score = isset($data['max_possible_score']) ? intval($data['max_possible_score']) : $total_questions * 10;
    $questions_data = isset($data['questions_data']) ? $data['questions_data'] : [];
    
    // Вставляем запись о пройденной викторине
    $sql = "INSERT INTO PLAYED_VICTORYNES_LOG (USER_ID, TOPIC, SCORE, TOTAL_QUESTIONS, MAX_POSSIBLE_SCORE, PLAYED_DATE) 
            VALUES ($user_id, $topic_id, $score, $total_questions, $max_possible_score, NOW())";
    
    if ($conn->query($sql)) {
        $game_id = $conn->insert_id;
        
        // Сохраняем детали по каждому вопросу (если предоставлены)
        $questions_saved = 0;
        if (!empty($questions_data) && is_array($questions_data)) {
            foreach ($questions_data as $question_data) {
                if (isset($question_data['question_id']) && isset($question_data['right_answer']) && isset($question_data['user_answer'])) {
                    $question_id = intval($question_data['question_id']);
                    $right_answer = $question_data['right_answer'] ? 1 : 0;
                    $user_answer = intval($question_data['user_answer']);
                    
                    $detail_sql = "INSERT INTO PLAYED_VICTORYNES_QUESTIONS_CONNECT 
                                   (VICTORYNE, QUESTION, RIGHT_ANSWER, USER_ANSWER) 
                                   VALUES ($game_id, $question_id, $right_answer, $user_answer)";
                    
                    if ($conn->query($detail_sql)) {
                        $questions_saved++;
                    }
                }
            }
        }
        
        sendResponse([
            'success' => true,
            'message' => 'Quiz result saved successfully',
            'game_id' => $game_id,
            'questions_saved' => $questions_saved
        ]);
    } else {
        sendResponse(['error' => 'Failed to save quiz result: ' . $conn->error], 500);
    }
}

// Получение статистики
function getStatistics($conn) {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    
    if (!$user_id || $user_id <= 0) {
        sendResponse(['error' => 'User ID is required'], 400);
    }
    
    // Общая статистика
    $stats_sql = "SELECT 
                    COUNT(*) as total_games,
                    AVG(SCORE) as avg_score,
                    MAX(SCORE) as max_score,
                    SUM(SCORE) as total_score
                  FROM PLAYED_VICTORYNES_LOG 
                  WHERE USER_ID = $user_id";
    
    $result = $conn->query($stats_sql);
    $stats = $result->fetch_assoc();
    
    // Статистика по темам
    $topics_sql = "SELECT 
                    t.NAMING as topic_name,
                    COUNT(pvl.GAME_ID) as games_count,
                    AVG(pvl.SCORE) as avg_score,
                    MAX(pvl.SCORE) as max_score
                  FROM TOPICS t
                  LEFT JOIN PLAYED_VICTORYNES_LOG pvl ON t.ID = pvl.TOPIC AND pvl.USER_ID = $user_id
                  GROUP BY t.ID, t.NAMING
                  ORDER BY games_count DESC";
    
    $topics_result = $conn->query($topics_sql);
    $topics_stats = [];
    while ($row = $topics_result->fetch_assoc()) {
        $topics_stats[] = [
            'topic_name' => $row['topic_name'],
            'games_count' => (int)$row['games_count'],
            'avg_score' => floatval($row['avg_score']),
            'max_score' => (int)$row['max_score']
        ];
    }
    
    // Последние игры
    $recent_sql = "SELECT 
                    pvl.*,
                    t.NAMING as topic_name
                  FROM PLAYED_VICTORYNES_LOG pvl
                  JOIN TOPICS t ON pvl.TOPIC = t.ID
                  WHERE pvl.USER_ID = $user_id
                  ORDER BY pvl.PLAYED_DATE DESC
                  LIMIT 10";
    
    $recent_result = $conn->query($recent_sql);
    $recent_games = [];
    while ($row = $recent_result->fetch_assoc()) {
        // Добавляем поле max_possible_score в ответ
        $row['max_possible_score'] = isset($row['MAX_POSSIBLE_SCORE']) && $row['MAX_POSSIBLE_SCORE'] > 0 
            ? $row['MAX_POSSIBLE_SCORE'] 
            : $row['TOTAL_QUESTIONS'] * 10;
        $recent_games[] = $row;
    }
    
    sendResponse([
        'success' => true,
        'stats' => [
            'total_games' => (int)$stats['total_games'],
            'avg_score' => floatval($stats['avg_score']),
            'max_score' => (int)$stats['max_score'],
            'total_score' => (int)$stats['total_score']
        ],
        'topics_stats' => $topics_stats,
        'recent_games' => $recent_games
    ]);
}

// Добавление нового вопроса
function addQuestion($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    if (!isset($data['topic_id']) || !isset($data['question_text']) || !isset($data['answers'])) {
        sendResponse(['error' => 'Missing required fields'], 400);
    }
    
    $topic_id = intval($data['topic_id']);
    $question_text = $conn->real_escape_string(trim($data['question_text']));
    $difficulty = isset($data['difficulty']) ? intval($data['difficulty']) : 1;
    
    // Вставка вопроса
    $sql = "INSERT INTO QUESTIONS (TOPIC, QUEST_TEXT, DIFFICULTY) VALUES ($topic_id, '$question_text', $difficulty)";
    
    if ($conn->query($sql)) {
        $question_id = $conn->insert_id;
        
        // Вставка ответов
        $answers = $data['answers'];
        $answers_added = 0;
        
        foreach ($answers as $answer) {
            $answer_text = $conn->real_escape_string(trim($answer['text']));
            $is_correct = $answer['is_correct'] ? 1 : 0;
            
            $answer_sql = "INSERT INTO ANSWERS (QUESTION_ID, ANSWER_TEXT, IS_CORRECT) 
                           VALUES ($question_id, '$answer_text', $is_correct)";
            
            if ($conn->query($answer_sql)) {
                $answers_added++;
            }
        }
        
        sendResponse([
            'success' => true,
            'message' => 'Question added successfully',
            'question_id' => $question_id,
            'answers_added' => $answers_added
        ]);
    } else {
        sendResponse(['error' => 'Failed to add question: ' . $conn->error], 500);
    }
}

// Добавление новой темы
function addTopic($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    if (!isset($data['name']) || !isset($data['description'])) {
        sendResponse(['error' => 'Missing required fields'], 400);
    }
    
    $name = $conn->real_escape_string(trim($data['name']));
    $description = $conn->real_escape_string(trim($data['description']));
    $icon = isset($data['icon']) ? $conn->real_escape_string(trim($data['icon'])) : '📚';
    
    // Проверка существования темы
    $checkSql = "SELECT id FROM TOPICS WHERE NAMING = '$name'";
    $result = $conn->query($checkSql);
    
    if ($result->num_rows > 0) {
        sendResponse(['error' => 'Такая тема уже существует'], 409);
    }
    
    // Добавление темы
    $sql = "INSERT INTO TOPICS (NAMING, DESCRIPTION, ICON) VALUES ('$name', '$description', '$icon')";
    
    if ($conn->query($sql)) {
        $topic_id = $conn->insert_id;
        
        sendResponse([
            'success' => true,
            'message' => 'Topic added successfully',
            'topic' => [
                'id' => $topic_id,
                'name' => $name,
                'description' => $description,
                'icon' => $icon
            ]
        ]);
    } else {
        sendResponse(['error' => 'Failed to add topic: ' . $conn->error], 500);
    }
}

// Удаление темы и связанных вопросов
function deleteTopic($conn) {
    // Проверяем метод запроса
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(['error' => 'Method not allowed. Use DELETE or POST'], 405);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    if (!isset($data['topic_id'])) {
        sendResponse(['error' => 'Missing topic_id'], 400);
    }
    
    $topic_id = intval($data['topic_id']);
    
    // Проверяем существование темы
    $checkSql = "SELECT id, naming FROM TOPICS WHERE id = $topic_id";
    $result = $conn->query($checkSql);
    
    if ($result->num_rows === 0) {
        sendResponse(['error' => 'Topic not found'], 404);
    }
    
    $topic = $result->fetch_assoc();
    $topic_name = $topic['naming'];
    
    // Начинаем транзакцию для атомарности операций
    $conn->begin_transaction();
    
    try {
        // 1. Удаляем связи вопросов в пройденных викторинах
        $deleteConnectionsSql = "DELETE FROM PLAYED_VICTORYNES_QUESTIONS_CONNECT 
                                WHERE QUESTION IN (SELECT ID FROM QUESTIONS WHERE TOPIC = $topic_id)";
        if (!$conn->query($deleteConnectionsSql)) {
            throw new Exception('Failed to delete question connections: ' . $conn->error);
        }
        
        // 2. Удаляем результаты викторин по этой теме
        $deleteLogsSql = "DELETE FROM PLAYED_VICTORYNES_LOG WHERE TOPIC = $topic_id";
        if (!$conn->query($deleteLogsSql)) {
            throw new Exception('Failed to delete quiz logs: ' . $conn->error);
        }
        
        // 3. Удаляем ответы на вопросы этой темы
        $deleteAnswersSql = "DELETE a FROM ANSWERS a 
                            INNER JOIN QUESTIONS q ON a.QUESTION_ID = q.ID 
                            WHERE q.TOPIC = $topic_id";
        if (!$conn->query($deleteAnswersSql)) {
            throw new Exception('Failed to delete answers: ' . $conn->error);
        }
        
        // 4. Удаляем вопросы этой темы
        $deleteQuestionsSql = "DELETE FROM QUESTIONS WHERE TOPIC = $topic_id";
        if (!$conn->query($deleteQuestionsSql)) {
            throw new Exception('Failed to delete questions: ' . $conn->error);
        }
        
        // 5. Удаляем саму тему
        $deleteTopicSql = "DELETE FROM TOPICS WHERE id = $topic_id";
        if (!$conn->query($deleteTopicSql)) {
            throw new Exception('Failed to delete topic: ' . $conn->error);
        }
        
        // Если все операции успешны, коммитим транзакцию
        $conn->commit();
        
        sendResponse([
            'success' => true,
            'message' => "Тема '{$topic_name}' и все связанные вопросы успешно удалены",
            'topic_id' => $topic_id,
            'topic_name' => $topic_name
        ]);
        
    } catch (Exception $e) {
        // Откатываем транзакцию в случае ошибки
        $conn->rollback();
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// Удаление вопроса
function deleteQuestion($conn) {
    // Проверяем метод запроса
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(['error' => 'Method not allowed. Use DELETE or POST'], 405);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    if (!isset($data['question_id'])) {
        sendResponse(['error' => 'Missing question_id'], 400);
    }
    
    $question_id = intval($data['question_id']);
    
    // Проверяем существование вопроса
    $checkSql = "SELECT q.id, q.quest_text, t.naming as topic_name 
                 FROM QUESTIONS q 
                 JOIN TOPICS t ON q.TOPIC = t.ID 
                 WHERE q.id = $question_id";
    $result = $conn->query($checkSql);
    
    if ($result->num_rows === 0) {
        sendResponse(['error' => 'Question not found'], 404);
    }
    
    $question = $result->fetch_assoc();
    $question_text = $question['quest_text'];
    $topic_name = $question['topic_name'];
    
    // Начинаем транзакцию
    $conn->begin_transaction();
    
    try {
        // 1. Удаляем связи вопроса в пройденных викторинах
        $deleteConnectionsSql = "DELETE FROM PLAYED_VICTORYNES_QUESTIONS_CONNECT WHERE QUESTION = $question_id";
        if (!$conn->query($deleteConnectionsSql)) {
            throw new Exception('Failed to delete question connections: ' . $conn->error);
        }
        
        // 2. Удаляем ответы на этот вопрос
        $deleteAnswersSql = "DELETE FROM ANSWERS WHERE QUESTION_ID = $question_id";
        if (!$conn->query($deleteAnswersSql)) {
            throw new Exception('Failed to delete answers: ' . $conn->error);
        }
        
        // 3. Удаляем сам вопрос
        $deleteQuestionSql = "DELETE FROM QUESTIONS WHERE id = $question_id";
        if (!$conn->query($deleteQuestionSql)) {
            throw new Exception('Failed to delete question: ' . $conn->error);
        }
        
        // Коммитим транзакцию
        $conn->commit();
        
        sendResponse([
            'success' => true,
            'message' => "Вопрос из темы '{$topic_name}' успешно удален",
            'question_id' => $question_id,
            'question_text' => $question_text
        ]);
        
    } catch (Exception $e) {
        // Откатываем транзакцию в случае ошибки
        $conn->rollback();
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

function getUserData($conn) {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    
    if (!$user_id || $user_id <= 0) {
        sendResponse(['error' => 'User ID is required'], 400);
    }
    
    $sql = "SELECT id, username, phone, u_role as role, reg_date, PROFILE_PHOTO as avatar FROM ACCOUNTS WHERE id = $user_id";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        // Форматируем дату регистрации
        if ($user['reg_date']) {
            $user['reg_date'] = date('Y-m-d', strtotime($user['reg_date']));
        }
        
        // Формируем URL аватара
        if (!empty($user['avatar'])) {
            // Если есть аватар в базе, используем его
            $user['avatar'] = $user['avatar'];
        } else {
            // Иначе используем стандартный аватар
            $user['avatar'] = 'img/default_avatar.jpg';
        }
        
        sendResponse([
            'success' => true,
            'user' => $user
        ]);
    } else {
        sendResponse(['error' => 'User not found'], 404);
    }
}

// Обновление имени пользователя
function updateUsername($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    if (!isset($data['user_id']) || !isset($data['new_username'])) {
        sendResponse(['error' => 'Missing required fields'], 400);
    }
    
    $user_id = intval($data['user_id']);
    $new_username = $conn->real_escape_string(trim($data['new_username']));
    
    if (empty($new_username)) {
        sendResponse(['error' => 'Username cannot be empty'], 400);
    }
    
    if (strlen($new_username) < 3) {
        sendResponse(['error' => 'Username must be at least 3 characters'], 400);
    }
    
    if (strlen($new_username) > 32) {
        sendResponse(['error' => 'Username must be at most 32 characters'], 400);
    }
    
    // Проверяем, существует ли пользователь с таким именем
    $checkSql = "SELECT id FROM ACCOUNTS WHERE USERNAME = '$new_username' AND id != $user_id";
    $result = $conn->query($checkSql);
    
    if ($result->num_rows > 0) {
        sendResponse(['error' => 'Пользователь с таким именем уже существует'], 409);
    }
    
    // Обновляем имя пользователя
    $sql = "UPDATE ACCOUNTS SET USERNAME = '$new_username' WHERE id = $user_id";
    
    if ($conn->query($sql)) {
        sendResponse([
            'success' => true,
            'message' => 'Username updated successfully',
            'new_username' => $new_username
        ]);
    } else {
        sendResponse(['error' => 'Failed to update username: ' . $conn->error], 500);
    }
}

// Удаление аккаунта
function deleteAccount($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    if (!isset($data['user_id']) || !isset($data['password'])) {
        sendResponse(['error' => 'Missing required fields'], 400);
    }
    
    $user_id = intval($data['user_id']);
    $password = $conn->real_escape_string(trim($data['password']));
    
    // Проверяем пароль
    $checkSql = "SELECT id, pass FROM ACCOUNTS WHERE id = $user_id";
    $result = $conn->query($checkSql);
    
    if ($result->num_rows === 0) {
        sendResponse(['error' => 'User not found'], 404);
    }
    
    $user = $result->fetch_assoc();
    
    if ($user['pass'] !== $password) {
        sendResponse(['error' => 'Invalid password'], 401);
    }
    
    // Начинаем транзакцию
    $conn->begin_transaction();
    
    try {
        // 1. Удаляем связи вопросов в пройденных викторинах
        $deleteConnectionsSql = "DELETE FROM PLAYED_VICTORYNES_QUESTIONS_CONNECT 
                                WHERE VICTORYNE IN (SELECT GAME_ID FROM PLAYED_VICTORYNES_LOG WHERE USER_ID = $user_id)";
        if (!$conn->query($deleteConnectionsSql)) {
            throw new Exception('Failed to delete question connections: ' . $conn->error);
        }
        
        // 2. Удаляем результаты викторин пользователя
        $deleteLogsSql = "DELETE FROM PLAYED_VICTORYNES_LOG WHERE USER_ID = $user_id";
        if (!$conn->query($deleteLogsSql)) {
            throw new Exception('Failed to delete quiz logs: ' . $conn->error);
        }
        
        // 3. Удаляем сам аккаунт
        $deleteAccountSql = "DELETE FROM ACCOUNTS WHERE id = $user_id";
        if (!$conn->query($deleteAccountSql)) {
            throw new Exception('Не удалось удалить аккаунт: ' . $conn->error);
        }
        
        // Если все операции успешны, коммитим транзакцию
        $conn->commit();
        
        sendResponse([
            'success' => true,
            'message' => 'Аккаунт успешно удалён'
        ]);
        
    } catch (Exception $e) {
        // Откатываем транзакцию в случае ошибки
        $conn->rollback();
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

function updateAvatar($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    if (!isset($data['user_id']) || !isset($data['avatar'])) {
        sendResponse(['error' => 'Missing required fields'], 400);
    }
    
    $user_id = intval($data['user_id']);
    $avatar = $conn->real_escape_string(trim($data['avatar']));
    
    // Проверяем, что это валидное изображение base64
    if (!strpos($avatar, 'data:image') === 0) {
        sendResponse(['error' => 'Некорректный формат изображения'], 400);
    }
    
    // Обновляем аватар пользователя
    $sql = "UPDATE ACCOUNTS SET PROFILE_PHOTO = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $avatar, $user_id);
    
    if ($stmt->execute()) {
        sendResponse([
            'success' => true,
            'message' => 'Аватар успешно обновлён',
            'avatar' => $avatar
        ]);
    } else {
        sendResponse(['error' => 'Failed to update avatar: ' . $conn->error], 500);
    }
    
    $stmt->close();
}

function getTopPlayers($conn) {
    try {
        // Сначала получаем всех пользователей, у которых есть результаты викторин
        $sql = "
            SELECT 
                a.id,
                a.username,
                a.PROFILE_PHOTO as avatar,
                COUNT(pvl.GAME_ID) as total_games,
                AVG(pvl.SCORE) as avg_score,
                -- Рассчитываем средний процент правильных ответов
                AVG(
                    CASE 
                        WHEN pvl.MAX_POSSIBLE_SCORE > 0 
                        THEN (pvl.SCORE / pvl.MAX_POSSIBLE_SCORE) * 100 
                        ELSE (pvl.SCORE / (pvl.TOTAL_QUESTIONS * 10)) * 100 
                    END
                ) as avg_percentage
            FROM ACCOUNTS a
            INNER JOIN PLAYED_VICTORYNES_LOG pvl ON a.id = pvl.USER_ID
            WHERE a.u_role = 2 -- Только обычные пользователи (не админы)
            GROUP BY a.id, a.username, a.PROFILE_PHOTO
            HAVING total_games >= 1 -- Игрок должен сыграть хотя бы одну викторину
            ORDER BY avg_percentage DESC
            LIMIT 10
        ";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            throw new Exception('Database error: ' . $conn->error);
        }
        
        $top_players = [];
        while ($row = $result->fetch_assoc()) {
            $avatar = !empty($row['avatar']) ? $row['avatar'] : 'img/default_avatar.jpg';
            
            $top_players[] = [
                'id' => (int)$row['id'],
                'username' => $row['username'],
                'avatar' => $avatar,
                'total_games' => (int)$row['total_games'],
                'avg_score' => floatval($row['avg_score']),
                'avg_percentage' => floatval($row['avg_percentage'])
            ];
        }
        
        sendResponse([
            'success' => true,
            'top_players' => $top_players,
            'count' => count($top_players)
        ]);
        
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

$conn->close();
?>