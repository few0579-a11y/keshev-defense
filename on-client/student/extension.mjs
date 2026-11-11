// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('div');
      root.className = 'student-identity';

      const modeLabel = (resource) => {
        const mode = resource?.mode ?? resource?.meta?.mode ?? 'unknown';
        const labels = {
          connected: '연결됨',
          demo: '예제 자료(demo) · 실제 연결 아님',
          disconnected: '연결 없음(disconnected)',
          unknown: '연결 상태 확인 불가(unknown)',
        };
        return labels[mode] ?? `연결 상태 확인 불가(${String(mode)})`;
      };
      const deviceStatus = (value) => ({
        compliant: '보안 기준 충족 (compliant)',
        noncompliant: '보안 기준 미충족 (noncompliant)',
        unknown: '확인 불가 (unknown)',
      }[value] ?? `확인 불가 (${String(value ?? 'unknown')})`);
      const sessionStatus = (value) => ({
        active: '활성 (active)',
        expired: '만료 (expired)',
        revoked: '철회됨 (revoked)',
        unknown: '확인 불가 (unknown)',
      }[value] ?? `확인 불가 (${String(value ?? 'unknown')})`);
      const line = (parent, label, value) => {
        const p = document.createElement('p');
        p.textContent = `${label}: ${value == null || value === '' ? '확인 불가' : String(value)}`;
        parent.append(p);
      };
      const startSection = (title, resource) => {
        const section = document.createElement('section');
        const heading = document.createElement('h3');
        heading.textContent = title;
        section.append(heading);
        const mode = document.createElement('p');
        mode.textContent = `연결 모드: ${modeLabel(resource)}`;
        section.append(mode);
        root.append(section);
        return section;
      };
      const showState = (section, resource, title, drawData) => {
        if (resource?.status === 'loading') {
          line(section, '상태', `${title} 불러오는 중…`);
        } else if (resource?.status === 'error') {
          line(section, '상태', `${title} 정보를 불러오지 못했습니다: ${resource.error?.message || '오류 내용을 확인할 수 없습니다.'}`);
        } else if (resource?.status === 'ok') {
          drawData(resource.data);
        } else {
          line(section, '상태', `${title} 상태를 확인할 수 없습니다.`);
        }
      };

      const identitySection = startSection('사용자 · 현재 기기 · 현재 세션', me);
      showState(identitySection, me, '사용자·기기·세션', (data) => {
        const user = data?.user;
        const device = data?.device;
        const session = data?.session;
        line(identitySection, '사용자 이름', user?.label);
        line(identitySection, '사용자 ID', user?.id);
        line(identitySection, '현재 기기 이름', device?.label);
        line(identitySection, '현재 기기 ID', device?.id);
        line(identitySection, '현재 기기 상태', deviceStatus(device?.status));
        line(identitySection, '현재 세션 ID', session?.id);
        line(identitySection, '현재 세션 상태', sessionStatus(session?.status));
      });

      const deviceSection = startSection('기기 목록', devices);
      showState(deviceSection, devices, '기기 목록', (data) => {
        if (!Array.isArray(data) || data.length === 0) {
          line(deviceSection, '목록', Array.isArray(data) ? '등록된 기기가 없습니다.' : '기기 목록 형식을 확인할 수 없습니다.');
          return;
        }
        for (const device of data) {
          const item = document.createElement('article');
          line(item, '기기 이름', device?.label);
          line(item, '기기 ID', device?.id);
          line(item, '기기 상태', deviceStatus(device?.status));
          deviceSection.append(item);
        }
      });

      const sessionSection = startSection('세션 목록', sessions);
      showState(sessionSection, sessions, '세션 목록', (data) => {
        if (!Array.isArray(data) || data.length === 0) {
          line(sessionSection, '목록', Array.isArray(data) ? '표시할 세션이 없습니다.' : '세션 목록 형식을 확인할 수 없습니다.');
          return;
        }
        for (const session of data) {
          const item = document.createElement('article');
          line(item, '세션 ID', session?.id);
          line(item, '세션 상태', sessionStatus(session?.status));
          sessionSection.append(item);
        }
      });

      return root;
    },
    renderDecision({ status, mode, data, error, appId } = {}) {
      const root = document.createElement('div');
      root.className = 'student-decision';

      const valueText = (value) => {
        if (value == null || value === '') return '제공되지 않음';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        try {
          return JSON.stringify(value) ?? String(value);
        } catch {
          return String(value);
        }
      };
      const line = (label, value) => {
        const p = document.createElement('p');
        p.textContent = `${label}: ${value}`;
        root.append(p);
      };
      const modeLabels = {
        connected: '연결됨 (connected)',
        demo: '예제 자료(demo) · 실제 연결이 아닙니다',
        disconnected: '연결 없음(disconnected) · 연결 성공이 아닙니다',
        unknown: '연결 상태 확인 불가(unknown)',
      };
      const modeLabel = modeLabels[mode] ?? `연결 상태 확인 불가(${valueText(mode)})`;

      line('연결 모드', modeLabel);
      if (mode === 'connected') {
        line('연결 모드 안내', '이 모드는 판정 응답의 연결 상태이며, 앱 접근 성공을 뜻하지 않습니다.');
      }

      if (status === 'idle') {
        line('상태', '아직 판정 요청 전입니다. 앱을 선택해 접근 요청을 하세요.');
      } else if (status === 'loading') {
        line('상태', '접근 판정을 확인하는 중입니다.');
      } else if (status === 'ok') {
        const decisions = {
          allow: '접근 허용(allow)',
          deny: '접근 거부(deny)',
          challenge: '추가 확인 필요(challenge)',
          unknown: '확인 불가(unknown)',
        };
        const rawDecision = data?.decision;
        const knownDecision = typeof rawDecision === 'string' && Object.hasOwn(decisions, rawDecision);
        const decisionLabel = knownDecision
          ? decisions[rawDecision]
          : `확인 불가(unknown) · 입력값: ${valueText(rawDecision)}`;

        line('상태', '판정 응답을 받았습니다.');
        line('요청 앱 ID', valueText(appId));
        line('응답 앱 ID', valueText(data?.appId));
        line('판정', decisionLabel);
        line('사유', valueText(data?.reason));
        line('확인 시각', valueText(data?.checkedAt));

        if (rawDecision === 'allow') {
          line('판정 안내', '정책상 접근 허용 판정입니다. 실제 앱 접속 성공을 뜻하지는 않습니다.');
        } else if (rawDecision === 'challenge') {
          line('판정 안내', '추가 확인이 필요하다는 판정입니다. 이 앱이 추가 인증을 대신 수행하는 것은 아닙니다.');
        }
      } else if (status === 'error') {
        const message = typeof error?.message === 'string' && error.message.length > 0
          ? error.message
          : '오류 내용을 확인할 수 없습니다.';
        line('상태', `접근 요청에 실패했습니다: ${message}`);
        line('안내', '요청 실패는 접근 거부 판정이 아닙니다.');
      } else {
        line('상태', `판정 상태를 확인할 수 없습니다 (${valueText(status)}).`);
      }

      return root;
    },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
