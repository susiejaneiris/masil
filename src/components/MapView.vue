<template>
  <div class="view">
    <div class="view-head"><h2>지도에서 찾기</h2><span class="sub">점을 누르면 상세 정보가 열려요</span></div>
    <div class="toolbar">
      <select class="reg" :class="{picked:selRegion!==''}" v-model="selRegion">
        <option value="">전체 권역</option>
        <option v-for="(r,i) in REG_NAME" :key="i" :value="i">{{ r }}</option>
      </select>
      <input class="search" v-model="q" placeholder="이름으로 검색…">
      <div class="chips">
        <button class="chip" v-for="(name,i) in CAT_NAME" :key="i" :class="cats.includes(i)?'on':'off'" @click="toggleCat(i)">
          <span class="dot" :style="{background:CAT_COLOR[i]}"></span>{{ name }}
        </button>
      </div>
    </div>
    <div class="map-wrap">
      <div id="map"></div>
      <div class="list">
        <div class="list-head" v-if="filtered.length">총 {{ filtered.length.toLocaleString() }}곳<span v-if="filtered.length>150"> · 150곳 표시</span></div>
        <div class="list-empty" v-if="!filtered.length">조건에 맞는 장소가 없어요</div>
        <button class="fcard" v-for="d in visiblePlaces" :key="d.x" @click="openDetail(d)">
          <img class="thumb" v-if="d.im" :src="d.im" loading="lazy" alt="">
          <span class="thumb" v-else></span>
          <span class="tx">
            <span class="badge" :style="{background:CAT_COLOR[d.c]}">{{ CAT_NAME[d.c] }}</span>
            <h3>{{ d.t }}</h3>
            <div class="fmeta">{{ REG_NAME[d.r] }} <span v-if="d.g">· {{ d.g }}</span></div>
          </span>
        </button>
      </div>
    </div>

    <!-- 장소 상세 모달 -->
    <div class="modal-bg" v-if="detail" @click.self="detail=null">
      <div class="modal modal-split" :class="{'no-media':!detail.im}">
        <button class="m-close" @click="detail=null">×</button>
        <div class="m-media" v-if="detail.im" :style="{background:CAT_COLOR[detail.c]}">
          <img :src="detail.im" alt="">
        </div>
        <div class="m-side">
          <div class="m-side-head">
            <span class="mbadge" :style="{background:CAT_COLOR[detail.c]}">{{ CAT_NAME[detail.c] }}</span>
            <h3>{{ detail.t }}</h3>
          </div>
          <div class="m-body">
            <div class="m-row"><span class="k">지역</span><span class="v">{{ REG_NAME[detail.r] }} {{ detail.g }}</span></div>
            <div class="m-row" v-if="detail.s"><span class="k">기간</span><span class="v mono">{{ detail.s }} ~ {{ detail.e }}</span></div>
            <div class="m-row" v-if="detail.te"><span class="k">문의</span><span class="v">{{ detail.te }}</span></div>
            <div class="m-row"><span class="k">주소</span><button class="v m-addr" @click="openLoc(detail)">{{ detail.a || '-' }} ↗</button></div>
            <button class="m-map" @click="openGmap(detail)">지도앱에서 길찾기</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 위치 미니지도 -->
    <div class="modal-bg" v-if="loc" @click.self="loc=null">
      <div class="locpop">
        <div class="lh"><div><div class="lt">{{ loc.t }}</div><div class="la">{{ REG_NAME[loc.r] }} {{ loc.g }} · {{ loc.a }}</div></div>
          <button class="x" @click="loc=null">×</button></div>
        <div id="miniMap"></div>
      </div>
    </div>
  </div>
</template>

<script>
import L from 'leaflet'
import { DATA, STATS, CAT_COLOR, REGBOUNDS } from '../lib.js'

