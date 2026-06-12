# GitHub 업로드 및 Firebase 설정 안내

## GitHub에 올릴 파일

아래 파일을 모두 GitHub 저장소에 올리면 됩니다.

```text
food-expiry-app/
  index.html
  styles.css
  app.js
  firebase-rules.json
  README.md
  GITHUB_FIREBASE_GUIDE.md
  .gitignore
```

`node_modules`나 Firebase SDK 파일은 필요 없습니다.
이 앱은 다운로드 용량을 줄이기 위해 정적 파일과 Firebase Realtime Database REST API만 사용합니다.

## Firebase Realtime Database 주소 넣기

`app.js` 맨 위의 주소를 본인 Firebase Realtime Database 주소로 바꾸세요.

```js
const firebaseConfig = {
  databaseURL: "https://내프로젝트-default-rtdb.firebaseio.com"
};
```

Firebase 콘솔에서 Realtime Database를 만들면 위와 비슷한 주소를 확인할 수 있습니다.

## Firebase Realtime Database 규칙

Firebase 콘솔에서 다음 경로로 이동하세요.

```text
Firebase Console > Realtime Database > 규칙
```

그리고 아래 규칙을 붙여넣으면 됩니다.

```json
{
  "rules": {
    "users": {
      "$name": {
        ".read": true,
        ".write": true,
        "p": {
          ".validate": "newData.isString() && newData.val().matches(/^[0-9]{8}$/)"
        },
        "f": {
          "$foodId": {
            ".validate": "newData.hasChildren(['n','e','c','q','s','ca'])",
            "n": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 30"
            },
            "e": {
              ".validate": "newData.isString() && newData.val().matches(/^\\d{4}-\\d{2}-\\d{2}$/)"
            },
            "c": {
              ".validate": "newData.isString()"
            },
            "q": {
              ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 999"
            },
            "m": {
              ".validate": "newData.isString() && newData.val().length <= 80"
            },
            "s": {
              ".validate": "newData.val() === 'active' || newData.val() === 'discarded'"
            },
            "ca": {
              ".validate": "newData.isNumber()"
            },
            "da": {
              ".validate": "newData.isNumber()"
            },
            "$other": {
              ".validate": false
            }
          }
        },
        "$other": {
          ".validate": true
        }
      }
    }
  }
}
```

같은 내용은 `firebase-rules.json` 파일에도 들어 있습니다.

## Vercel 배포 설정

Vercel에서 GitHub 저장소를 Import 하세요.

- Framework Preset: Other
- Build Command: 비워두기
- Output Directory: 비워두기
- Install Command: 비워두기

정적 파일만 있으므로 설치 과정이 필요 없습니다.

## 용량을 적게 쓰는 이유

- Firebase Storage 사용 안 함
- 이미지 업로드 기능 없음
- npm 패키지 없음
- Firebase SDK 다운로드 없음
- 데이터 키를 짧게 저장함
- 빈 메모는 저장하지 않음

## 주의

현재 로그인 방식은 과제용으로 단순하게 만든 이름 + 8자리 숫자 비밀번호 방식입니다.
실제 서비스라면 Firebase Authentication을 사용하는 것이 더 안전합니다.
