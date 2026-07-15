<template>
  <div class="view">
    <div class="view-head"><h2>커뮤니티</h2><span class="sub">로그인 없이 · 지역별 익명 게시판</span></div>
    <div class="comm">
      <div class="calzones">
        <button :class="{on:commRegion===''}" @click="commRegion=''">전체</button>
        <button v-for="(r,i) in REG_NAME" :key="i" :class="{on:commRegion===i}" @click="commRegion=i">
          <span class="d" :style="{background:REGION_COLOR[i]}"></span>{{ r }}
        </button>
      </div>
      <div class="composer">
        <div class="av-pick">
          <span class="av-preview" :style="{background:avBg(form.avatar)}"><img :src="avSrc(form.avatar)" alt=""></span>
          <div class="av-grid">
            <button v-for="(src,i) in AVATARS" :key="i" type="button" class="av-opt" :class="{on:form.avatar===i}"
              :style="{background:avBg(i)}" @click="form.avatar=i" :aria-label="'프로필 캐릭터 '+(i+1)" :aria-pressed="form.avatar===i"><img :src="src" alt=""></button>
          </div>
        </div>
        <div class="row">
          <input class="nick" v-model="form.nick" maxlength="16" placeholder="닉네임 (선택)">
          <select class="reg" v-model="form.region" style="max-width:168px">
            <option value="">자유 (전체)</option>
            <option v-for="(r,i) in REG_NAME" :key="i" :value="i">{{ r }} 게시판</option>
          </select>
        </div>
        <textarea v-model="form.body" maxlength="500" placeholder="다녀온 곳, 궁금한 점, 같이 갈 사람… 무엇이든 좋아요"></textarea>
        <div class="row" style="margin-top:10px">
          <input class="pw" v-model="form.pw" type="password" maxlength="20" placeholder="삭제·수정용 비밀번호 (필수)">
        </div>
        <div class="foot-bar">
          <button class="post-btn" :disabled="!form.body.trim()||!form.pw.trim()" @click="createPost">등록</button>
          <span class="hint">비밀번호는 이 글을 수정·삭제할 때 필요해요</span>
        </div>
      </div>
      <div class="store-note">지금은 이 브라우저에만 저장돼요(localStorage). 비밀번호는 기기 밖으로 나가지 않습니다.</div>
      <div class="feed">
        <div class="feed-empty" v-if="!filteredPosts.length"><b>아직 이야기가 없어요</b>이 게시판의 첫 글을 남겨보세요.</div>
        <div class="post" v-for="p in filteredPosts" :key="p.id" @click="openPost(p)">
          <div class="ph">
            <span class="pavatar" :style="{background:avBg(p.avatar)}"><img :src="avSrc(p.avatar)" alt=""></span>
            <span class="rbadge" :style="{background:(p.region===''||p.region==null)?'#8A8A96':REGION_COLOR[p.region]}">{{ boardName(p.region) }}</span>
            <span class="nick" :class="{anon:!p.nick}">{{ p.nick || '익명' }}</span>
            <span class="time">{{ relTime(p.created) }}<span v-if="p.updated"> · 수정됨</span></span>
            <span class="lock">🔒</span>
          </div>
          <div class="body">{{ p.body }}</div>
        </div>
      </div>
    </div>

    <!-- 커뮤니티 상세 모달 -->
    <div class="modal-bg" v-if="postView" @click.self="closePost()">
      <div class="modal">
        <button class="m-close" @click="closePost()">×</button>
        <div class="pm-head">
          <span class="rbadge" :style="{background:(postView.region===''||postView.region==null)?'#8A8A96':REGION_COLOR[postView.region],display:'inline-block',marginBottom:'9px'}">{{ boardName(postView.region) }}</span>
          <div class="pm-who">
            <span class="pm-avatar" :style="{background:avBg(postView.avatar)}"><img :src="avSrc(postView.avatar)" alt=""></span>
            <div>
              <div class="nick" :class="{anon:!postView.nick}">{{ postView.nick || '익명' }}</div>
              <div class="time">{{ fullTime(postView.created) }}<span v-if="postView.updated"> · 수정 {{ relTime(postView.updated) }}</span></div>
            </div>
          </div>
        </div>
        <template v-if="!editing">
          <div class="pm-body">{{ postView.body }}</div>
          <div class="pm-actions" v-if="!pwMode">
            <button class="abtn edit" @click="askPw('edit')">수정</button>
            <button class="abtn del" @click="askPw('del')">삭제</button>
          </div>
          <div class="pwbox" v-if="pwMode">
            <div class="lab">{{ pwMode==='edit'?'수정':'삭제' }}하려면 글 작성 때 정한 비밀번호를 입력하세요</div>
            <div class="prow">
              <input type="password" v-model="pwInput" placeholder="비밀번호" @keyup.enter="confirmPw()">
              <button class="go" @click="confirmPw()">확인</button>
            </div>
            <div class="err" v-if="pwErr">비밀번호가 일치하지 않아요</div>
          </div>
        </template>
        <div class="edit-area" v-else>
          <div class="av-pick" style="margin-bottom:9px">
            <span class="av-preview" :style="{background:avBg(edit.avatar)}"><img :src="avSrc(edit.avatar)" alt=""></span>
            <div class="av-grid">
              <button v-for="(src,i) in AVATARS" :key="i" type="button" class="av-opt" :class="{on:edit.avatar===i}"
                :style="{background:avBg(i)}" @click="edit.avatar=i" :aria-label="'프로필 캐릭터 '+(i+1)" :aria-pressed="edit.avatar===i"><img :src="src" alt=""></button>
            </div>
          </div>
          <input v-model="edit.nick" maxlength="16" placeholder="닉네임 (선택)">
          <textarea v-model="edit.body" maxlength="500"></textarea>
          <button class="save" @click="saveEdit()">저장</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { STATS, REGION_COLOR, AVATARS, avIdx, avSrc, avBg, hashPw, SAMPLE_POSTS } from '../lib.js'

