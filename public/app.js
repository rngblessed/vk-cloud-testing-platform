const API_URL = 'http://app.bebrance.xyz/api';
let token = localStorage.getItem('token');
let currentUser = localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')) : null;
let currentTestId = null;
let questionsAdded = 0;
let currentTestQuestions = [];
let userAnswers = {};

// Показать нужную секцию
function showSection(sectionId) {
    document.querySelectorAll('.container > div').forEach(div => {
        div.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}

// Авторизация
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            token = data.token;
            currentUser = data.user;
            localStorage.setItem('token', token);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.getElementById('user-email').textContent = currentUser.email;
            
            if (currentUser.role === 'teacher') {
                document.getElementById('create-test-btn').classList.remove('hidden');
            }
            
            loadTests();
            showSection('tests-section');
        } else {
            document.getElementById('auth-error').textContent = data.error || 'Ошибка входа';
            document.getElementById('auth-error').classList.remove('hidden');
        }
    } catch (err) {
        document.getElementById('auth-error').textContent = 'Ошибка подключения к серверу';
        document.getElementById('auth-error').classList.remove('hidden');
    }
}

// Регистрация
async function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    
    if (!email || !password) {
        document.getElementById('register-error').textContent = 'Заполните все поля';
        document.getElementById('register-error').classList.remove('hidden');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Регистрация успешна! Войдите в систему');
            showLogin();
        } else {
            document.getElementById('register-error').textContent = data.error || 'Ошибка регистрации';
            document.getElementById('register-error').classList.remove('hidden');
        }
    } catch (err) {
        document.getElementById('register-error').textContent = 'Ошибка подключения к серверу';
        document.getElementById('register-error').classList.remove('hidden');
    }
}

// Загрузка списка тестов
async function loadTests() {
    try {
        const response = await fetch(`${API_URL}/tests`);
        const tests = await response.json();
        
        const container = document.getElementById('tests-list');
        container.innerHTML = '';
        
        if (tests.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">Тестов пока нет. Создайте первый!</p>';
            return;
        }
        
        tests.forEach(test => {
            const div = document.createElement('div');
            div.className = 'test-item';
            
            let deleteButton = '';
            if (currentUser && currentUser.role === 'teacher') {
                deleteButton = `
                    <button onclick="event.stopPropagation(); deleteTest(${test.id}, '${test.title.replace(/'/g, "\\'")}');" 
                            style="background: #e74c3c; padding: 8px 16px; margin-top: 10px; width: auto; font-size: 14px;">
                        🗑️ Удалить
                    </button>
                `;
            }
            
            div.onclick = () => startTest(test.id, test.title);
            div.innerHTML = `
                <div class="test-title">${test.title}</div>
                <div class="test-description">${test.description || 'Без описания'}</div>
                <div class="test-info">⏱️ ${test.time_limit} минут</div>
                ${deleteButton}
            `;
            container.appendChild(div);
        });
    } catch (err) {
        console.error('Ошибка загрузки тестов:', err);
        document.getElementById('tests-list').innerHTML = '<p style="color: #e74c3c;">Ошибка загрузки тестов</p>';
    }
}

