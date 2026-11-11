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

            const supportedActions = Array.isArray(event?.supportedActions) ? event.supportedActions : [];
            if (supportedActions.length > 0) {
              const actionsHeading = document.createElement('h4');
              actionsHeading.textContent = '미지원 조치';
              detail.append(actionsHeading);
              line(detail, '안내', '조치 실행 연결은 준비 중입니다.');
              for (const action of supportedActions) {
                const actionButton = document.createElement('button');
                actionButton.type = 'button';
                actionButton.textContent = `${valueText(action, '확인 불가')} 미지원`;
                actionButton.disabled = true;
                detail.append(actionButton);
              }
            }

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
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = document.createElement('div');
      root.className = 'student-status';

      const safeValue = (value) => {
        if (typeof value === 'string' && value.length > 0) return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return '확인 불가';
      };
      const line = (parent, label, value) => {
        const item = document.createElement('p');
        item.textContent = `${label}: ${value}`;
        parent.append(item);
      };
      const section = (title) => {
        const item = document.createElement('section');
        const heading = document.createElement('h3');
        heading.textContent = title;
        item.append(heading);
        root.append(item);
        return item;
      };
      const modeText = (value) => {
        const labels = {
          connected: '연결됨 (connected)',
          demo: '예제 자료(demo) · 실제 연결 성공이 아닙니다',
          disconnected: '연결 없음(disconnected) · 실제 연결 성공이 아닙니다',
          unknown: '연결 상태 확인 불가(unknown)',
        };
        return labels[value] ?? `연결 상태 확인 불가(${safeValue(value)})`;
      };
      const resourceMode = (resource) => resource?.mode ?? resource?.meta?.mode ?? 'unknown';
      const showMode = (parent, label, value) => line(parent, `${label} 모드`, modeText(value));
      const errorDescription = (resource) => {
        const code = typeof resource?.error?.code === 'string' ? resource.error.code : '';
        const message = safeValue(resource?.error?.message);
        const timedOut = /TIMEOUT|TIMED_OUT|ETIMEDOUT|DEADLINE_EXCEEDED/i.test(code);
        return {
          timedOut,
          text: `${timedOut ? '요청 시간이 초과되었습니다.' : '조회에 실패했습니다.'} 오류: ${message}`,
        };
      };
      const retryNotice = (parent) => line(parent, '다시 시도', '자동으로 다시 요청하지 않습니다. 위쪽의 다시 불러오기 버튼을 직접 눌러 다시 시도하세요.');

      line(root, '연결 모드', modeText(mode ?? 'unknown'));

      const deviceSection = section('기기');
      showMode(deviceSection, '기기', resourceMode(devices));
      if (devices?.status === 'loading') {
        line(deviceSection, '상태', '기기를 불러오는 중입니다.');
      } else if (devices?.status === 'ok') {
        if (!Array.isArray(devices.data)) {
          line(deviceSection, '상태', '기기 목록을 확인할 수 없습니다.');
        } else if (devices.data.length === 0) {
          line(deviceSection, '상태', '등록된 기기가 없습니다.');
        } else {
          for (const device of devices.data) {
            const item = document.createElement('article');
            const rawStatus = safeValue(device?.status);
            const statusLabels = {
              compliant: '보안 기준 충족',
              noncompliant: '보안 기준 미충족',
              unknown: '확인 불가',
            };
            line(item, '기기 이름', safeValue(device?.label));
            line(item, '기기 상태', `${statusLabels[rawStatus] ?? '확인 불가'} (${rawStatus})`);
            deviceSection.append(item);
          }
        }
      } else if (devices?.status === 'error') {
        const failure = errorDescription(devices);
        line(deviceSection, '상태', `기기 조회 실패. ${failure.text}`);
        retryNotice(deviceSection);
      } else {
        line(deviceSection, '상태', '기기 상태를 확인할 수 없습니다.');
      }

      const sessionSection = section('세션');
      showMode(sessionSection, '세션', resourceMode(sessions));
      line(sessionSection, '범위', '세션은 현재 검증된 연결 하나를 의미하며, 과거 전체 세션 목록이 아닙니다.');
      if (sessions?.status === 'loading') {
        line(sessionSection, '상태', '세션을 불러오는 중입니다.');
      } else if (sessions?.status === 'ok') {
        if (!Array.isArray(sessions.data)) {
          line(sessionSection, '상태', '세션 정보를 확인할 수 없습니다.');
        } else if (sessions.data.length === 0) {
          line(sessionSection, '상태', '현재 연결이 없습니다.');
        } else {
          for (const session of sessions.data) {
            const item = document.createElement('article');
            const rawStatus = safeValue(session?.status);
            const statusLabels = {
              active: '활성',
              expired: '만료',
              revoked: '철회됨',
              unknown: '확인 불가',
            };
            line(item, '세션 ID', safeValue(session?.id));
            line(item, '세션 상태', `${statusLabels[rawStatus] ?? '확인 불가'} (${rawStatus})`);
            sessionSection.append(item);
          }
        }
      } else if (sessions?.status === 'error') {
        const failure = errorDescription(sessions);
        line(sessionSection, '상태', `세션 조회 실패. ${failure.text}`);
        retryNotice(sessionSection);
      } else {
        line(sessionSection, '상태', '세션 상태를 확인할 수 없습니다.');
      }

      const notificationSection = section('알림');
      if (!Array.isArray(notifications)) {
        line(notificationSection, '상태', '알림 정보를 확인할 수 없습니다.');
      } else if (notifications.length === 0) {
        line(notificationSection, '상태', '주의할 알림이 없습니다.');
      } else {
        for (const notification of notifications) {
          const item = document.createElement('article');
          line(item, '자료(resource)', safeValue(notification?.resource));
          line(item, '코드(code)', safeValue(notification?.code));
          line(item, '메시지(message)', safeValue(notification?.message));
          notificationSection.append(item);
        }
      }

      const diagnosticsSection = section('진단 정보');
      showMode(diagnosticsSection, '진단 정보', resourceMode(diagnostics));
      const diagnosticFields = () => {
        const data = diagnostics?.data;
        return [
          ['requestId', safeValue(data?.requestId)],
          ['component', safeValue(data?.component)],
          ['version', safeValue(data?.version)],
          ['checkedAt', safeValue(data?.checkedAt)],
          ['engine.mode', safeValue(data?.engine?.mode)],
          ['engine.code', safeValue(data?.engine?.code)],
        ];
      };
      if (diagnostics?.status === 'loading') {
        line(diagnosticsSection, '상태', '진단 정보를 불러오는 중입니다.');
      } else if (diagnostics?.status === 'ok') {
        line(diagnosticsSection, '상태', '진단 정보를 확인했습니다.');
        for (const [label, value] of diagnosticFields()) line(diagnosticsSection, label, value);
      } else if (diagnostics?.status === 'error') {
        const failure = errorDescription(diagnostics);
        line(diagnosticsSection, '상태', `진단 정보를 불러오지 못했습니다. ${failure.text}`);
        retryNotice(diagnosticsSection);
      } else {
        line(diagnosticsSection, '상태', '진단 정보를 확인할 수 없습니다.');
      }

      const helpButton = document.createElement('button');
      helpButton.type = 'button';
      helpButton.textContent = '도움정보 복사';
      const copyStatus = document.createElement('p');
      copyStatus.setAttribute('aria-live', 'polite');
      copyStatus.textContent = '도움이 필요할 때 안전한 진단 항목을 직접 복사할 수 있습니다.';
      helpButton.addEventListener('click', async () => {
        const helpText = diagnosticFields().map(([label, value]) => `${label}: ${value}`).join('\n');
        try {
          if (typeof navigator === 'undefined'
              || !navigator.clipboard
              || typeof navigator.clipboard.writeText !== 'function') {
            throw new Error('CLIPBOARD_UNAVAILABLE');
          }
          await navigator.clipboard.writeText(helpText);
          copyStatus.textContent = '도움정보를 복사했습니다.';
        } catch {
          copyStatus.textContent = '도움정보 복사에 실패했습니다. 클립보드를 사용할 수 없습니다.';
        }
      });
      root.append(helpButton, copyStatus);

      return root;
    },
    renderVulnerabilities({ status, mode, data, error } = {}) {
      const root = document.createElement('div');
      root.className = 'student-vulnerabilities';

      const line = (label, value) => {
        const item = document.createElement('p');
        item.textContent = `${label}: ${value}`;
        root.append(item);
      };

      if (status === 'idle' || status == null) {
        line('조회 상태', '조회 전 (idle)');
      } else if (status === 'loading') {
        line('조회 상태', '조회 중 (loading)');
        line('안내', '이전 조회 결과를 현재 결과로 표시하지 않습니다.');
      } else if (status === 'error') {
        const errorMessages = {
          CANCELLED: '패키지 조회를 취소했습니다. 이전 결과는 현재 확인 결과가 아닙니다.',
          REQUEST_CANCELLED: '패키지 조회를 취소했습니다. 이전 결과는 현재 확인 결과가 아닙니다.',
          TIMEOUT: '패키지 조회 응답이 늦어 중단했습니다. 잠시 뒤 직접 다시 조회하세요.',
          REQUEST_TIMEOUT: '패키지 조회 응답이 늦어 중단했습니다. 잠시 뒤 직접 다시 조회하세요.',
          CONTRACT_MISMATCH: '패키지 조회 응답 형식을 확인할 수 없습니다. 결과를 표시하지 않습니다.',
          SERVICE_UNAVAILABLE: '패키지 조회를 지금 처리할 수 없습니다. 잠시 뒤 직접 다시 조회하세요.',
          HOST_REJECTED: '허용되지 않은 접속 주소라 조회하지 않았습니다.',
          ORIGIN_REJECTED: '허용되지 않은 화면에서 온 요청이라 조회하지 않았습니다.',
          REQUEST_INVALID: '조회 요청을 처리할 수 없습니다.'
        };
        const code = typeof error?.code === 'string' && Object.hasOwn(errorMessages, error.code)
          ? error.code : null;
        line('조회 상태', '조회 실패 (error)');
        line('오류 코드', code ?? '확인 불가');
        line('오류 메시지', code
          ? errorMessages[code]
          : '패키지 조회를 확인할 수 없습니다. 결과를 표시하지 않습니다.');
      } else if (status === 'ok') {
        line('조회 상태', '조회 응답 수신 (ok)');
        const labels = {
          complete: '모두 조회',
          partial: '일부 조회 실패',
          not_checked: '아직 조회 안 함',
          not_configured: '조회 대상 프로젝트 설정 없음',
          unverifiable: 'lock 파일 확인 불가'
        };
        const overall = data?.status;
        if (typeof overall === 'string' && Object.hasOwn(labels, overall)) {
          line('전체 조회 상태', `${labels[overall]} (${overall})`);
        } else {
          line('전체 조회 상태', '확인 불가');
        }
        line('안내', '조회 결과가 없다는 사실만으로 패키지나 앱 전체의 안전을 보장할 수 없습니다.');
        if (data) {
          const fields = [
            ['lockfileVersion', data.lockfileVersion],
            ['lockfileHash', data.lockfileHash],
            ['조회 시각 (checkedAt)', data.checkedAt]
          ];

          for (const [label, value] of fields) {
            if (value !== undefined && value !== null && value !== '') {
              line(label, String(value));
            }
          }
        }
        const packageStates = {
          known_vulnerabilities: '알려진 취약점 있음',
          none_found: '조회 범위에서 알려진 취약점 없음',
          unverifiable: '조회 확인 불가'
        };

        const packages = Array.isArray(data?.packages) ? data.packages : [];

        for (const pkg of packages) {
          if (!pkg || typeof pkg !== 'object') continue;

          const row = document.createElement('section');

          if (typeof pkg.name === 'string') {
            row.setAttribute('data-student-package-name', pkg.name);
          }
          if (typeof pkg.version === 'string') {
            row.setAttribute('data-student-package-version', pkg.version);
          }

          const fields = [
            ['패키지 이름', pkg.name],
            ['설치 버전', pkg.version],
            ['조회 상태', `${packageStates[pkg.status] ?? '확인 불가'} (${pkg.status ?? 'unknown'})`],
            ['조회 출처', pkg.source],
            ['확인 시각', pkg.checkedAt]
          ];

          for (const [label, value] of fields) {
            if (value === undefined || value === null || value === '') continue;
            const p = document.createElement('p');
            p.textContent = `${label}: ${value}`;
            row.append(p);
          }
          const vulnerabilities = Array.isArray(pkg.vulnerabilities)
            ? pkg.vulnerabilities : [];

          for (const vuln of vulnerabilities) {
            if (!vuln || typeof vuln !== 'object' || Array.isArray(vuln)) continue;

            const item = document.createElement('p');
            item.textContent = `취약점 ID: ${String(vuln.id ?? '확인 불가')} · 수정 시각: ${String(vuln.modified ?? '확인 불가')}`;
            row.append(item);
          }

          if (pkg.status === 'unverifiable' && vulnerabilities.length > 0) {
            const notice = document.createElement('p');
            notice.textContent = '일부 확인·전체 조회 확인 불가 — 확인된 취약점 ID는 유지합니다.';
            row.append(notice);
          }

          if (pkg.status === 'none_found') {
            const notice = document.createElement('p');
            notice.textContent = '조회 범위에서 알려진 항목이 없다는 뜻이며, 안전을 보장하지 않습니다.';
            row.append(notice);
          }
          root.append(row);
        }

      } else {
        line('조회 상태', '확인할 수 없는 조회 상태');
      }

      return root;
    },
    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted } = {}) {
      const root = document.createElement('div');
      root.className = 'student-ai-connection';

      const line = (label, value) => {
        const item = document.createElement('p');
        item.textContent = `${label}: ${value}`;
        root.append(item);
      };
      const displayValue = (value) => {
        if (typeof value === 'string' && value.trim() !== '') return value.trim();
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return '확인 불가';
      };
      const modeLabels = {
        connected: '연결 경로 표시: connected (이 표시만으로 AI 점검 성공을 뜻하지 않습니다)',
        demo: '예제 자료(demo) · 실제 AI 연결이나 실제 점검 성공이 아닙니다',
        disconnected: '연결 없음(disconnected) · AI 연결 성공이 아닙니다',
        unknown: '연결 상태 확인 불가(unknown)',
      };
      const currentMode = mode ?? 'unknown';
      line('연결 모드', Object.hasOwn(modeLabels, currentMode)
        ? modeLabels[currentMode]
        : '연결 상태 확인 불가(unknown)');

      const errorCodeText = (value) => typeof value === 'string'
        && /^[A-Z][A-Z0-9_.:-]{0,99}$/.test(value)
        ? value
        : '확인 불가';
      const safeErrorMessage = (value) => {
        if (typeof value !== 'string' || value.trim() === '') return '오류 메시지를 확인할 수 없습니다.';
        return value
          .replace(/[\u0000-\u001f\u007f]/g, ' ')
          .replace(/\b(bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[가림]')
          .replace(/\b(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|token|password|passwd|secret|비밀번호|토큰|키)(\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1$2[가림]')
          .replace(/([?&](?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|password|secret)=)[^&#\s]+/gi, '$1[가림]')
          .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[가림]')
          .trim()
          .slice(0, 500);
      };
      const errorGuidance = {
        WB_CLCO_AUTH_REQUIRED: ['인증 확인 필요', '제공 화면의 인증 안내를 확인하세요. 비밀번호·토큰·키를 대화창에 붙여 넣지 마세요.'],
        WB_CLCO_ACCESS_BLOCKED: ['권한 제한', '제공 화면의 권한 안내를 확인하고, 임의로 인증 설정을 바꾸지 마세요.'],
        ON_AI_PROVISIONING_PENDING: ['AI 준비 상태 확인 필요', '제공 화면의 안내를 확인하세요. 준비 상태가 계속되면 오류 문구를 가린 뒤 담당자에게 문의하세요.'],
        WB_CLCO_SESSION_CLOSED: ['이용 시간 또는 세션 상태 안내', '제공 화면에 표시된 이용 시간 안내를 확인하세요.'],
        WB_CLCO_COHORT_BUDGET_EXHAUSTED: ['반 AI 사용량·한도 안내', '비밀값을 가린 화면 문구와 발생 시각, 반 이름을 과제 운영 SKT 담당자에게 보내 상태와 조정 필요 여부를 확인해 주세요.'],
        WB_CLCO_LIMIT_REACHED: ['반 AI 사용량·한도 안내', '비밀값을 가린 화면 문구와 발생 시각, 반 이름을 과제 운영 SKT 담당자에게 보내 상태와 조정 필요 여부를 확인해 주세요.'],
        WB_CLCO_RATE_LIMITED: ['요청 제한', '요청 제한 안내를 확인하세요. 필요하면 제공 화면의 점검 버튼을 직접 눌러 다시 확인하세요.'],
        WB_CLCO_SERVER_UNAVAILABLE: ['서비스 응답 확인 필요', '서비스 상태를 확인하세요. 자동 재점검은 하지 않으며, 필요하면 제공 화면에서 직접 다시 점검하세요.'],
        WB_CLCO_NETWORK_ERROR: ['네트워크 오류', '네트워크 상태와 제공 화면의 안내를 확인한 뒤, 필요하면 직접 다시 점검하세요.'],
        WB_CLCO_TIMEOUT: ['시간 초과', '이번 점검 결과는 확인되지 않았습니다. 제공 화면의 안내를 확인하고 필요하면 직접 다시 점검하세요.'],
        WB_CLCO_CANCELLED: ['점검 취소', '점검이 취소되었습니다. 이는 성공이나 거부 판정이 아닙니다. 필요하면 제공 화면에서 직접 다시 점검하세요.'],
        MODEL_NOT_CONFIGURED: ['모델 설정 확인 필요', '모델 설정 상태를 제공 화면의 안내에 따라 확인하세요. 비밀 키나 토큰을 요청하거나 대화창에 붙여 넣지 마세요.'],
        ON_AI_MODEL_LIST_EMPTY: ['사용 가능한 모델 확인 불가', '모델 목록을 확인할 수 없습니다. 제공 화면의 안내를 따르고, 비밀 키나 토큰을 공유하지 마세요.'],
        ON_AI_AUTHORIZATION_CHANGED: ['권한 상태 변경', '제공 화면의 최신 권한 안내를 확인한 뒤 직접 다시 점검하세요.'],
        ON_AI_TRANSPORT_PENDING: ['AI 전송 경로 확인 불가', '전송 경로 점검이 완료되지 않았습니다. 제공 화면의 안내를 확인하세요.'],
        WB_CLCO_INVALID_RESPONSE: ['응답 확인 불가', '응답을 검증할 수 없습니다. 비밀값을 가린 화면 문구와 발생 시각, 반 이름을 과제 운영 SKT 담당자에게 보내 주세요.'],
        WB_CLCO_REQUEST_FAILED: ['요청 실패', '오류 원인을 여기서 확정할 수 없습니다. 화면 문구에서 키·토큰·비밀번호·개인정보를 가린 뒤, 그 문구와 시각, 반 이름을 과제 운영 SKT 담당자에게 보내 주세요.'],
      };

      if (status === 'idle') {
        line('상태', 'AI 연결 점검 전');
        line('다시 확인', '필요하면 제공 화면의 점검 버튼을 직접 눌러 확인하세요. 자동 점검은 실행하지 않습니다.');
      } else if (status === 'loading') {
        line('상태', 'AI 연결 점검 중');
        line('진행 안내', '이 화면은 점검 결과만 표시하며, 보안 사건 설명을 요청하지 않습니다.');
      } else if (status === 'ok') {
        line('상태', 'AI 연결 점검 결과를 받았습니다.');
        if (data?.transportChecked === true) {
          line('전송 경로 점검', '완료 (transportChecked: true)');
        } else if (data?.transportChecked === false) {
          line('전송 경로 점검', '완료되지 않음 (transportChecked: false)');
        } else {
          line('전송 경로 점검', '확인 불가');
        }

        if (data?.audienceAuthorization === 'test') {
          line('권한 확인', '시험 연결 점검(test)');
        } else if (data?.audienceAuthorization === 'verified') {
          line('권한 확인', '앱 권한 확인 후 점검(verified)');
        } else {
          line('권한 확인', '확인 불가');
        }

        const modelCount = typeof data?.modelCount === 'number' && Number.isFinite(data.modelCount)
          && data.modelCount >= 0
          ? String(data.modelCount)
          : '확인 불가';
        line('모델 수', modelCount);
        line('점검 시각', displayValue(checkedAt));
        line('설명 동의 상태', explanationAccepted === true
          ? '확인됨 (동의는 사건 설명 실행을 뜻하지 않습니다)'
          : explanationAccepted === false
            ? '아직 확인되지 않음'
            : '확인 불가');
        line('사건 설명', '사건 설명은 아직 실행하지 않았습니다. 연결 점검은 모델 목록 확인이며, 보안 사건 설명 호출이나 성공을 확인하지 않습니다.');
      } else if (status === 'error') {
        const code = errorCodeText(error?.code);
        const message = safeErrorMessage(error?.message);
        line('상태', 'AI 연결 점검 실패');
        line('오류 코드', code);
        line('오류 메시지', message);

        const guidance = errorGuidance[code];
        if (guidance) {
          line('오류 구분', guidance[0]);
          line('다음 행동', guidance[1]);
        } else if (code.startsWith('ALEKOV_VAULT_')) {
          line('오류 구분', '열쇠 보관소 관련 안내');
          line('다음 행동', '이 코드에 표시된 안내 절차를 따르세요. 키·토큰·비밀번호 값은 대화창에 붙여 넣지 마세요.');
        } else {
          line('오류 구분', '확인 불가');
          line('다음 행동', '화면 문구에서 키·토큰·비밀번호·개인정보를 가린 뒤, 그 문구와 시각, 반 이름을 과제 운영 SKT 담당자에게 보내 주세요.');
        }
        line('수동 재점검', '자동 재점검은 하지 않습니다. 필요하면 제공 화면의 점검 버튼을 직접 눌러 다시 확인하세요.');
      } else {
        line('상태', 'AI 연결 점검 상태를 확인할 수 없습니다.');
      }

      line('사건 설명 안내', '이 AI 연결 점검에서는 실제 보안 사건 설명을 실행하지 않았습니다.');
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const root = document.createElement('div');
      root.className = 'student-ai-explanation';

      const line = (label, value, parent = root) => {
        const item = document.createElement('p');
        item.textContent = `${label}: ${value}`;
        parent.append(item);
      };
      const displayValue = (value) => {
        if (typeof value === 'string' && value.trim() !== '') return value.trim();
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return '확인 불가';
      };
      const safeErrorCode = (value) => typeof value === 'string'
        && /^[A-Z][A-Z0-9_.:-]{0,99}$/.test(value)
        ? value
        : '확인 불가';
      const safeErrorMessage = (value) => {
        if (typeof value !== 'string' || value.trim() === '') {
          return '오류 메시지를 확인할 수 없습니다.';
        }
        const safeMessage = value
          .replace(/[\u0000-\u001f\u007f]/g, ' ')
          .replace(/\b(bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[가림]')
          .replace(/\b(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|authorization|credential|token|password|passwd|secret|private[_ -]?key|비밀번호|토큰|키)(\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1$2[가림]')
          .replace(/([?&](?:api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|token|password|secret)=)[^&#\s]+/gi, '$1[가림]')
          .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[가림]')
          .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi, '[비밀 키 가림]')
          .trim()
          .slice(0, 500);
        return safeMessage || '오류 메시지를 확인할 수 없습니다.';
      };
      const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';
      const isStringArray = (value) => Array.isArray(value) && value.every(isNonEmptyString);
      const isValidProposal = (proposal) => proposal !== null
        && typeof proposal === 'object'
        && !Array.isArray(proposal)
        && isNonEmptyString(proposal.action)
        && isStringArray(proposal.evidenceIds)
        && isNonEmptyString(proposal.reason);

      if (explanation?.status === 'error') {
        line('상태', '보안 사건 설명에 실패했습니다.');
        line('오류 코드', safeErrorCode(explanation?.error?.code));
        line('오류 메시지', safeErrorMessage(explanation?.error?.message));
        line('안내', '설명 요청이 실패했으며 원래 보안 기록은 변경되지 않았습니다.');
      } else if (event == null) {
        line('상태', '보안 기록에서 기록을 먼저 고르세요.');
      } else if (explanation?.status === 'loading') {
        line('상태', 'AI 사건 설명 요청 중');
      } else if (explanation?.status === 'ok') {
        const data = explanation.data;
        const validEventId = isNonEmptyString(event?.id);
        const validData = data !== null && typeof data === 'object' && !Array.isArray(data);
        const validSummary = validData && isNonEmptyString(data.summary);
        const validEvidenceIds = validData && isStringArray(data.evidenceIds);
        const validProposals = validData
          && Array.isArray(data.proposals)
          && data.proposals.every(isValidProposal);
        const notExecuted = validData && data.executed === false;
        const requiresHumanConfirmation = validData && data.requiresHumanConfirmation === true;
        const evidenceRecords = Array.isArray(event?.evidence) ? event.evidence : null;
        const evidenceIdsUnique = validEvidenceIds
          && new Set(data.evidenceIds).size === data.evidenceIds.length;
        const matchedEvidence = [];
        let validEvidenceBinding = Boolean(validEvidenceIds && evidenceIdsUnique && evidenceRecords);
        if (validEvidenceBinding) {
          for (const citedId of data.evidenceIds) {
            const matches = evidenceRecords.filter((item) => item !== null
              && typeof item === 'object'
              && !Array.isArray(item)
              && item.id === citedId);
            if (matches.length !== 1 || !isNonEmptyString(matches[0]?.text)) {
              validEvidenceBinding = false;
              break;
            }
            matchedEvidence.push(matches[0]);
          }
        }
        const rules = Array.isArray(event?.rules) ? event.rules : null;
        const validRules = rules !== null && rules.every((rule) => rule !== null
          && typeof rule === 'object'
          && !Array.isArray(rule)
          && isNonEmptyString(rule.id)
          && isNonEmptyString(rule.text));

        const supportedActions = Array.isArray(event?.supportedActions) ? event.supportedActions : null;
        const validSupportedActions = supportedActions !== null
          && supportedActions.every(isNonEmptyString);
        const proposalEvidence = [];
        let validProposalEvidence = validProposals && validSupportedActions;
        if (validProposalEvidence) {
          for (const proposal of data.proposals) {
            const citedIds = proposal.evidenceIds;
            if (citedIds.length === 0 || new Set(citedIds).size !== citedIds.length) {
              validProposalEvidence = false;
              break;
            }
            const proposalMatches = [];
            for (const citedId of citedIds) {
              const matches = evidenceRecords?.filter((item) => item !== null
                && typeof item === 'object'
                && !Array.isArray(item)
                && item.id === citedId) ?? [];
              if (matches.length !== 1 || !isNonEmptyString(matches[0]?.text)) {
                validProposalEvidence = false;
                break;
              }
              proposalMatches.push(matches[0]);
            }
            if (!validProposalEvidence) break;
            proposalEvidence.push(proposalMatches);
          }
        }
        const supportedProposalActions = validProposals && validSupportedActions
          && data.proposals.every((proposal) => supportedActions.includes(proposal.action));
        const validResult = validEventId
          && validData
          && validSummary
          && validEvidenceIds
          && validProposals
          && notExecuted
          && requiresHumanConfirmation
          && validEvidenceBinding
          && validRules
          && validSupportedActions
          && validProposalEvidence
          && supportedProposalActions;

        if (!validResult) {
          const reasons = [];
          if (!validEventId) reasons.push('사건 ID를 확인할 수 없습니다');
          if (!validData) reasons.push('설명 자료 형식이 올바르지 않습니다');
          else {
            if (!validSummary) reasons.push('요약을 확인할 수 없습니다');
            if (!validEvidenceIds) reasons.push('근거 ID 목록 형식을 확인할 수 없습니다');
            if (!validProposals) reasons.push('제안 목록 형식을 확인할 수 없습니다');
            if (data.executed === true) reasons.push('이미 실행된 결과는 설명으로 사용할 수 없습니다');
            else if (!notExecuted) reasons.push('미실행 상태를 확인할 수 없습니다');
            if (!requiresHumanConfirmation) reasons.push('사람 확인 필요 상태가 공식 계약과 일치하지 않습니다');
          }
          if (!validEvidenceBinding) {
            reasons.push(evidenceRecords === null
              ? '현재 사건의 근거 자료를 확인할 수 없습니다'
              : '근거가 현재 사건과 일치하지 않습니다');
          }
          if (!validRules) reasons.push('현재 사건의 규칙 자료를 확인할 수 없습니다');
          if (!validSupportedActions) reasons.push('현재 사건이 지원하는 조치 목록을 확인할 수 없습니다');
          if (validProposals && validSupportedActions && !supportedProposalActions) {
            reasons.push('지원하지 않는 조치가 제안되어 설명을 사용할 수 없습니다');
          }
          if (!validProposalEvidence) reasons.push('제안의 근거 ID가 현재 사건의 근거와 일치하지 않거나 누락·중복되었습니다');
          line('상태', '설명 사용 불가: 결과를 확인할 수 없습니다.');
          line('안내', reasons.join(' · ') || '설명 결과가 공식 입력 계약을 충족하는지 확인할 수 없습니다.');
        } else {
          root.setAttribute('data-student-explanation-event', String(event.id));
          line('상태', '보안 사건 설명에 성공했습니다.');
          line('사건 ID', displayValue(event.id));
          line('AI 설명(참고용)', displayValue(data.summary));
          if (checkedAt !== undefined && checkedAt !== null && checkedAt !== '') {
            line('확인 시각', displayValue(checkedAt));
          }

          const evidenceHeading = document.createElement('h3');
          evidenceHeading.textContent = '인용 근거';
          root.append(evidenceHeading);
          if (matchedEvidence.length === 0) {
            line('근거', '인용된 근거가 없습니다.');
          } else {
            for (const evidence of matchedEvidence) {
              const evidenceLine = document.createElement('p');
              evidenceLine.textContent = `${evidence.id} — ${evidence.text}`;
              root.append(evidenceLine);
            }
          }

          const rulesHeading = document.createElement('h3');
          rulesHeading.textContent = '규칙';
          root.append(rulesHeading);
          if (rules.length === 0) {
            line('규칙', '표시할 규칙이 없습니다');
          } else {
            for (const rule of rules) {
              const ruleLine = document.createElement('p');
              ruleLine.textContent = `${rule.id} — ${rule.text}`;
              root.append(ruleLine);
            }
          }

          const unknownStates = [];
          if (event?.state?.access === 'unknown') unknownStates.push('접속: 확인 불가(unknown)');
          if (event?.state?.session === 'unknown') unknownStates.push('세션: 확인 불가(unknown)');
          if (event?.state?.device === 'unknown') unknownStates.push('기기: 확인 불가(unknown)');
          const unknownHeading = document.createElement('h3');
          unknownHeading.textContent = '확인 불가 상태';
          root.append(unknownHeading);
          if (unknownStates.length === 0) {
            line('상태', '확인 불가 상태 없음');
          } else {
            for (const state of unknownStates) line('상태', state);
          }

          const proposalsHeading = document.createElement('h3');
          proposalsHeading.textContent = 'AI 조치 제안 (참고용)';
          root.append(proposalsHeading);
          if (data.proposals.length === 0) {
            line('제안', supportedActions.length === 0
              ? '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상).'
              : 'AI가 제안한 조치가 없습니다.');
          } else {
            for (let index = 0; index < data.proposals.length; index += 1) {
              const proposal = data.proposals[index];
              const proposalSection = document.createElement('section');
              const proposalHeading = document.createElement('h4');
              proposalHeading.textContent = `제안 ${index + 1}`;
              proposalSection.append(proposalHeading);
              line('조치 ID (action)', proposal.action, proposalSection);
              line('제안 이유 (reason)', proposal.reason, proposalSection);
              line('제안 근거 ID (evidenceIds)', proposal.evidenceIds.join(', '), proposalSection);
              for (const evidence of proposalEvidence[index]) {
                const evidenceLine = document.createElement('p');
                evidenceLine.textContent = `제안 근거: ${evidence.id} — ${evidence.text}`;
                proposalSection.append(evidenceLine);
              }
              line('사람 확인 필요', '예 (requiresHumanConfirmation: true)', proposalSection);
              line('실행 상태', '아직 실행되지 않음 (executed: false)', proposalSection);
              root.append(proposalSection);
            }
          }
          line('안내', 'AI 설명은 참고 정보입니다. 조치 제안만으로는 실행되지 않으며, 이 화면은 조치를 실행하지 않습니다.');
        }
      } else if (explanation?.status === 'idle' || explanation == null) {
        line('상태', '사건 설명을 아직 실행하지 않았습니다.');
        line('안내', '연결 점검이나 모델 목록 확인만으로 사건 설명 성공을 뜻하지 않습니다.');
      } else {
        line('상태', '사건 설명 결과를 확인할 수 없습니다.');
        line('안내', '확인되지 않은 결과를 성공으로 처리하지 않습니다.');
      }

      return root;
    },
    renderAction({ status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error } = {}) {
      const root = document.createElement('div');
      root.className = 'student-action';

      const line = (label, value) => {
        const item = document.createElement('p');
        item.textContent = `${label}: ${value}`;
        root.append(item);
      };
      const safeCode = (value) => typeof value === 'string'
        && /^[A-Za-z][A-Za-z0-9_.:-]{0,99}$/.test(value)
        ? value
        : '확인 불가';
      const safeMessage = (value) => {
        if (typeof value !== 'string' || value.trim() === '') return '오류 메시지를 확인할 수 없습니다.';
        return value
          .replace(/[\u0000-\u001f\u007f]/g, ' ')
          .replace(/\b(bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[가림]')
          .replace(/\b(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|authorization|credential|token|password|passwd|secret|private[_ -]?key|비밀번호|토큰|키)(\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1$2[가림]')
          .replace(/([?&](?:api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|token|password|secret)=)[^&#\s]+/gi, '$1[가림]')
          .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[가림]')
          .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi, '[비밀 키 가림]')
          .trim()
          .slice(0, 500) || '오류 메시지를 확인할 수 없습니다.';
      };
      const readableMessage = (value) => typeof value === 'string' && value.trim() !== ''
        ? safeMessage(value)
        : null;
      const rawStatus = typeof status === 'string' && status.trim() !== '' ? status : '확인 불가';
      const safeStatusMessage = readableMessage(message);
      const hasValue = (value) => value !== undefined && value !== null && value !== '';
      const isNonEmptyId = (value) => typeof value === 'string' && value.trim() !== '';
      const displayValue = (value) => {
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
          return String(value);
        }
        if (value == null) return '확인 불가';
        try {
          return JSON.stringify(value) ?? '확인 불가';
        } catch {
          return '확인 불가';
        }
      };

      const currentEventIdValid = isNonEmptyId(event?.id);
      const currentActionIdValid = isNonEmptyId(actionId);
      const receiptObject = receipt !== null && typeof receipt === 'object' && !Array.isArray(receipt);
      const receiptEventIdValid = receiptObject && isNonEmptyId(receipt.eventId);
      const receiptActionIdValid = receiptObject && isNonEmptyId(receipt.actionId);
      const receiptRequestIdValid = receiptObject && isNonEmptyId(receipt.requestId);
      const eventBindingMismatch = currentEventIdValid && receiptEventIdValid
        && event.id !== receipt.eventId;
      const actionBindingMismatch = currentActionIdValid && receiptActionIdValid
        && actionId !== receipt.actionId;
      const receiptBindingMismatch = eventBindingMismatch || actionBindingMismatch;
      const receiptBindingComplete = currentEventIdValid
        && currentActionIdValid
        && receiptEventIdValid
        && receiptActionIdValid
        && !receiptBindingMismatch;
      const canMarkCurrentEventIntent = currentEventIdValid
        && currentActionIdValid
        && !receiptBindingMismatch;
      const canMarkCurrentRequest = receiptBindingComplete && receiptRequestIdValid;

      if (canMarkCurrentEventIntent) {
        root.setAttribute('data-student-action-event', event.id);
      }
      if (canMarkCurrentRequest) {
        root.setAttribute('data-student-action-request', receipt.requestId);
      }

      if (status === 'idle') {
        line('상태', '아직 미실행 (idle)');
      } else if (status === 'loading') {
        line('상태', '조치 준비 또는 결과 조회 중 (loading)');
        line('결과', '아직 확인되지 않았습니다.');
      } else if (status === 'prepared') {
        line('상태', '준비됨·미실행 (prepared)');
        line('안내', '사람 확인이 필요하며, 이 상태는 조치가 아직 실행되지 않았음을 뜻합니다.');
      } else if (status === 'executing') {
        line('상태', '서버에 전달 중 (executing)');
        line('결과', '요청 진행 상태이며 결과와 효과는 아직 확인되지 않았습니다.');
      } else if (status === 'pending') {
        line('상태', '서버 접수·처리 중 (pending)');
        line('결과', 'ACK는 접수 확인일 뿐 실제 효과가 확인되었다는 뜻이 아닙니다.');
      } else if (status === 'succeeded') {
        if (observation?.effectApplied === true && receiptBindingComplete && receiptRequestIdValid) {
          line('상태', '효과 확인 (succeeded)');
          line('확인 근거', '관측 결과 effectApplied가 true입니다.');
        } else if (receiptBindingMismatch) {
          line('상태', '요청 결속 불일치: 현재 요청의 정상 결과로 확인할 수 없습니다.');
          line('확인 상태', '영수증의 사건 또는 조치 ID가 현재 입력과 달라 효과 확인의 근거로 사용하지 않습니다.');
        } else {
          line('상태', '결과 불명 (succeeded)');
          line('확인 상태', '실제 효과가 확인되지 않았습니다. 성공이나 효과 없음을 단정하지 않습니다.');
        }
      } else if (status === 'denied') {
        line('상태', '연동 시스템에서 거절 (denied)');
      } else if (status === 'failed') {
        line('상태', '연동 시스템 처리 실패 (failed)');
      } else if (status === 'unknown') {
        line('상태', '결과 불명 (unknown)');
        line('안내', '성공이나 효과 없음을 단정하지 않습니다. 제공 화면에서 결과를 다시 조회하세요.');
      } else if (status === 'expired') {
        line('상태', '확인 기한 만료 (expired)');
        line('안내', '다시 준비가 필요합니다. 이 상태만으로 조치 실행 여부를 판단할 수 없습니다.');
      } else if (status === 'error') {
        line('상태', '요청 처리 오류 (error)');
        line('오류 코드', safeCode(error?.code));
        line('오류 메시지', safeMessage(error?.message));
      } else {
        line('상태', `확인할 수 없는 상태 (${rawStatus})`);
        line('안내', '확인되지 않은 상태를 성공으로 처리하지 않습니다.');
      }

      if (hasValue(event?.id)) {
        line('현재 사건 ID', displayValue(event.id));
      }
      if (Array.isArray(event?.evidence)) {
        const evidenceIds = event.evidence
          .filter((evidence) => evidence !== null
            && typeof evidence === 'object'
            && Object.hasOwn(evidence, 'id')
            && hasValue(evidence.id));
        for (const evidence of evidenceIds) {
          line('근거 ID', displayValue(evidence.id));
        }
      }
      if (hasValue(actionId)) {
        line('조치 ID', displayValue(actionId));
      }
      if (hasValue(target?.id)) {
        line('실제 대상 ID', displayValue(target.id));
      }
      if (hasValue(target?.generation)) {
        line('대상 세대 (generation)', displayValue(target.generation));
      }
      if (hasValue(confirmationExpiresAt)) {
        line('확인 기한', displayValue(confirmationExpiresAt));
        if (status === 'prepared') {
          line('기한 안내', '준비 상태의 확인 기한이며 인증 티켓이나 승인 완료를 뜻하지 않습니다.');
        }
      }

      if (hasValue(receipt?.requestId)) {
        line('요청 ID (requestId)', displayValue(receipt.requestId));
      }
      if (hasValue(receipt?.receiptId)) {
        line('영수증 ID (receiptId)', displayValue(receipt.receiptId));
      }
      if (hasValue(receipt?.version)) {
        line('영수증 버전 (version)', displayValue(receipt.version));
      }
      if (hasValue(receipt?.eventId)) {
        line('영수증 사건 ID (eventId)', displayValue(receipt.eventId));
        if (currentEventIdValid) {
          line('사건 연결 확인', eventBindingMismatch
            ? '현재 사건 ID와 일치하지 않습니다. 현재 요청 결과로 단정할 수 없습니다.'
            : '현재 사건 ID와 일치합니다. 이는 화면 입력값의 비교이며, 서버의 전체 요청 결속 검증을 뜻하지 않습니다.');
        } else {
          line('사건 연결 확인', '현재 사건 ID가 없거나 유효하지 않아 대조할 수 없습니다. 일치한다고 판단하지 않습니다.');
        }
      }
      if (hasValue(receipt?.actionId)) {
        line('영수증 조치 ID (actionId)', displayValue(receipt.actionId));
        if (currentActionIdValid) {
          line('조치 연결 확인', actionBindingMismatch
            ? '현재 조치 ID와 일치하지 않습니다. 현재 요청 결과로 단정할 수 없습니다.'
            : '현재 조치 ID와 일치합니다. 이는 화면 입력값의 비교이며, 서버의 전체 요청 결속 검증을 뜻하지 않습니다.');
        } else {
          line('조치 연결 확인', '현재 조치 ID가 없거나 유효하지 않아 대조할 수 없습니다. 일치한다고 판단하지 않습니다.');
        }
      }
      if (receiptObject && (hasValue(receipt.eventId) || hasValue(receipt.actionId) || hasValue(receipt.requestId))) {
        if (receiptBindingMismatch) {
          line('영수증 결속 상태', '불일치: 이 영수증은 현재 사건·조치의 정상 결과로 표시하지 않습니다.');
        } else if (!receiptBindingComplete) {
          line('영수증 결속 상태', '확인 불가: 현재 사건·조치 ID와 영수증의 사건·조치 ID가 모두 있어야 비교할 수 있습니다.');
        } else if (!receiptRequestIdValid) {
          line('영수증 결속 상태', '사건·조치 ID는 일치하지만 requestId가 없어 요청 연결을 확인할 수 없습니다.');
        } else {
          line('영수증 결속 상태', '현재 사건·조치 ID와 requestId를 입력값에서 확인했습니다. 대상·세대·버전 및 서버 측 결속 검증을 완료했다는 뜻은 아닙니다.');
        }
      } else if (receiptObject && (currentEventIdValid || currentActionIdValid)) {
        line('영수증 결속 상태', 'receipt의 사건·조치·요청 식별 정보가 부족해 현재 요청과의 결속을 확인할 수 없습니다.');
      }
      if (receipt != null && Object.hasOwn(receipt, 'replayed')) {
        line('재사용 여부 (replayed)', displayValue(receipt.replayed));
        if (receipt.replayed === true) {
          line('재전달 안내', '기존 요청 결과를 다시 받은 상태(replayed)입니다. 새로운 집행 성공을 뜻하지 않습니다.');
        }
      }

      if (hasValue(observation?.observedAt)) {
        line('관측 시각 (observedAt)', displayValue(observation.observedAt));
      }
      if (observation != null && Object.hasOwn(observation, 'effectApplied')) {
        line('효과 관측값 (effectApplied)', displayValue(observation.effectApplied));
      }
      if (status === 'pending' || status === 'executing') {
        line('관측 안내', '현재 상태는 진행 중입니다. 관측 정보가 있어도 상태를 성공으로 바꾸지 않습니다.');
      }
      if (status === 'succeeded' && observation?.effectApplied === true && receiptBindingComplete && receiptRequestIdValid) {
        if (hasValue(observation?.observedAt) && hasValue(receipt?.receiptId)) {
          line('효과 확인 정보', `관측 시각 ${displayValue(observation.observedAt)} · 영수증 ${displayValue(receipt.receiptId)}`);
        } else {
          const missing = [];
          if (!hasValue(observation?.observedAt)) missing.push('관측 시각');
          if (!hasValue(receipt?.receiptId)) missing.push('영수증 ID');
          line('효과 확인 정보', `effectApplied: true는 전달됐지만 ${missing.join(' 및 ')}를 확인할 수 없습니다. 값을 만들어 내지 않았습니다.`);
        }
      }
      if (status === 'succeeded' && observation?.effectApplied !== true) {
        line('관측 안내', 'effectApplied가 true로 확인되지 않아 실제 효과를 확인했다고 표시하지 않습니다.');
      }
      if (receipt != null && (hasValue(receipt.eventId) || hasValue(receipt.actionId))) {
        line('영수증 안내', '영수증 정보만으로 조치 집행 성공이나 실제 효과가 확인된 것은 아닙니다.');
      }
      line('검증 범위', '화면은 전달된 식별값의 비교만 표시합니다. 실제 대상·세대·버전·요청 결속 및 중복 방지는 제공 코드와 서버의 책임이며, 이 화면이 이를 완료했다고 주장하지 않습니다.');

      if (status !== 'error' && safeStatusMessage !== null) {
        line(status === 'denied' || status === 'failed' ? '처리 메시지' : '메시지', safeStatusMessage);
      }
      return root;
    },
  };
}