export default {
  name: 'MapView',
  props: {
    region: { default: '' },
    cat: { default: null },
  },
  data(){ return {
    DATA, CAT_COLOR, CAT_NAME: STATS.cats, REG_NAME: STATS.regions,
    mapReady:false,
    selRegion: this.region ?? '',
    cats: this.cat==null ? [0,1,2,3,4,6,7] : [this.cat],
    q:'', detail:null, loc:null,
    map:null, markerLayer:null, miniMap:null,
  }},
  computed:{
    filtered(){
      const q=this.q.trim().toLowerCase();
      return DATA.filter(d=> this.cats.includes(d.c)
        && (this.selRegion===''||d.r==this.selRegion)
        && (!q||d.t.toLowerCase().includes(q)) );
    },
    visiblePlaces(){ return this.filtered.slice(0,150); },
  },
  watch:{
    region(v){ this.selRegion = v ?? ''; },
    cat(v){ this.cats = v==null ? [0,1,2,3,4,6,7] : [v]; },
    filtered(){ if(this.mapReady) this.renderMap(); },
    selRegion(){ this.zoomToRegion(); },
    loc(v){ if(v) this.$nextTick(()=>this.buildMini(v)); else if(this.miniMap){ this.miniMap.remove(); this.miniMap=null; } },
  },
  methods:{
    toggleCat(i){ const k=this.cats.indexOf(i); if(k>=0) this.cats.splice(k,1); else this.cats.push(i); },
    ensureMap(){
      if(this.mapReady) return; this.mapReady=true;
      this.map=L.map('map',{preferCanvas:true,scrollWheelZoom:true}).setView([37.5665,126.978],11);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {attribution:'© OpenStreetMap © CARTO',maxZoom:19,subdomains:'abcd'}).addTo(this.map);
      this.markerLayer=L.layerGroup().addTo(this.map); this.renderMap(); this.zoomToRegion();
    },
    renderMap(){
      if(!this.markerLayer) return;
      this.markerLayer.clearLayers();
      for(const d of this.filtered){
        const m=L.circleMarker([d.la,d.ln],{radius:5,weight:1,color:'#fff',fillColor:CAT_COLOR[d.c],fillOpacity:.92});
        m.on('click',()=>this.openDetail(d)); this.markerLayer.addLayer(m);
      }
    },
    zoomToRegion(){
      if(!this.mapReady) return;
      if(this.selRegion===''||this.selRegion===null){ this.map.setView([37.5665,126.978],11,{animate:true}); return; }
      const b=REGBOUNDS[this.selRegion];
      if(b) this.map.fitBounds(b,{padding:[36,36],maxZoom:13,animate:true});
    },
    openDetail(d){ this.detail=d; },
    openGmap(d){ window.open('https://www.google.com/maps/search/?api=1&query='+d.la+','+d.ln,'_blank'); },
    openLoc(d){ this.loc=d; },
    buildMini(d){
      if(this.miniMap){ this.miniMap.remove(); this.miniMap=null; }
      this.miniMap=L.map('miniMap',{zoomControl:true,attributionControl:false}).setView([d.la,d.ln],15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19}).addTo(this.miniMap);
      L.circleMarker([d.la,d.ln],{radius:8,weight:2,color:'#fff',fillColor:CAT_COLOR[d.c],fillOpacity:1}).addTo(this.miniMap);
      this.miniMap.invalidateSize();
    },
  },
  mounted(){
    this.$nextTick(()=>{ this.ensureMap(); if(this.map) this.map.invalidateSize(); });
    this._esc=(e)=>{ if(e.key==='Escape'){ this.detail=null; this.loc=null; } };
    document.addEventListener('keydown', this._esc);
  },
  beforeUnmount(){
    document.removeEventListener('keydown', this._esc);
    if(this.miniMap){ this.miniMap.remove(); this.miniMap=null; }
    if(this.map){ this.map.remove(); this.map=null; }
  },
}
</script>