// Удалить тест
async function deleteTest(testId, testTitle) {
    if (!confirm(`Удалить тест "${testTitle}"? Это действие нельзя отменить.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/tests/${testId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Тест удален');
            loadTests();
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка удаления теста');
        }
    } catch (err) {
        console.error('Ошибка удаления:', err);
        alert('Ошибка подключения к серверу');
    }
}

// Создание теста
async function createTest() {
    const title = document.getElementById('test-title').value;
    const description = document.getElementById('test-description').value;
    const time_limit = document.getElementById('test-time').value;
    
    if (!title) {
        document.getElementById('create-error').textContent = 'Введите название теста';
        document.getElementById('create-error').classList.remove('hidden');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/tests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, time_limit: parseInt(time_limit) })
        });
        
        if (response.ok) {
            const test = await response.json();
            currentTestId = test.id;
            questionsAdded = 0;
            
            document.getElementById('test-title').value = '';
            document.getElementById('test-description').value = '';
            document.getElementById('test-time').value = '30';
            
            document.getElementById('current-test-title').textContent = `Тест: ${test.title}`;
            showSection('add-questions-section');
        } else {
            const data = await response.json();
            document.getElementById('create-error').textContent = data.error || 'Ошибка создания теста';
            document.getElementById('create-error').classList.remove('hidden');
        }
    } catch (err) {
        document.getElementById('create-error').textContent = 'Ошибка подключения к серверу';
        document.getElementById('create-error').classList.remove('hidden');
    }
}

// Добавить поле для нового варианта ответа
function addAnswerOptionInput() {
    const container = document.getElementById('answer-options');
    const index = container.children.length;
    
    const div = document.createElement('div');
    div.className = 'answer-option-input';
    div.innerHTML = `
        <input type="text" placeholder="Вариант ответа ${index + 1}" data-option="${index}">
        <input type="checkbox" data-option="${index}"> Правильный
    `;
    container.appendChild(div);
}

// Добавить вопрос к тесту
async function addQuestionToTest() {
    const questionText = document.getElementById('question-text').value;
    const points = document.getElementById('question-points').value;
    const imageFile = document.getElementById('question-image').files[0];
    
    if (!questionText) {
        document.getElementById('question-error').textContent = 'Введите текст вопроса';
        document.getElementById('question-error').classList.remove('hidden');
        return;
    }
    
    const optionInputs = document.querySelectorAll('#answer-options input[type="text"]');
    const checkboxes = document.querySelectorAll('#answer-options input[type="checkbox"]');
    
    const options = [];
    let hasCorrectAnswer = false;
    
    optionInputs.forEach((input, index) => {
        if (input.value.trim()) {
            const isCorrect = checkboxes[index].checked;
            if (isCorrect) hasCorrectAnswer = true;
            options.push({
                text: input.value.trim(),
                is_correct: isCorrect
            });
        }
    });
    
    if (options.length < 2) {
        document.getElementById('question-error').textContent = 'Добавьте минимум 2 варианта ответа';
        document.getElementById('question-error').classList.remove('hidden');
        return;
    }
    
    if (!hasCorrectAnswer) {
        document.getElementById('question-error').textContent = 'Отметьте правильный ответ';
        document.getElementById('question-error').classList.remove('hidden');
        return;
    }
    
    try {
        let imageUrl = null;
        
        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);
            
            const uploadResponse = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                imageUrl = uploadData.url;
            }
        }
        
        const correctOption = options.find(o => o.is_correct);
        
        const questionResponse = await fetch(`${API_URL}/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                test_id: currentTestId,
                question_text: questionText,
                question_type: 'multiple_choice',
                points: parseInt(points),
                correct_answer: correctOption.text,
                image_url: imageUrl
            })
        });
        
        if (!questionResponse.ok) {
            throw new Error('Ошибка создания вопроса');
        }
        
        const question = await questionResponse.json();
        
        const optionsResponse = await fetch(`${API_URL}/questions/options`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                question_id: question.id,
                options: options
            })
        });
        
        if (!optionsResponse.ok) {
            throw new Error('Ошибка добавления вариантов ответа');
        }
        
        questionsAdded++;
        document.getElementById('questions-added-count').textContent = `Добавлено вопросов: ${questionsAdded}`;
        document.getElementById('question-error').classList.add('hidden');
        
        document.getElementById('question-text').value = '';
        document.getElementById('question-points').value = '1';
        document.getElementById('question-image').value = '';
        document.getElementById('image-preview').innerHTML = '';
        
        const container = document.getElementById('answer-options');
        container.innerHTML = `
            <div class="answer-option-input">
                <input type="text" placeholder="Вариант ответа 1" data-option="0">
                <input type="checkbox" data-option="0"> Правильный
            </div>
            <div class="answer-option-input">
                <input type="text" placeholder="Вариант ответа 2" data-option="1">
                <input type="checkbox" data-option="1"> Правильный
            </div>
            <div class="answer-option-input">
                <input type="text" placeholder="Вариант ответа 3" data-option="2">
                <input type="checkbox" data-option="2"> Правильный
            </div>
            <div class="answer-option-input">
                <input type="text" placeholder="Вариант ответа 4" data-option="3">
                <input type="checkbox" data-option="3"> Правильный
            </div>
        `;
        
    } catch (err) {
        console.error('Ошибка добавления вопроса:', err);
        document.getElementById('question-error').textContent = 'Ошибка добавления вопроса';
        document.getElementById('question-error').classList.remove('hidden');
    }
}

// Завершить добавление вопросов
function finishAddingQuestions() {
    if (questionsAdded === 0) {
        if (!confirm('Вы не добавили ни одного вопроса. Завершить создание теста?')) {
            return;
        }
    }
    
    alert(`Тест создан! Добавлено вопросов: ${questionsAdded}`);
    currentTestId = null;
    questionsAdded = 0;
    showTests();
}

