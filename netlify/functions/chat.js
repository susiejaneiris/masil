// 마실 챗봇 프록시 (Netlify Function)
// OpenAI 키를 서버(환경변수 OPENAI_API_KEY)에만 두고, 클라이언트에는 노출하지 않는다.
// 클라이언트는 이 함수로 messages 만 보내고, 함수가 키를 붙여 OpenAI 에 전달한다.
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: { message: 'POST 만 허용됩니다.' } }) }
  }

  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: { message: '서버에 OPENAI_API_KEY 가 설정되지 않았습니다. (Netlify 환경변수 확인)' } }) }
  }

  let messages
  try {
    ({ messages } = JSON.parse(event.body || '{}'))
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: { message: '요청 본문이 올바른 JSON 이 아닙니다.' } }) }
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: { message: 'messages 배열이 필요합니다.' } }) }
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: 'gpt-5-mini', messages }),
    })
    const data = await res.json()
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: { message: String((e && e.message) || e) } }) }
  }
}
