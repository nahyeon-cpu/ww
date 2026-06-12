# 식품 유통기한 관리

Firebase Realtime Database와 Vercel 배포를 기준으로 만든 모바일 우선 웹앱입니다.
다운로드 용량을 줄이기 위해 npm, 빌드 도구, Firebase SDK, Firebase Storage를 사용하지 않고 정적 파일과 REST API만 사용합니다.

## 파일 구성

- `index.html`: 화면 구조
- `styles.css`: 노란색/흰색 모바일 우선 디자인
- `app.js`: 로그인, 식품 관리, 통계, Firebase REST 연동
- `firebase-rules.json`: Realtime Database 규칙 예시

## Firebase 설정

1. Firebase 콘솔에서 프로젝트를 만듭니다.
2. Realtime Database를 생성합니다.
3. `app.js` 맨 위의 `databaseURL`을 내 DB 주소로 바꿉니다.

```js
const firebaseConfig = {
  databaseURL: "https://내프로젝트-default-rtdb.firebaseio.com"
};
```

4. Firebase 콘솔의 Realtime Database 규칙에 `firebase-rules.json` 내용을 참고해서 적용합니다.

## Vercel 배포

이 폴더를 GitHub 저장소에 올린 뒤 Vercel에서 Import 하면 됩니다.
빌드 명령어는 비워두고, Output Directory도 비워두면 정적 사이트로 배포됩니다.

## 용량 최소화 방식

- Firebase Storage를 사용하지 않습니다.
- 이미지 업로드 기능을 넣지 않았습니다.
- Firebase SDK를 받지 않고 Realtime Database REST API만 호출합니다.
- 데이터 키를 짧게 저장합니다.
  - `n`: 식품명
  - `e`: 유통기한
  - `c`: 카테고리
  - `q`: 수량
  - `m`: 메모
  - `s`: 상태
  - `ca`: 생성 시각
  - `da`: 폐기 시각
- 빈 메모는 저장하지 않습니다.
- 홈, 목록, 통계를 한 번에 계산해서 불필요한 화면 이동과 추가 다운로드를 줄였습니다.

## 주의

이 앱은 과제/프로토타입에 맞춰 이름과 8자리 숫자 비밀번호로 로그인합니다.
실제 서비스라면 Firebase Authentication을 쓰는 편이 더 안전합니다.
