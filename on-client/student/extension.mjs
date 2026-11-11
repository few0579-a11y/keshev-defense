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
    renderEvents({ status, mode, data, error } = {}) {
      const root = document.createElement('div');
      root.className = 'student-events';

      const valueText = (value, fallback = '확인 불가') => {
        if (value == null || value === '') return fallback;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
          return String(value);
        }
        try {
          return JSON.stringify(value) ?? fallback;
        } catch {
          return fallback;
        }
      };
      const line = (parent, label, value) => {
        const item = document.createElement('p');
        item.textContent = `${label}: ${value}`;
        parent.append(item);
      };
      const modeLabels = {
        connected: '연결됨 (connected) · 실제 앱 접근 성공을 뜻하지 않습니다',
        demo: '예제 자료(demo) · 실제 조회 성공이나 실제 기록이 아닙니다',
        disconnected: '연결 없음(disconnected) · 조회 성공이 아닙니다',
        unknown: '연결 상태 확인 불가(unknown)',
      };
      const modeValue = mode ?? 'unknown';
      const modeLabel = Object.hasOwn(modeLabels, modeValue)
        ? modeLabels[modeValue]
        : `연결 상태 확인 불가(${valueText(modeValue)})`;
      line(root, '연결 모드', modeLabel);

      if (status === 'loading') {
        line(root, '상태', '기록을 불러오는 중입니다.');
      } else if (status === 'ok') {
        if (!Array.isArray(data)) {
          line(root, '상태', '확인 불가: 기록 데이터 형식을 확인할 수 없습니다.');
        } else if (data.length === 0) {
          line(root, '상태', '표시할 기록이 없습니다.');
        } else {
          line(root, '상태', '기록을 확인했습니다.');
          const events = [...data].sort((left, right) => {
            const leftAt = Date.parse(left?.at);
            const rightAt = Date.parse(right?.at);
            const safeLeftAt = Number.isFinite(leftAt) ? leftAt : Number.NEGATIVE_INFINITY;
            const safeRightAt = Number.isFinite(rightAt) ? rightAt : Number.NEGATIVE_INFINITY;
            if (safeLeftAt === safeRightAt) return 0;
            return safeLeftAt > safeRightAt ? -1 : 1;
          });

          const filters = document.createElement('div');
          filters.className = 'student-event-filters';
          const listStatus = document.createElement('p');
          listStatus.setAttribute('aria-live', 'polite');
          const list = document.createElement('div');
          list.className = 'student-event-list';
          const detailRegion = document.createElement('section');
          detailRegion.className = 'student-event-detail-region';
          root.append(filters, listStatus, list, detailRegion);

          const eventId = (event) => valueText(event?.id, '');
          const eventAppId = (event) => event?.appId == null || event.appId === '' ? null : event.appId;
          const rawOptionKey = (value) => String(value);
          let selectedEventId = null;

          const missingFilterToken = (prefix, rawValues) => {
            const occupied = new Set(rawValues.filter((value) => value != null && value !== '').map(rawOptionKey));
            let token = prefix;
            while (token === 'all' || occupied.has(token)) token += '_';
            return token;
          };
          const createFilter = ({ accessibleName, valuesFor, missingLabel }) => {
            const label = document.createElement('label');
            label.textContent = accessibleName;
            const select = document.createElement('select');
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = '전체';
            select.append(allOption);

            const values = [];
            const seen = new Set();
            let hasMissing = false;
            for (const event of events) {
              const value = valuesFor(event);
              if (value == null || value === '') {
                hasMissing = true;
                continue;
              }
              const key = rawOptionKey(value);
              if (!seen.has(key)) {
                seen.add(key);
                values.push(value);
              }
            }
            for (const value of values) {
              const option = document.createElement('option');
              option.value = rawOptionKey(value);
              option.textContent = rawOptionKey(value);
              select.append(option);
            }
            let missingToken = null;
            if (hasMissing) {
              missingToken = missingFilterToken(`__student_missing_${accessibleName.replaceAll(' ', '_')}__`, values);
              const missingOption = document.createElement('option');
              missingOption.value = missingToken;
              missingOption.textContent = missingLabel;
              select.append(missingOption);
            }
            label.append(select);
            filters.append(label);
            return {
              select,
              missingToken,
              matches(value, selectedValue) {
                if (selectedValue === 'all') return true;
                if (value == null || value === '') return selectedValue === missingToken;
                return rawOptionKey(value) === selectedValue;
              },
            };
          };

          const kindFilter = createFilter({
            accessibleName: '기록 종류',
            valuesFor: (event) => event?.kind,
            missingLabel: '종류 확인 불가 (값 없음)',
          });
          const appFilter = createFilter({
            accessibleName: '업무 앱',
            valuesFor: eventAppId,
            missingLabel: '앱 확인 불가 (appId 없음)',
          });
          const accessFilter = createFilter({
            accessibleName: '접속 상태',
            valuesFor: (event) => event?.state?.access,
            missingLabel: '접속 상태 확인 불가 (값 없음)',
          });

          const stateDescription = (field, rawValue) => {
            const value = rawValue == null || rawValue === '' ? 'unknown' : String(rawValue);
            const descriptions = {
              access: {
                allowed: '접속 허용',
                denied: '접속 거부',
                unknown: '확인 불가(unknown)',
              },
              session: {
                active: '활성',
                expired: '만료',
                revoked: '철회됨',
                unknown: '확인 불가(unknown)',
              },
              device: {
                compliant: '보안 기준 충족',
                noncompliant: '보안 기준 미충족',
                unknown: '확인 불가(unknown)',
              },
            };
            return `${value} — ${descriptions[field][value] ?? `확인 불가(${value})`}`;
          };
          const showDetail = (event) => {
            const detail = document.createElement('section');
            detail.setAttribute('data-student-event-detail', eventId(event));
            const heading = document.createElement('h3');
            heading.textContent = `기록 상세: ${eventId(event)}`;
            detail.append(heading);
            line(detail, '사건 ID', valueText(event?.id));
            const appId = eventAppId(event);
            line(detail, 'appId', appId == null ? '앱 확인 불가' : valueText(appId));

            const evidenceHeading = document.createElement('h4');
            evidenceHeading.textContent = '근거 (evidence)';
            detail.append(evidenceHeading);
            if (Array.isArray(event?.evidence) && event.evidence.length > 0) {
              for (const evidence of event.evidence) {
                const item = document.createElement('article');
                line(item, '근거 ID', valueText(evidence?.id));
                line(item, '근거 내용', valueText(evidence?.text));
                detail.append(item);
              }
            } else {
              line(detail, '근거', '제공된 근거가 없습니다.');
            }

            const rulesHeading = document.createElement('h4');
            rulesHeading.textContent = '규칙 (rules)';
            detail.append(rulesHeading);
            if (Array.isArray(event?.rules) && event.rules.length > 0) {
              for (const rule of event.rules) {
                const item = document.createElement('article');
                line(item, '규칙 ID', valueText(rule?.id));
                line(item, '규칙 내용', valueText(rule?.text));
                detail.append(item);
              }
            } else {
              line(detail, '규칙', '제공된 규칙이 없습니다.');
            }

            const stateHeading = document.createElement('h4');
            stateHeading.textContent = '현재 상태';
            detail.append(stateHeading);
            line(detail, '접속 상태 (state.access)', stateDescription('access', event?.state?.access));
            line(detail, '세션 상태 (state.session)', stateDescription('session', event?.state?.session));
            line(detail, '기기 상태 (state.device)', stateDescription('device', event?.state?.device));
            detailRegion.replaceChildren(detail);
          };

          const renderList = () => {
            const visibleEvents = events.filter((event) =>
              kindFilter.matches(event?.kind, kindFilter.select.value)
              && appFilter.matches(eventAppId(event), appFilter.select.value)
              && accessFilter.matches(event?.state?.access, accessFilter.select.value));
            listStatus.textContent = `${visibleEvents.length}건 표시 / 전체 ${events.length}건`;
            list.replaceChildren();

            if (visibleEvents.length === 0) {
              const empty = document.createElement('p');
              empty.textContent = '선택한 조건에 맞는 기록이 없습니다.';
              list.append(empty);
              selectedEventId = null;
              detailRegion.replaceChildren();
              return;
            }

            const stillVisible = selectedEventId == null
              ? null
              : visibleEvents.find((event) => eventId(event) === selectedEventId);
            if (selectedEventId != null && !stillVisible) {
              selectedEventId = null;
              detailRegion.replaceChildren();
            } else if (stillVisible) {
              showDetail(stillVisible);
            }

            for (const event of visibleEvents) {
              const row = document.createElement('article');
              row.setAttribute('data-student-event-id', eventId(event));

              const kindCode = valueText(event?.kind);
              const kindLabel = event?.kind === 'access'
                ? '접속 기록'
                : event?.kind === 'xdr'
                  ? 'XDR 경보'
                  : '확인 불가';
              const appLabel = eventAppId(event) == null
                ? '앱 확인 불가'
                : valueText(event.appId);

              line(row, 'ID', valueText(event?.id));
              line(row, '시각', valueText(event?.at));
              line(row, '종류', `${kindLabel} (${kindCode})`);
              line(row, '업무 앱', appLabel);
              line(row, '요약', valueText(event?.summary));

              const button = document.createElement('button');
              button.type = 'button';
              button.textContent = `${eventId(event)} 상세`;
              button.addEventListener('click', () => {
                selectedEventId = eventId(event);
                showDetail(event);
              });
              row.append(button);
              list.append(row);
            }
          };

          kindFilter.select.addEventListener('change', renderList);
          appFilter.select.addEventListener('change', renderList);
          accessFilter.select.addEventListener('change', renderList);
          renderList();
        }
      } else if (status === 'error') {
        const message = typeof error?.message === 'string' && error.message.trim().length > 0
          ? error.message
          : '오류 내용을 확인할 수 없습니다.';
        const unverifiable = error?.code === 'CONTRACT_MISMATCH'
          || error?.code === 'ENGINE_RESULT_UNVERIFIED';
        if (unverifiable) {
          line(root, '상태', '확인 불가');
        } else {
          line(root, '상태', '기록을 불러오지 못했습니다.');
        }
        line(root, '오류', `기록을 불러오지 못했습니다: ${message}`);
      } else {
        line(root, '상태', `기록 상태를 확인할 수 없습니다 (${valueText(status)}).`);
      }

      return root;
    },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