<style scoped>
/* 툴바/칩 */
.toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:14px}
select.reg,input.search{border:1px solid var(--line);background:var(--surface);border-radius:11px;padding:9px 13px;font-family:inherit;font-size:14px;font-weight:600;color:var(--ink);box-shadow:var(--shadow-sm);accent-color:#B7A7E6}
input.search{min-width:190px}
/* 포커스·선택 시 짙은 보라 대신 파스텔 보라 */
input.search:focus,select.reg:focus{outline:none;border-color:#B7A7E6}
select.reg.picked{background:var(--accent-soft);border-color:#CFC4EE;color:var(--accent-deep)}
.chips{display:flex;gap:7px;flex-wrap:wrap}
.chip{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:100px;background:var(--surface);border:1px solid var(--line);font-size:12.5px;font-weight:700;color:var(--muted);transition:.15s}
.chip .dot{width:9px;height:9px;border-radius:50%;flex:0 0 auto}
/* 선택 시 진한 보라 대신 파스텔 보라 (전역 .chips button.on 덮어쓰기) */
.chip.on{background:var(--accent-soft);color:var(--accent-deep);border-color:#CFC4EE;box-shadow:var(--shadow-sm)}
.chip.off{opacity:.45}

/* 지도 */
.map-wrap{display:grid;grid-template-columns:1fr 348px;gap:16px;align-items:stretch}
#map{height:600px;border-radius:var(--r);border:1px solid var(--line);box-shadow:var(--shadow-sm);z-index:1}
.list{height:600px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding-right:2px}
.list-head{font-size:12.5px;color:var(--muted);font-weight:700;padding:2px 2px 0}
.list-empty{color:var(--muted);font-size:14px;text-align:center;padding:40px 10px}
.fcard{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:13px 15px;box-shadow:var(--shadow-sm);text-align:left;transition:.15s;display:flex;gap:12px;width:100%;align-items:center}
.fcard:hover{border-color:var(--line-strong);transform:translateY(-1px);box-shadow:var(--shadow)}
.fcard .thumb{width:52px;height:52px;border-radius:10px;object-fit:cover;flex:0 0 auto;background:#EEE}
.fcard .tx{min-width:0;flex:1}
.badge{font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:100px;color:#fff}
.fcard h3{font-size:14.5px;font-weight:800;letter-spacing:-.3px;margin:5px 0 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fmeta{font-size:12px;color:var(--muted);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mono{font-family:var(--mono)}

/* 모달 */
.modal-bg{position:fixed;inset:0;background:rgba(40,32,66,.5);backdrop-filter:blur(3px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:var(--surface);border-radius:20px;width:min(480px,100%);max-height:88vh;overflow:auto;box-shadow:var(--shadow);animation:pop .25s ease;position:relative}
@keyframes pop{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}
.modal.modal-split{width:min(780px,100%);display:flex;flex-direction:row;align-items:stretch;overflow:hidden}
.modal.modal-split.no-media{width:min(460px,100%)}
.m-media{flex:0 0 46%;display:flex;align-items:center;justify-content:center;padding:22px;min-height:300px;background:#EEE}
.m-media img{max-width:100%;max-height:min(72vh,540px);width:auto;height:auto;object-fit:contain;border-radius:12px;box-shadow:0 10px 28px rgba(0,0,0,.3);display:block}
.m-side{flex:1 1 0;min-width:0;display:flex;flex-direction:column;overflow-y:auto;max-height:88vh}
.m-side-head{padding:24px 26px 6px}
.m-side-head .mbadge{font-size:11.5px;font-weight:800;color:#fff;padding:4px 12px;border-radius:100px;display:inline-block;margin-bottom:12px}
.m-side-head h3{font-family:var(--serif);font-size:22px;font-weight:800;letter-spacing:-.7px;line-height:1.28;color:var(--ink)}
.m-close{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;background:rgba(40,32,66,.4);color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;line-height:1;z-index:3;backdrop-filter:blur(2px);border:none}
.m-close:hover{background:rgba(40,32,66,.62)}
.m-body{padding:14px 26px 26px}
.m-row{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid var(--line)}
.m-row:last-of-type{border-bottom:none}
.m-row .k{font-size:13px;font-weight:800;color:var(--muted);width:56px;flex:0 0 auto}
.m-row .v{font-size:14px;color:var(--ink);font-weight:600}
.m-addr{text-align:left;color:var(--brand-ink);font-weight:800;text-decoration:underline;text-underline-offset:3px;background:none;border:none}
.m-map{margin-top:16px;width:100%;background:var(--accent);color:#fff;font-weight:800;font-size:14px;padding:12px;border-radius:12px;border:none}
.m-map:hover{background:var(--accent-deep)}
#miniMap{height:240px}
.locpop{background:#fff;border-radius:18px;width:min(440px,100%);overflow:hidden;box-shadow:var(--shadow);animation:pop .22s ease}
.locpop .lh{padding:15px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--line)}
.locpop .lt{font-weight:800;font-size:15px}.locpop .la{font-size:12.5px;color:var(--muted);font-weight:600}
.locpop .x{margin-left:auto;width:28px;height:28px;border-radius:50%;background:var(--paper);font-size:16px;display:flex;align-items:center;justify-content:center;border:none}
@media(max-width:860px){
  .map-wrap{grid-template-columns:1fr}#map{height:420px}.list{height:auto;max-height:360px}
}
@media(max-width:640px){
  .modal.modal-split{flex-direction:column;overflow-y:auto}
  .m-media{flex:none;width:100%;min-height:0;padding:16px 16px 4px}
  .m-media img{max-height:44vh}
  .m-side{overflow:visible;max-height:none}
  .m-side-head{padding:16px 22px 4px}
}
</style>