export default {
  name: 'Community',
  props: { region: { default: '' } },
  data(){ return {
    REG_NAME: STATS.regions, REGION_COLOR, AVATARS,
    posts: JSON.parse(localStorage.getItem('masil_posts')||'[]'),
    commRegion: this.region ?? '',
    form:{nick:'',body:'',pw:'',region:this.region ?? '',avatar:0},
    postView:null, editing:false, pwMode:'', pwInput:'', pwErr:false, edit:{nick:'',body:'',avatar:0},
    _t:0,
  }},
  computed:{
    filteredPosts(){
      const list=this.commRegion===''?this.posts:this.posts.filter(p=>p.region===this.commRegion);
      return list.slice().sort((a,b)=>b.created-a.created);
    },
  },
  watch:{
    region(v){ this.commRegion = v ?? ''; },
    commRegion(v){ this.form.region=v; },
  },
  methods:{
    avBg(a){ return avBg(a); },
    avSrc(a){ return avSrc(a); },
    boardName(region){ return (region===''||region==null)?'자유':STATS.regions[region]; },
    savePosts(){ localStorage.setItem('masil_posts',JSON.stringify(this.posts)); },
    createPost(){
      const body=this.form.body.trim(), pw=this.form.pw.trim(); if(!body||!pw) return;
      this.posts.push({id:(this._t=Date.now()+Math.floor(Math.random()*999)),nick:this.form.nick.trim(),avatar:avIdx(this.form.avatar),body,region:this.form.region,pw:hashPw(pw),created:Date.now(),updated:0});
      this.savePosts(); this.form={nick:'',body:'',pw:'',region:this.commRegion,avatar:0};
    },
    openPost(p){ this.postView=p; this.editing=false; this.pwMode=''; this.pwInput=''; this.pwErr=false; },
    closePost(){ this.postView=null; this.editing=false; this.pwMode=''; },
    askPw(mode){ this.pwMode=mode; this.pwInput=''; this.pwErr=false; },
    confirmPw(){
      if(hashPw(this.pwInput.trim())!==this.postView.pw){ this.pwErr=true; return; }
      if(this.pwMode==='del'){ this.deletePost(this.postView); }
      else { this.edit={nick:this.postView.nick,body:this.postView.body,avatar:avIdx(this.postView.avatar)}; this.editing=true; this.pwMode=''; }
    },
    saveEdit(){
      const b=this.edit.body.trim(); if(!b) return;
      this.postView.nick=this.edit.nick.trim(); this.postView.avatar=avIdx(this.edit.avatar); this.postView.body=b; this.postView.updated=Date.now();
      this.savePosts(); this.editing=false;
    },
    deletePost(p){ this.posts=this.posts.filter(x=>x.id!==p.id); this.savePosts(); this.closePost(); },
    relTime(ms){ const s=(Date.now()-ms)/1000;
      if(s<60)return'방금'; if(s<3600)return Math.floor(s/60)+'분 전'; if(s<86400)return Math.floor(s/3600)+'시간 전';
      if(s<604800)return Math.floor(s/86400)+'일 전'; const d=new Date(ms); return (d.getMonth()+1)+'.'+d.getDate(); },
    fullTime(ms){ const d=new Date(ms); return d.getFullYear()+'.'+(d.getMonth()+1)+'.'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); },
  },
  mounted(){
    // 하드코딩 샘플 게시글은 더 이상 시드하지 않는다.
    // 예전에 시드된 브라우저를 위해, 저장돼 있던 샘플 글을 한 번만 제거한다(실제 사용자 글은 유지).
    if(!localStorage.getItem('masil_seed_cleared')){
      const sampleBodies=new Set(SAMPLE_POSTS.map(s=>s.body));
      const before=this.posts.length;
      this.posts=this.posts.filter(p=>!sampleBodies.has(p.body));
      if(this.posts.length!==before) this.savePosts();
      localStorage.removeItem('masil_seeded_v3');
      localStorage.setItem('masil_seed_cleared','1');
    }
    this._esc=(e)=>{ if(e.key==='Escape'){ this.closePost(); } };
    document.addEventListener('keydown', this._esc);
  },
  beforeUnmount(){ document.removeEventListener('keydown', this._esc); },
}
</script>

