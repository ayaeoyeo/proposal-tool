export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { gu, target, why, whyso, what, how, iif, subtitle, extra, concerns } = req.body;
  if (!gu || !target || !why || !what || !how) return res.status(400).json({ error: '필수 항목이 누락됐어요.' });
  const concernNote = concerns?.length ? `\n[오해 방지] 다음 우려 고려해서 행정 언어로: ${concerns.join(', ')}` : '';
  const whysoNote = whyso || `(${gu} 청년 관련 고립·1인가구·관계망 붕괴 등 실증적 근거 직접 작성)`;
  const prompt = `당신은 주민참여예산 제안 신청서 전문 작성가입니다.
[원칙] 사업명: 대상→목적→방법→부제 구조. 부제 없으면 창의적으로 만들어줘. 필요성: WHY→WHYSO(데이터포함)→IF. 사업내용: WHAT→HOW. WHY SO 없으면 ${gu} 맥락 근거 직접 생성. 지역맥락(${gu}) 녹여줘.${concernNote}
[입력] 자치구:${gu} 대상:${target} WHY:${why} WHYSO:${whysoNote} WHAT:${what} HOW:${how} IF:${iif||'자동생성'} 부제:${subtitle||'창의적으로'} 추가:${extra||'없음'}
순수 JSON만 응답: {"사업명":"...","필요성및기대효과":"...","사업내용아이디어":"..."}`;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1200 } })
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: 'AI 서버 오류가 발생했어요.' });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return res.status(200).json(parsed);
  } catch(e) {
    return res.status(500).json({ error: '신청서 생성 중 오류가 발생했어요.' });
  }
}
