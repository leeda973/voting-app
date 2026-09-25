<!-- BEGIN:nextjs-agent-rules -->

# 이 Next.js는 당신이 아는 Next.js가 아니다

이 버전에는 호환되지 않는 변경 사항이 있다. API, 관례, 파일 구조가 모두 학습 데이터와 다를 수 있다. 코드를 작성하기 전에 `node_modules/next/dist/docs/`에서 관련 가이드를 읽어라(이 파일이 있는 디렉터리를 기준으로 찾는다. 모노레포에서는 저장소 루트에서 `next` 패키지가 보이지 않을 수 있다). 지원 중단(deprecation) 안내를 따르라.

이 블록은 `next dev`가 작성하고 다시 추가한다. `node_modules/next/dist/server/lib/generate-agent-files.js`에서 확인할 수 있다. diff에서 이 블록을 지워도 커밋되지 않은 변경이 다시 생길 뿐이니, 작업과 함께 커밋하면 작업 트리가 깨끗하게 유지된다.

<!-- END:nextjs-agent-rules -->
