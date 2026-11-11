# 내 보안 Agent 시작 틀 0.2.21

이 보안 Agent는 회사 직원이 자기 로그인 상태, 업무 앱 접속 결과, 최근 접속 기록과 보안 경보를 보는 보안 앱입니다. 13단계부터 22단계까지 이 프로젝트 하나로 화면을 채워 가며 완성합니다. 처음이라면 docs/GETTING_STARTED_STUDENT.md부터 읽습니다. 무엇을 왜 만드는지와 단계별 순서가 그 문서에 있습니다.

이 시작 틀을 받은 것만으로 단계를 통과하지 않습니다. 단계마다 docs/STUDENT_PROMPTS.md의 안내를 수업용 AI에 붙여 넣어 student/extension.mjs를 고치고, 화면에서 확인하고, 커밋한 뒤 ALEPH에 제출합니다. 제출하면 서버가 그 커밋의 코드를 받아 AI가 단계 과제 기준으로 읽고 판정합니다. 코드를 실행해서 판정하지 않습니다.

## 켜기

검수 환경은 Node.js 24.19.0이며 외부 npm 의존성이 없습니다. 이 폴더의 PowerShell에서 아래를 실행하고 PC 브라우저로 http://127.0.0.1:5189 를 엽니다. 자세한 켜기·끄기·다시 켜기는 docs/STUDENT_LAUNCH_GUIDE.md에 있습니다.

    powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1

npm start도 같은 서버를 켭니다. 기본 실행은 실제 회사 시스템(기존 엔진)에 연결되지 않은 상태입니다. npm run demo는 예제 자료로 화면을 보여 줄 뿐이며 실제 연결이나 성취가 아닙니다. npm run check는 student/extension.mjs의 문법만 확인합니다.

## 21단계 학생 실행서

[docs/STUDENT_RUNBOOK.md](docs/STUDENT_RUNBOOK.md)는 이 프로젝트의 목적과 현재 코드 범위, 실행 환경, 폴더 구조, 시작·종료 절차, 제공 코드와 학생 구현의 경계, 구성도 및 오류 대응을 정리합니다. 실제 실행이나 연결을 확인하지 않은 항목은 미확인으로 구분합니다.

앱은 브라우저 UI(`public/app.js`)와 학생 렌더 확장(`student/extension.mjs`), 로컬 서버(`src/server.mjs`)로 구성되며, 서버가 설정된 엔진·AI·패키지 조회 모듈에 요청을 전달합니다. 이 경계가 실제 SDP/XDR·AI·OSV 연결 성공을 뜻하지는 않습니다.

프로젝트 metadata는 Node.js 24.19.0을 지정하고, 실행 스크립트는 Node.js 22~24를 허용합니다. 이 PC에는 Node.js v26.13.0도 설치되어 있지만 허용 범위 밖이므로 프로젝트 지원 버전이 아닙니다. 문서 조사에서는 npm 11.20.0도 읽었으며, 실제 실행에서는 사용자가 Node.js 24.19.0 ZIP을 현재 PowerShell PATH에서 선택했습니다. 5190 포트의 로컬 서버 시작, Ctrl+C 종료, 이후 재실행 및 Chrome 화면 표시를 확인했지만, 한 차례의 재실행 직후 HTTP 실패와 Listen 항목 부재도 관측됐으며 원인은 미확인입니다. 기존 서버·에이전트 연결 성공을 뜻하지는 않습니다. 자세한 실제 결과와 미확인 범위는 학생 실행서를 참고하세요.

## 지킬 것

- 기존 1~3차 프로젝트와 학생 파일은 지우거나 덮어쓰지 않습니다. 새 폴더에서 시작하거나, 이미 하던 프로젝트를 이어 씁니다.
- AI 열쇠·비밀번호·토큰을 코드, 커밋, 캡처, 도움정보에 넣지 않습니다. 주소나 열쇠를 직접 입력하는 칸도 만들지 않습니다.
- .env.example에는 비밀 없는 설정만 있습니다.

## 더 읽을 곳

- 단계별 안내와 AI에 붙여 넣을 문장: docs/STUDENT_PROMPTS.md
- 단계별 확인 항목: docs/CURRICULUM.json, docs/IMPLEMENTATION_CONTRACT.md
- 오류 코드별 해결: docs/CONNECTION_TROUBLESHOOT.md
- 시작 틀 업데이트(내 파일 보존): docs/STARTER_UPDATE.md
- 실제 회사 시스템(SDP)·앱 안 AI 연결은 담당자가 따로 안내할 때만 씁니다: docs/SDP_HOST_CONNECTION.md, docs/AI_SETUP_GUIDE.md. 이 연결은 앱을 처음 켜고 13~16단계 화면을 만들거나 공식 AI 코드 판정을 받기 위한 전제 조건은 아닙니다. 다만 17단계 이후의 실제 연결과 새 환경 재현은 해당 단계의 기준에 따라 따로 확인합니다.
