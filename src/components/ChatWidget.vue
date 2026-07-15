<template>
    <button class="chat-fab" v-if="!open" @click="toggle" aria-label="챗봇 열기"><span class="fab-bubble">💬</span><span class="fab-bot">🤖</span></button>
    <div class="chat-panel" v-if="open">
      <div class="chat-head">
        <div><div class="t">마실 도우미</div><div class="d">서울 장소 데이터로 답해요 · GPT-5 mini</div></div>
        <button class="ic" @click="clearChat" title="대화 비우기">🗑️</button>
        <button class="ic" @click="toggle" title="닫기">✕</button>
      </div>
      <div class="chat-msgs" ref="msgs">
        <div class="msg sys" v-if="!messages.length">안녕하세요! 가볼 곳·축제·맛집을 물어보세요.<br>예: "성수동 카페 근처 가볼 곳"</div>
        <div v-for="(m,i) in messages" :key="i" class="msg" :class="m.role==='user'?'user':'bot'">{{ m.content }}</div>
        <div class="msg bot" v-if="loading"><span class="dots"><i></i><i></i><i></i></span></div>
      </div>
      <div class="chat-sugg" v-if="!messages.length">
        <button v-for="s in suggestions" :key="s" @click="pick(s)">{{ s }}</button>
      </div>
      <div class="chat-in">
        <input v-model="input" placeholder="무엇이든 물어보세요…" @keyup.enter="send">
        <button class="snd" :disabled="loading||!input.trim()" @click="send">전송</button>
      </div>
    </div>
</template>

<script>
import { DATA, STATS } from '../lib.js'

export default {
  name: 'ChatWidget',
  data(){return{
    open:false, input:'', loading:false,
    // 키는 서버(Netlify Function)에만 있다. 클라이언트는 키 없이 함수로 요청만 보낸다.
    messages:JSON.parse(localStorage.getItem('masil_chat')||'[]'),
    suggestions:['종로구 가볼 만한 곳','이번 가을 서울 축제','강남 데이트 코스','아이랑 갈 문화시설'],
  }},
  methods:{
    toggle(){ this.open=!this.open; this.$nextTick(this.scrollDown); },
    persist(){ localStorage.setItem('masil_chat',JSON.stringify(this.messages.slice(-40))); },
    scrollDown(){ const el=this.$refs.msgs; if(el) el.scrollTop=el.scrollHeight; },
    clearChat(){ this.messages=[]; this.persist(); },
    pick(s){ this.input=s; this.send(); },
    buildContext(q){
      const toks=q.toLowerCase().split(/\s+/).filter(Boolean);
      let hits=DATA.filter(d=>{
        const hay=(d.t+' '+STATS.cats[d.c]+' '+STATS.regions[d.r]+' '+(d.g||'')).toLowerCase();
        return toks.some(t=>hay.includes(t));
      });
      if(!hits.length) hits=DATA.slice(0,15);
      if(hits.length>28) hits=hits.slice(0,28);
      return JSON.stringify(hits.map(d=>({이름:d.t,종류:STATS.cats[d.c],지역:STATS.regions[d.r]+' '+(d.g||''),주소:d.a,기간:d.s?(d.s+'~'+d.e):undefined})));
    },
    async send(){
      const q=this.input.trim(); if(!q||this.loading) return;
      this.messages.push({role:'user',content:q}); this.input=''; this.persist();
      this.loading=true; this.$nextTick(this.scrollDown);
      try{
        const sys='너는 "마실"의 지역정보 안내 도우미야. 아래 JSON 장소 데이터에 근거해서만 한국어로 친절하고 간결하게 답해. '+
                  '추천할 땐 이름과 지역을 함께 알려줘. 데이터에 없는 건 모른다고 솔직히 말해.\n\n[장소데이터]\n'+this.buildContext(q);
        const hist=this.messages.slice(-6).map(m=>({role:m.role,content:m.content}));
        const res=await fetch('/.netlify/functions/chat',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({messages:[{role:'system',content:sys},...hist]})
        });
        const j=await res.json();
        if(!res.ok) throw new Error((j.error&&j.error.message)||('오류 '+res.status));
        this.messages.push({role:'assistant',content:j.choices[0].message.content.trim()});
      }catch(e){
        this.messages.push({role:'assistant',content:'⚠️ '+e.message+'\n(잠시 후 다시 시도해 주세요. 문제가 계속되면 서버 API 키 설정을 확인해 주세요.)'});
      }
      this.loading=false; this.persist(); this.$nextTick(this.scrollDown);
    },
  },
}
</script>

