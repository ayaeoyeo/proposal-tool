export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { gu, target, why, whyso, what, how, iif, subtitle, extra, concerns } = req.body;
  if (!gu || !target || !why || !what || !how) {
    return res.status(400).json({ error: '필수 항목이 누락됐어요.' });
  }
  const concernNote = concerns && concerns.length
    ? `\n\n[오해 방지 요청] 다음 우려를 고려해서 행정 언어로 표현해줘: ${concerns.join(', ')}`
    : '';
  const whysoNote = whyso
    ? whyso
    : `(데이터 없음 → ${gu} 청년 관련 통계/연구 기반으로 설득력 있는 근거를 직접 작성해줘.)`;
  const prompt = `당신은 서울시 주민참여예산 제안 신청서 전문 작성가입니다.
아래 입력 정보를 바탕으로 완성도 높은 주민참여예산 제안 신청서를 작성해주세요.

[핵심 작성 원칙]
- 사업명: "대상 → 목적 → 방법 → 부제" 구조
- 부제가 없으면 기억에 남는 부제를 직접 만들어줘
- 필요성·기대효과: WHY → WHY SO(데이터/근거 포함) → IF 흐름
- 사업내용: WHAT → HOW 흐름, 주민 누구나 이해 가능한 언어
- WHY SO 데이터가 없으면 ${gu} 맥락에 맞는 실증적 근거를 직접 생성해줘
- 오해받기 쉬운 아이디어는 공공성·제도적 근거 중심으로 재표현해줘
- 지역 맥락(${gu})을 자연스럽게 녹여줘${concernNote}

[입력 정보]
자치구: ${gu}
대상: ${target}
문제(WHY): ${why}
근거(WHY SO): ${whysoNote}
아이디어(WHAT): ${what}
운영방식(HOW): ${how}
기대효과(IF): ${iif || '(자동 생성)'}
원하는 부제: ${subtitle || '없음 (창의적으로 만들어줘)'}
추가 의견: ${extra || '없음'}

다음 JSON 형식으로만 응답해줘. 마크다운 기호나 다른 텍스트 없이 순수 JSON만:
{"사업명":"...","필요성및기대효과":"...","사업내용아이디어":"..."}`;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: 'AI 서버 오류가 발생했어요.' });
    const text = data.content.map(i => i.text || '').join('');
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: '신청서 생성 중 오류가 발생했어요.' });
  }
}
