(function (root) {
  'use strict';
  function normalizeClass(value) {
    const text = String(value || '').toUpperCase().replace(/\s/g, '');
    const match = text.match(/^([123])(?:ª|º|A|O)?(?:SÉRIE|SERIE)?([ABC])$/);
    return match ? match[1] + 'ª' + match[2] : null;
  }
  function validChoices(choices, masks) {
    return Array.isArray(choices) && choices.length === 3 && new Set(choices).size === 3 && choices.every(id => Object.prototype.hasOwnProperty.call(masks, id) && masks[id].active !== false);
  }
  function ranking(masks, ballots) {
    const counts = Object.fromEntries(Object.keys(masks).map(id => [id, 0]));
    let participants = 0;
    for (const ballot of Object.values(ballots || {})) {
      const choices = [ballot.first, ballot.second, ballot.third];
      if (choices.length === 3 && new Set(choices).size === 3 && choices.every(id => Object.prototype.hasOwnProperty.call(masks, id))) {
        participants++;
        choices.forEach(id => counts[id]++);
      }
    }
    const total = participants * 3;
    const rows = Object.entries(masks).filter(([,m]) => m.active !== false).map(([id,m]) => ({id,...m,votes:counts[id],share:total ? counts[id]/total*100 : 0})).sort((a,b) => b.votes-a.votes || Number(a.number)-Number(b.number));
    rows.forEach((row,i) => {row.position = i && rows[i-1].votes === row.votes ? rows[i-1].position : i+1;});
    return {rows, participants, total};
  }
  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[\s\uFEFF]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g,'""') + '"';
  }
  function pickRoster(source, allowed) {
    const result = {};
    const candidates = [];
    for (const [id, student] of Object.entries(source.alunos || {})) {
      const turma = (source.turmas || {})[student.turmaId];
      if (!turma || student.ativo === false || !String(student.nome || '').trim()) continue;
      const explicit = normalizeClass(String(turma.serie || '') + String(turma.letra || ''));
      const fields = [turma.nome,turma.name,turma.turma,turma.label,turma.id,student.turmaId];
      let className = explicit || fields.map(normalizeClass).find(Boolean);
      if (!className) {
        for (const field of fields) {
          const found = String(field || '').toUpperCase().match(/(?:^|[^0-9])([123])[ªº]?\s*[-_ ]?([ABC])(?:$|[^A-Z])/);
          if (found) { className = found[1] + 'ª' + found[2]; break; }
        }
      }
      if (!allowed.includes(className)) continue;
      const name = student.nome.trim();
      const nameKey = className + ':' + name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ');
      candidates.push({name,className,nameKey,registration:String(student.matricula || '').trim(),verified:Boolean(student.siapVerificadoEm)});
    }
    const registrations = {};
    for (const candidate of candidates) if(candidate.registration) (registrations[candidate.nameKey] ||= new Set()).add(candidate.registration);
    for (const candidate of candidates) {
      let registration = candidate.registration;
      if (!registration && registrations[candidate.nameKey]?.size === 1) registration = [...registrations[candidate.nameKey]][0];
      if (!registration && registrations[candidate.nameKey]?.size > 1) continue;
      const identity = registration ? 'registration:' + registration : 'name:' + candidate.nameKey;
      if (!result[identity] || candidate.verified) result[identity] = {name:candidate.name,className:candidate.className};
    }
    return result;
  }
  const api = {normalizeClass, validChoices, ranking, pickRoster, csvCell};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ContestCore = api;
})(typeof globalThis === 'object' ? globalThis : this);