// Начать прохождение теста
async function startTest(testId, testTitle) {
    try {
        const response = await fetch(`${API_URL}/questions/test/${testId}`);
        const questions = await response.json();
        
        if (questions.length === 0) {
            alert('В этом тесте пока нет вопросов');
            return;
        }
        
        currentTestId = testId;
        currentTestQuestions = questions;
        userAnswers = {};
        
        document.getElementById('take-test-title').textContent = testTitle;
        
        const container = document.getElementById('test-questions-container');
        container.innerHTML = '';
        
        questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-card';
            questionDiv.style.marginBottom = '20px';
            
            let imageHTML = '';
            if (question.image_url) {
                imageHTML = `<img src="${question.image_url}" style="max-width: 100%; border-radius: 8px; margin-bottom: 15px;">`;
            }
            
            let optionsHTML = '';
            question.options.forEach((option, optIndex) => {
                optionsHTML += `
                    <div class="answer-option" style="padding: 10px; border: 2px solid #ddd; border-radius: 8px; margin-bottom: 8px; cursor: pointer;" 
                         onclick="selectAnswer(${question.id}, ${optIndex}, '${option.option_text.replace(/'/g, "\\'")}')">
                        <input type="radio" name="question-${question.id}" value="${option.option_text}" id="q${question.id}-opt${optIndex}">
                        <label for="q${question.id}-opt${optIndex}" style="cursor: pointer; margin-left: 8px;">${option.option_text}</label>
                    </div>
                `;
            });
            
            questionDiv.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 10px;">Вопрос ${index + 1}: ${question.question_text}</div>
                <div style="color: #999; font-size: 12px; margin-bottom: 10px;">Баллов: ${question.points}</div>
                ${imageHTML}
                ${optionsHTML}
            `;
            
            container.appendChild(questionDiv);
        });
        
        showSection('take-test-section');
    } catch (err) {
        console.error('Ошибка загрузки теста:', err);
        alert('Ошибка загрузки теста');
    }
}

// Выбрать ответ
function selectAnswer(questionId, optionIndex, answerText) {
    document.getElementById(`q${questionId}-opt${optionIndex}`).checked = true;
    userAnswers[questionId] = answerText;
}

// Отправить ответы на тест
async function submitTest() {
    const answeredCount = Object.keys(userAnswers).length;
    const totalQuestions = currentTestQuestions.length;
    
    if (answeredCount < totalQuestions) {
        if (!confirm(`Вы ответили на ${answeredCount} из ${totalQuestions} вопросов. Отправить?`)) {
            return;
        }
    }
    
    let correctCount = 0;
    let totalPoints = 0;
    
    currentTestQuestions.forEach(question => {
        totalPoints += question.points;
        const userAnswer = userAnswers[question.id];
        if (userAnswer && userAnswer === question.correct_answer) {
            correctCount++;
        }
    });
    
    const score = ((correctCount / totalQuestions) * 100).toFixed(1);
    
    showResults(score, correctCount, totalQuestions);
}

// Показать результаты
function showResults(score, correct, total) {
    const resultDiv = document.getElementById('result-content');
    
    let message = '';
    if (score >= 80) {
        message = '🎉 Отлично!';
    } else if (score >= 60) {
        message = '👍 Хорошо!';
    } else {
        message = '📚 Нужно еще поработать';
    }
    
    resultDiv.innerHTML = `
        <div style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); padding: 30px; border-radius: 15px; text-align: center; color: white;">
            <div style="font-size: 48px; font-weight: bold; margin: 20px 0;">${score}%</div>
            <div style="font-size: 24px; margin-bottom: 10px;">${message}</div>
            <div style="font-size: 18px;">Правильных ответов: ${correct} из ${total}</div>
        </div>
    `;
    
    showSection('results-section');
}

// Показать секции
function showLogin() {
    document.getElementById('auth-error').classList.add('hidden');
    showSection('auth-section');
}

function showRegister() {
    document.getElementById('register-error').classList.add('hidden');
    showSection('register-section');
}

function showTests() {
    loadTests();
    showSection('tests-section');
}

function showCreateTest() {
    document.getElementById('create-error').classList.add('hidden');
    showSection('create-test-section');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    token = null;
    currentUser = null;
    document.getElementById('create-test-btn').classList.add('hidden');
    showLogin();
}

// Preview изображения
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const imageInput = document.getElementById('question-image');
        if (imageInput) {
            imageInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                const preview = document.getElementById('image-preview');
                
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; border-radius: 8px; border: 2px solid #ddd;">`;
                    };
                    reader.readAsDataURL(file);
                } else {
                    preview.innerHTML = '';
                }
            });
        }
    }, 100);
});

// Инициализация
if (token && currentUser) {
    document.getElementById('user-email').textContent = currentUser.email;
    if (currentUser.role === 'teacher') {
        document.getElementById('create-test-btn').classList.remove('hidden');
    }
    showTests();
} else {
    showLogin();
}
