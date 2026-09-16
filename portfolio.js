(() => {
  'use strict';
  const hiddenSubjects = new Set(['b-roll', 'dancing post', 'horror cam']);
  const films = (window.FILMS || []).filter(f => !hiddenSubjects.has(f.subject.trim().toLowerCase())).map(f => ({...f, title: f.title.replace(/\s*[—–-]\s*Study\s*\d+\s*$/i, '').trim()}));
  const $ = (s) => document.querySelector(s);
  const url = (s) => s.split('/').map(encodeURIComponent).join('/');
  const groups = ['Montage','AI PRODUCTION','3D PRODUCT','3D FOOH','TVC Commercial'];
  // Alternate AI subjects so the opening library rows show the range of work.
  const aiBuckets = new Map();
  films.filter(f=>f.group==='AI PRODUCTION').forEach(f=>{
    if(!aiBuckets.has(f.subject)) aiBuckets.set(f.subject,[]);
    aiBuckets.get(f.subject).push(f);
  });
  const subjectOrder = ['TVC','Cinematic','Fashion','Product AI Hyper Motion','Car','Perfume','Dance','Food Hyper Motion',...aiBuckets.keys()];
  const buckets = [...new Set(subjectOrder)].map(s=>aiBuckets.get(s)).filter(Boolean);
  const interleaved = [];
  for(let row=0;buckets.some(b=>b[row]);row++) buckets.forEach(b=>{if(b[row])interleaved.push(b[row])});
  const sorted = [...films.filter(f=>f.group==='Montage'),...interleaved,...films.filter(f=>!['Montage','AI PRODUCTION'].includes(f.group)).sort((a,b)=>groups.indexOf(a.group)-groups.indexOf(b.group))];
  const ai = sorted.filter(f => ['Montage','AI PRODUCTION'].includes(f.group));
  let active = null, timer = null, filter = 'AI Films', subject = 'All subjects', page = 1;
  const pageSize = () => (innerWidth <= 650 ? 2 : innerWidth <= 1050 ? 4 : 5) * 3;
  const dialog = $('#player-dialog'), player = $('#player');
  function stop() {
    clearTimeout(timer);
    if (active) { active.video.pause(); active.card.classList.remove('previewing'); active.video.removeAttribute('src'); active.video.load(); active = null; }
  }
  function preview(card, video, film) {
    stop();
    if (dialog.open || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    active = {card, video};
    timer = setTimeout(async () => {
      if (active?.video !== video) return;
      video.src = url(film.src);
      try { await video.play(); if (active?.video === video) card.classList.add('previewing'); else video.pause(); } catch { /* Keep the real poster visible if playback is unavailable. */ }
    }, 180);
  }
  function openFilm(film) {
    stop(); player.src = url(film.src); player.poster = url(film.poster);
    $('#player-title').textContent = film.title;
    $('#player-detail').textContent = `${film.group} / ${film.subject} · ${film.duration}`;
    $('#original-link').href = url(film.src); $('#player-error').hidden = true;
    dialog.showModal(); player.play().catch(() => {});
  }
  function card(film, eager = false) {
    const article = document.createElement('article'); article.className = 'film-card'; article.dataset.film = film.id;
    const button = document.createElement('button'); button.className = 'card-open'; button.setAttribute('aria-label', `Watch ${film.title}`);
    const media = document.createElement('span'); media.className = 'media';
    const image = new Image(); image.src = url(film.poster); image.alt = `Still from ${film.title}`; image.loading = eager ? 'eager' : 'lazy'; image.decoding = 'async';
    const video = document.createElement('video'); video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none'; video.setAttribute('aria-hidden','true'); video.tabIndex = -1;
    const play = document.createElement('span'); play.className = 'play-icon'; play.textContent = '▶'; play.setAttribute('aria-hidden','true');
    const duration = document.createElement('span'); duration.className='duration'; duration.textContent=film.duration;
    media.append(image,video,play,duration);
    const caption = document.createElement('span'); caption.className='card-caption';
    [['card-type',film.group==='Montage'?'AI FLOW / SHOWREEL':film.group==='AI PRODUCTION'?`AI / ${film.subject}`:film.group],['card-title',film.title]].forEach(([className,text])=>{const e=document.createElement('span');e.className=className;e.textContent=text;caption.append(e)});
    button.append(media,caption); article.append(button);
    button.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')preview(article,video,film)});
    button.addEventListener('pointerleave',()=>{if(active?.card===article)stop()});
    button.addEventListener('focus',()=>preview(article,video,film));
    button.addEventListener('blur',()=>{if(active?.card===article)stop()});
    button.addEventListener('click',()=>openFilm(film));
    return article;
  }
  const pick = (group,subject,index=0) => films.filter(f=>f.group===group&&(!subject||f.subject===subject))[index];
  const featured = [pick('Montage'),pick('AI PRODUCTION','TVC'),pick('AI PRODUCTION','Fashion'),pick('AI PRODUCTION','Cinematic',1),pick('AI PRODUCTION','Product AI Hyper Motion'),...['Car','Perfume','Dance','Food Hyper Motion','Luxury , Neclake','Food','Moto','Skin Ad','Drawline','UGC Review'].map(s=>pick('AI PRODUCTION',s))].filter(Boolean);
  featured.forEach(f=>$('#featured').append(card(f,true)));
  function makeFilter(label, container, current, action) {
    const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-pressed',String(current));button.addEventListener('click',action);container.append(button);
  }
  function render() {
    stop(); $('#filters').replaceChildren();
    ['All work','AI Films','3D Product','3D FOOH','Commercial'].forEach(label=>makeFilter(label,$('#filters'),filter===label,()=>{filter=label;subject='All subjects';page=1;render()}));
    $('#subfilters').replaceChildren();
    if(filter==='AI Films') ['All subjects',...new Set(ai.filter(f=>f.group==='AI PRODUCTION').map(f=>f.subject))].forEach(s=>makeFilter(s,$('#subfilters'),s===subject,()=>{subject=s;page=1;render()}));
    const query=$('#search').value.trim().toLowerCase();
    const mapping={'3D Product':'3D PRODUCT','3D FOOH':'3D FOOH','Commercial':'TVC Commercial','Montage':'Montage'};
    const results=sorted.filter(f=>(filter==='All work'||(filter==='AI Films'?ai.includes(f):f.group===mapping[filter]))&&(subject==='All subjects'||f.subject===subject)&&`${f.title} ${f.subject} ${f.filename} ${f.group}`.toLowerCase().includes(query));
    const size=pageSize(), pages=Math.max(1,Math.ceil(results.length/size));
    page=Math.min(page,pages);
    $('#film-grid').replaceChildren(...results.slice((page-1)*size,page*size).map(f=>card(f)));
    $('#result-count').textContent=`${results.length} FILMS / ${filter.toUpperCase()} · PAGE ${page} OF ${pages}`;$('#empty').hidden=results.length!==0;
    $('#pagination').replaceChildren();
    const pageButton=(label,target,disabled=false)=>{const b=document.createElement('button');b.textContent=label;b.disabled=disabled;if(target===page&&/^\d+$/.test(label))b.setAttribute('aria-current','page');b.setAttribute('aria-label',/^\d+$/.test(label)?`Page ${target}`:label);b.onclick=()=>{page=target;render();$('#library').scrollIntoView({behavior:'instant',block:'start'});$('#pagination [aria-current]')?.focus({preventScroll:true})};$('#pagination').append(b)};
    if(results.length){pageButton('← Previous',page-1,page===1);for(let i=1;i<=pages;i++)pageButton(String(i),i);pageButton('Next →',page+1,page===pages)}
  }
  $('#search').addEventListener('input',()=>{page=1;render()});
  let previousSize=pageSize();window.addEventListener('resize',()=>{if(pageSize()!==previousSize){previousSize=pageSize();page=1;render()}});
  $('.close-player').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
  dialog.addEventListener('close',()=>{player.pause();player.removeAttribute('src');player.load()});
  player.addEventListener('error',()=>{if(dialog.open)$('#player-error').hidden=false});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();player.pause()}});
  window.addEventListener('scroll',()=>{if(active){const r=active.card.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)stop()}},{passive:true});
  const socialProfiles = [
    {name:'Facebook',href:'https://www.facebook.com/vietnguyennh/',path:'M14 21v-8h3l.5-4H14V7c0-1 .3-2 2-2h2V1.5c-.7-.1-1.8-.3-3-.3-3 0-5 1.8-5 5V9H7v4h3v8z'},
    {name:'YouTube',href:'',path:'M21 7c-.2-1.4-1-2.3-2.4-2.5C16.5 4 12 4 12 4s-4.5 0-6.6.5C4 4.7 3.2 5.6 3 7c-.3 1.5-.3 5-.3 5s0 3.5.3 5c.2 1.4 1 2.3 2.4 2.5C7.5 20 12 20 12 20s4.5 0 6.6-.5c1.4-.2 2.2-1.1 2.4-2.5.3-1.5.3-5 .3-5s0-3.5-.3-5z M10 8l6 4-6 4z'},
    {name:'Instagram',href:'',path:'M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3zm5 3a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zm6-4a1 1 0 110 2 1 1 0 010-2z'},
    {name:'TikTok',href:'',path:'M14 2h3c.3 3 2 4.6 5 5v3c-2 0-3.6-.6-5-1.6V16a6 6 0 11-6-6v3a3 3 0 103 3z'}
  ];
  socialProfiles.forEach(s=>{const link=document.createElement(s.href?'a':'span');link.className='social-link';if(s.href){link.href=s.href;link.target='_blank';link.rel='noopener noreferrer'}else{link.setAttribute('aria-disabled','true');link.title='Profile link not yet provided'}link.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="${s.path}"/></svg><span>${s.name}</span>${s.href?'<b>↗</b>':'<small>SOON</small>'}`;$('#social-links').append(link)});
  const intro=$('#envelope-intro');let introTimer, introFocus;
  const closeIntro=()=>{clearTimeout(introTimer);intro.classList.remove('is-opening');$('.paper').inert=false;if(intro.contains(document.activeElement)){if(introFocus&&introFocus!==document.body)introFocus.focus({preventScroll:true});else $('#skip-intro').blur()}intro.hidden=true;intro.setAttribute('aria-hidden','true');document.body.classList.remove('intro-running')};
  const openIntro=()=>{stop();player.pause();if(matchMedia('(prefers-reduced-motion: reduce)').matches){closeIntro();return}introFocus=document.activeElement;intro.hidden=false;intro.setAttribute('aria-hidden','false');$('.paper').inert=true;document.body.classList.add('intro-running');intro.classList.remove('is-opening');$('#skip-intro').focus({preventScroll:true});requestAnimationFrame(()=>requestAnimationFrame(()=>intro.classList.add('is-opening')));clearTimeout(introTimer);introTimer=setTimeout(closeIntro,3600)};
  $('#skip-intro').addEventListener('click',closeIntro);$('#replay-intro').addEventListener('click',openIntro);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeIntro()});
  render();openIntro();
})();
