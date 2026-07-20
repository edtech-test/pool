# C Pool Tutor

Интерактивный тренажер по C для подготовки к проектам бассейна Школы 21.

Первая версия содержит урок `Hello, AI!`:

- код с комментариями;
- кликабельные элементы кода;
- всплывающие подсказки;
- анимацию печати текста в подсказке;
- чистый вариант кода для сдачи.

## Как открыть локально

Открой файл `index.html` в браузере.

## Как опубликовать на GitHub Pages

1. Создай новый публичный репозиторий на GitHub, например `c-pool-tutor`.
2. Загрузи в него файлы из этой папки.
3. Открой Settings -> Pages.
4. В Source выбери Deploy from a branch.
5. Выбери branch `main` и folder `/root`.
6. После сохранения GitHub покажет ссылку на сайт.

## Как подключить Firebase Firestore

1. Создай проект в Firebase.
2. Создай Firestore Database.
3. В настройках проекта добавь Web app.
4. Скопируй объект `firebaseConfig`.
5. Вставь значения в файл `firebase-config.js`.

После этого курс начнет отправлять ответы в коллекцию `answers`, а прогресс - в коллекцию `progress`.

Для тестового старта можно использовать такие правила Firestore, но для публичного курса их нужно будет ужесточить:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /answers/{doc} {
      allow create: if true;
      allow read: if true;
    }
    match /progress/{studentId} {
      allow read, write: if true;
    }
    match /students/{studentId} {
      allow read, write: if true;
    }
  }
}
```