<style scoped>
@keyframes pop{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}
.chat-fab{position:fixed;right:22px;bottom:22px;width:60px;height:60px;border-radius:50%;background:var(--accent);color:#fff;
  box-shadow:0 8px 24px rgba(111,95,208,.45);display:flex;align-items:center;justify-content:center;font-size:26px;z-index:1200;transition:.16s;border:none}
.chat-fab:hover{transform:scale(1.06);background:var(--accent-deep)}
.chat-fab .fab-bot{font-size:27px;line-height:1;transform:translate(-4px,7px)}
.chat-fab .fab-bubble{position:absolute;top:7px;left:50%;transform:translateX(-20%);font-size:15px;line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.25))}
.chat-panel{position:fixed;right:22px;bottom:94px;width:380px;height:560px;max-height:calc(100vh - 120px);background:var(--surface);border:1px solid var(--line);
  border-radius:20px;box-shadow:var(--shadow);z-index:1200;display:flex;flex-direction:column;overflow:hidden;animation:pop .2s ease}
.chat-head{padding:15px 18px;background:linear-gradient(135deg,#6F5FD0,#8C7DE0);color:#fff;display:flex;align-items:center;gap:10px}
.chat-head .t{font-weight:800;font-size:15px}.chat-head .d{font-size:11.5px;color:#e3dcff;font-weight:600}
.chat-head .ic{margin-left:auto;width:30px;height:30px;border-radius:9px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:15px;border:none;color:#fff}
.chat-head .ic:hover{background:rgba(255,255,255,.3)}
.chat-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--paper)}
.msg{max-width:82%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.55;white-space:pre-wrap;word-break:break-word}
.msg.user{align-self:flex-end;background:var(--accent);color:#fff;border-bottom-right-radius:4px}
.msg.bot{align-self:flex-start;background:var(--surface);border:1px solid var(--line);border-bottom-left-radius:4px}
.msg.sys{align-self:center;background:transparent;color:var(--muted);font-size:12.5px;font-weight:600;text-align:center;max-width:100%}
.chat-key{padding:12px 14px;border-top:1px solid var(--line);background:#FFF7E6}
.chat-key .lab{font-size:12px;font-weight:700;color:#8a6d1a;margin-bottom:7px}
.chat-key .krow{display:flex;gap:7px}
.chat-key input{flex:1;border:1px solid var(--line);border-radius:9px;padding:8px 10px;font-family:inherit;font-size:13px}
.chat-key .ks{background:var(--ink);color:#fff;font-weight:800;padding:0 14px;border-radius:9px;font-size:13px;border:none}
.chat-in{padding:11px;border-top:1px solid var(--line);display:flex;gap:8px;background:var(--surface)}
.chat-in input{flex:1;border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-family:inherit;font-size:14px}
.chat-in input:focus{outline:none;border-color:var(--accent)}
.chat-in .snd{background:var(--accent);color:#fff;font-weight:800;padding:0 16px;border-radius:11px;border:none}
.chat-in .snd:disabled{opacity:.45;cursor:not-allowed}
.chat-sugg{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 8px;background:var(--paper)}
.chat-sugg button{font-size:12px;font-weight:700;color:var(--brand-ink);background:var(--brand-soft);border-radius:100px;padding:6px 11px;border:none}
.dots{display:inline-flex;gap:3px}.dots i{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:bl 1s infinite}
.dots i:nth-child(2){animation-delay:.2s}.dots i:nth-child(3){animation-delay:.4s}
@keyframes bl{0%,80%,100%{opacity:.3}40%{opacity:1}}
@media(max-width:860px){
  .chat-panel{right:0;left:0;bottom:0;width:100%;height:80vh;max-height:80vh;border-radius:20px 20px 0 0}
  .chat-fab{right:16px;bottom:16px}
}
</style>
