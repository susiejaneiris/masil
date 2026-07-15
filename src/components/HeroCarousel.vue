<template>
  <div class="hero-carousel" @mouseenter="heroPause()" @mouseleave="heroPlay()">
    <div class="hero-bg" v-for="(s,i) in heroSlides" :key="i" :class="{on:heroIndex===i}"
      :style="s.img?{backgroundImage:'url('+s.img+')'}:{}"></div>
    <div class="hero-ov"></div>
    <button class="hero-arrow left" @click="heroPrev()" aria-label="이전 배너">‹</button>
    <button class="hero-arrow right" @click="heroNext()" aria-label="다음 배너">›</button>
    <transition name="hfade" mode="out-in">
      <div class="hero-inner" :key="heroIndex">
        <template v-if="cur.region===''">
          <div class="kicker">계정 없이 · 알고리즘 없이 · 그냥 지도로</div>
          <h1>동네 이야기는 피드가 아니라 <em>지도</em>에 있어야 합니다.</h1>
          <p>가볼 곳·축제·맛집 정보가 SNS 계정과 알고리즘 안에 갇혀 있어요. 마실은 <b>로그인도, 팔로우도 필요 없이</b> 서울 곳곳의 정보를 지도와 달력으로 펼쳐 봅니다.</p>
          <div class="cta">
            <button class="btn btn-p" @click="$emit('go-map','')">🗺️ 지도로 둘러보기</button>
            <button class="btn btn-g" @click="$emit('go-cal','')">📅 축제·행사 일정 보기</button>
          </div>
        </template>
        <template v-else>
          <div class="kicker">권역 둘러보기 · 대표 명소 {{ cur.place }}</div>
          <h1>{{ REG_NAME[cur.region] }}, <em>오늘 어디로</em> 마실 갈까요?</h1>
          <p>가볼 곳 <b>{{ STATS.byreg[cur.region].toLocaleString() }}곳</b> · 축제·행사 <b>{{ festByReg[cur.region] }}건</b>. {{ REG_NAME[cur.region] }}의 명소와 일정을 지도·달력으로 만나보세요.</p>
          <div class="cta">
            <button class="btn btn-p" @click="$emit('go-map',cur.region)">🗺️ {{ REG_NAME[cur.region] }} 지도로 둘러보기</button>
            <button class="btn btn-g" @click="$emit('go-cal',cur.region)">📅 {{ REG_NAME[cur.region] }} 축제·행사 일정 보기</button>
          </div>
        </template>
      </div>
    </transition>
    <div class="hero-dots">
      <button v-for="(s,i) in heroSlides" :key="i" :class="{on:heroIndex===i}" @click="heroSet(i)" :aria-label="'슬라이드 '+(i+1)"></button>
    </div>
  </div>
</template>

<script>
import { STATS, FEST_BY_REG, HERO } from '../lib.js'

export default {
  name: 'HeroCarousel',
  emits: ['go-map', 'go-cal'],
  data(){ return {
    STATS, festByReg: FEST_BY_REG, REG_NAME: STATS.regions,
    heroSlides: HERO.slice(1), heroIndex: 0, heroTimer: null,
  }},
  computed:{
    cur(){ return this.heroSlides[this.heroIndex]; },
  },
  methods:{
    heroPlay(){ this.heroPause(); this.heroTimer=setInterval(()=>{ this.heroIndex=(this.heroIndex+1)%this.heroSlides.length; },5000); },
    heroPause(){ if(this.heroTimer){ clearInterval(this.heroTimer); this.heroTimer=null; } },
    heroSet(i){ this.heroIndex=i; this.heroPlay(); },
    heroPrev(){ this.heroSet((this.heroIndex-1+this.heroSlides.length)%this.heroSlides.length); },
    heroNext(){ this.heroSet((this.heroIndex+1)%this.heroSlides.length); },
  },
  mounted(){ this.heroPlay(); },
  beforeUnmount(){ this.heroPause(); },
}
</script>

<style scoped>
.hero-carousel{position:relative;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);min-height:356px;display:flex;margin-top:8px}
.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1s ease}
.hero-bg.on{opacity:1}
.hero-bg:first-child{background:linear-gradient(135deg,#6F5FD0,#8C7DE0 55%,#A6C1EC)}
.hero-ov{position:absolute;inset:0;background:linear-gradient(100deg,rgba(38,30,74,.82) 0%,rgba(38,30,74,.5) 48%,rgba(38,30,74,.12) 100%)}
.hero-inner{position:relative;z-index:2;align-self:center;padding:48px 64px;color:#fff;width:100%}
.hero-arrow{position:absolute;z-index:4;top:50%;transform:translateY(-50%);width:40px;height:44px;
  color:#fff;font-size:34px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;
  text-shadow:0 1px 5px rgba(0,0,0,.45);opacity:.85;transition:.15s;background:none}
.hero-arrow:hover{opacity:1;transform:translateY(-50%) scale(1.2)}
.hero-arrow.left{left:16px}
.hero-arrow.right{right:16px}
.hero-dots{position:absolute;z-index:3;bottom:18px;left:64px;display:flex;gap:8px}
.hero-dots button{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.5);transition:.18s;padding:0;border:none}
.hero-dots button.on{background:#fff;width:22px;border-radius:100px}
.hfade-enter-active,.hfade-leave-active{transition:opacity .38s ease,transform .38s ease}
.hfade-enter-from{opacity:0;transform:translateY(10px)}
.hfade-leave-to{opacity:0;transform:translateY(-8px)}
.kicker{font-size:13px;font-weight:800;letter-spacing:.5px;color:#e3dcff;margin-bottom:16px;text-transform:none}
h1{font-family:var(--serif);font-size:40px;font-weight:800;letter-spacing:-1.4px;line-height:1.18;max-width:640px}
h1 em{font-style:normal;color:#ffe27a}
p{margin-top:18px;font-size:16px;line-height:1.65;color:#efeafc;max-width:560px;font-weight:500}
p b{color:#fff;font-weight:800}
.cta{margin-top:28px;display:flex;gap:11px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:15px;padding:13px 24px;border-radius:13px;transition:.15s;border:none}
.btn-p{background:#fff;color:var(--brand-ink)}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.22)}
.btn-g{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.4)}
.btn-g:hover{background:rgba(255,255,255,.25)}
@media(max-width:860px){
  .hero-carousel{min-height:320px}
  .hero-inner{padding:34px 40px}
  .hero-dots{left:40px}
  h1{font-size:28px}
  .hero-arrow{width:34px;height:34px;font-size:20px}
  .hero-arrow.left{left:9px}.hero-arrow.right{right:9px}
}
</style>
