
import { S3_QUESTIONS } from './questions_s3.js';

const $ = (id)=>document.getElementById(id);

const caseSelect = $('caseSelect');
const caseTitle = $('caseTitle');
const caseLines = $('caseLines');
const quotesBox = $('quotesBox');
const quotesCount = $('quotesCount');

const answerP = $('answerP');
const answerE = $('answerE');
const countP = $('countP');
const countE = $('countE');

const modelBox = $('modelBox');
const modelP = $('modelP');
const modelE = $('modelE');

let currentIndex = 0;
let selected = new Set(); // line indexes

function setCounts(){
  countP.textContent = `文字数：${answerP.value.length}`;
  countE.textContent = `文字数：${answerE.value.length}`;
  quotesCount.textContent = `文字数：${quotesBox.value.length}`;
}
['input','change'].forEach(ev=>{
  answerP.addEventListener(ev,setCounts);
  answerE.addEventListener(ev,setCounts);
});

function buildSelect(){
  caseSelect.innerHTML = '';
  S3_QUESTIONS.forEach((q,idx)=>{
    const opt=document.createElement('option');
    opt.value=String(idx);
    opt.textContent=q.caseTitle;
    caseSelect.appendChild(opt);
  });
}

function splitLines(text){
  // keep original line breaks but also split long lines roughly by punctuation for tap usability
  const raw = text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const out=[];
  for(const ln of raw){
    if(ln.length<=48){ out.push(ln); continue; }
    // split by Japanese punctuation
    const parts = ln.split(/(?<=[。！？])\s*/);
    if(parts.length===1){ out.push(ln); }
    else{ for(const p of parts){ if(p.trim()) out.push(p.trim()); } }
  }
  return out;
}

function render(){
  const q=S3_QUESTIONS[currentIndex];
  caseSelect.value=String(currentIndex);
  caseTitle.textContent = q.caseTitle;

  // reset selections
  selected = new Set();
  quotesBox.value = '';
  modelP.textContent = q.modelProblem;
  modelE.textContent = q.modelEvidence;

  // render lines
  caseLines.innerHTML='';
  const lines = splitLines(q.caseText);
  lines.forEach((ln,idx)=>{
    const div=document.createElement('div');
    div.className='line';
    div.dataset.idx=String(idx);
    div.textContent = ln;
    div.addEventListener('click',()=>{
      const key=idx;
      if(selected.has(key)){ selected.delete(key); div.classList.remove('selected'); }
      else{ selected.add(key); div.classList.add('selected'); }
      const picked = Array.from(selected).sort((a,b)=>a-b).map(i=>`「${lines[i]}」`);
      quotesBox.value = picked.join('\n');
      setCounts();
    });
    caseLines.appendChild(div);
  });

  setCounts();
}

function next(){
  currentIndex = (currentIndex + 1) % S3_QUESTIONS.length;
  modelBox.classList.add('hidden');
  $('btnToggleModel').textContent = '模範を表示';
  render();
}

function toggleModel(){
  const hidden = modelBox.classList.toggle('hidden');
  $('btnToggleModel').textContent = hidden ? '模範を表示' : '模範をクリア';
}

async function copyText(txt){
  try{ await navigator.clipboard.writeText(txt); }
  catch(e){
    const ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); ta.remove();
  }
}

$('btnNew').addEventListener('click', next);
$('btnToggleModel').addEventListener('click', toggleModel);
caseSelect.addEventListener('change', (e)=>{ currentIndex=parseInt(e.target.value,10)||0; modelBox.classList.add('hidden'); $('btnToggleModel').textContent='模範を表示'; render(); });

$('btnCopyP').addEventListener('click',()=>copyText(answerP.value));
$('btnCopyE').addEventListener('click',()=>copyText(answerE.value));
$('btnCopyQuotes').addEventListener('click',()=>copyText(quotesBox.value));

$('btnClearP').addEventListener('click',()=>{ answerP.value=''; setCounts(); });
$('btnClearE').addEventListener('click',()=>{ answerE.value=''; setCounts(); });
$('btnClearQuotes').addEventListener('click',()=>{
  quotesBox.value='';
  selected=new Set();
  document.querySelectorAll('.line.selected').forEach(el=>el.classList.remove('selected'));
  setCounts();
});

$('btnCopyModel').addEventListener('click',()=>{
  const q=S3_QUESTIONS[currentIndex];
  copyText(`【設問3①】\n${q.modelProblem}\n\n【設問3②】\n${q.modelEvidence}`);
});

buildSelect();
render();