<style scoped>
.comm{max-width:680px;margin:0 auto}
.calzones{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.calzones button{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--muted);background:var(--surface);border:1px solid var(--line);border-radius:100px;padding:7px 13px;box-shadow:var(--shadow-sm);transition:.14s}
.calzones button .d{width:9px;height:9px;border-radius:50%;flex:0 0 auto}
.calzones button:hover{color:var(--ink);border-color:var(--line-strong)}
.calzones button.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.composer{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:18px;box-shadow:var(--shadow-sm);margin-bottom:8px}
.composer .row{display:flex;gap:10px;margin-bottom:10px}
.composer input,.composer textarea{width:100%;border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-family:inherit;font-size:14.5px;color:var(--ink);background:var(--paper);resize:none}
.composer input:focus,.composer textarea:focus{outline:none;border-color:var(--brand);background:#fff}
.composer .nick{max-width:180px}.composer .pw{max-width:200px}
.av-pick{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.av-preview{width:48px;height:48px;border-radius:14px;flex:0 0 auto;box-shadow:var(--shadow-sm);overflow:hidden}
.av-grid{display:flex;flex-wrap:wrap;gap:6px;flex:1}
.av-opt{width:38px;height:38px;border-radius:11px;border:2px solid transparent;transition:.13s;padding:2px;overflow:hidden;background:none}
.av-opt:hover{transform:translateY(-1px)}
.av-opt.on{border-color:var(--brand);box-shadow:0 0 0 2px var(--brand-soft)}
.pavatar{width:30px;height:30px;border-radius:9px;flex:0 0 auto;overflow:hidden}
.pm-who{display:flex;align-items:center;gap:11px}
.pm-avatar{width:46px;height:46px;border-radius:13px;flex:0 0 auto;box-shadow:var(--shadow-sm);overflow:hidden}
.av-preview img,.av-opt img,.pavatar img,.pm-avatar img{width:100%;height:100%;object-fit:contain;display:block}
.composer textarea{min-height:76px}
.composer .foot-bar{display:flex;align-items:center;gap:12px}
.composer .hint{font-size:12px;color:var(--faint);font-weight:600;margin-left:auto}
.post-btn{background:var(--accent);color:#fff;font-weight:800;font-size:14px;padding:10px 22px;border-radius:11px;transition:.15s;border:none}
.post-btn:hover{background:var(--accent-deep)}
.post-btn:disabled{opacity:.45;cursor:not-allowed}
.store-note{font-size:11.5px;color:var(--faint);font-weight:600;text-align:center;margin:10px 0 18px}
.feed{display:flex;flex-direction:column;gap:10px}
.post{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:15px 17px;box-shadow:var(--shadow-sm);cursor:pointer;transition:.14s}
.post:hover{border-color:var(--line-strong);box-shadow:var(--shadow)}
.post .ph{display:flex;align-items:center;gap:8px;margin-bottom:7px}
.rbadge{font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:100px;color:#fff}
.post .rbadge{flex:0 0 auto}
.post .nick{font-weight:800;font-size:13.5px}
.post .nick.anon{color:var(--muted)}
.post .time{font-size:12px;color:var(--faint);font-weight:600}
.post .lock{margin-left:auto;font-size:11px;color:var(--faint);font-weight:700}
.post .body{font-size:14.5px;color:var(--ink);white-space:pre-wrap;word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.feed-empty{text-align:center;color:var(--muted);padding:44px 16px;font-size:14.5px}
.feed-empty b{display:block;color:var(--ink);font-size:16px;font-weight:800;margin-bottom:6px}

/* 모달 */
.modal-bg{position:fixed;inset:0;background:rgba(40,32,66,.5);backdrop-filter:blur(3px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:var(--surface);border-radius:20px;width:min(480px,100%);max-height:88vh;overflow:auto;box-shadow:var(--shadow);animation:pop .25s ease;position:relative}
@keyframes pop{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}
.m-close{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;background:rgba(40,32,66,.32);color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;line-height:1;z-index:3;border:none}
.m-close:hover{background:rgba(40,32,66,.6)}
.pm-head{padding:22px 24px 6px}
.pm-head .nick{font-weight:800;font-size:16px}.pm-head .nick.anon{color:var(--muted)}
.pm-head .time{font-size:12.5px;color:var(--faint);font-weight:600;margin-top:2px}
.pm-body{padding:8px 24px 18px;font-size:15px;color:var(--ink);white-space:pre-wrap;word-break:break-word;line-height:1.65}
.pm-actions{padding:0 24px 22px;display:flex;gap:9px}
.abtn{font-weight:800;font-size:13.5px;padding:9px 16px;border-radius:10px;border:1px solid var(--line);background:none}
.abtn.edit{color:var(--brand-ink)}.abtn.del{color:#c93a63}
.abtn:hover{background:var(--paper)}
.pwbox{padding:0 24px 22px}
.pwbox .lab{font-size:13px;font-weight:700;color:var(--muted);margin-bottom:8px}
.pwbox .prow{display:flex;gap:8px}
.pwbox input{flex:1;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px}
.pwbox input:focus{outline:none;border-color:var(--brand)}
.pwbox .go{background:var(--accent);color:#fff;font-weight:800;padding:0 16px;border-radius:10px;border:none}
.pwbox .err{color:#c93a63;font-size:12.5px;font-weight:700;margin-top:8px}
.edit-area{padding:8px 24px 22px}
.edit-area input,.edit-area textarea{width:100%;border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-family:inherit;font-size:14.5px;background:var(--paper);margin-bottom:9px;resize:none}
.edit-area textarea{min-height:120px}
.edit-area .save{background:var(--accent);color:#fff;font-weight:800;padding:10px 20px;border-radius:11px;border:none}
</style>
