const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('./core.js');
const masks={a:{number:1,active:true},b:{number:2,active:true},c:{number:3,active:true},d:{number:4,active:true}};
test('CSV preserva texto e neutraliza fórmulas de planilha',()=>{
  assert.equal(core.csvCell('=1+1'),'"\'=1+1"');
  assert.equal(core.csvCell(' @SUM(1)'),'"\' @SUM(1)"');
  assert.equal(core.csvCell('Uma "obra"'),'"Uma ""obra"""');
  assert.equal(core.csvCell(12),'"12"');
});
test('exige exatamente três máscaras distintas e disponíveis',()=>{
  assert.equal(core.validChoices(['a','b','c'],masks),true);
  for(const choices of [['a','b'],['a','a','b'],['a','b','x'],['a','b','c','d']]) assert.equal(core.validChoices(choices,masks),false);
  assert.equal(core.validChoices(['a','b','c'],{...masks,c:{active:false}}),false);
});
test('a apuração soma três escolhas por estudante e ignora cédulas inválidas',()=>{
  const r=core.ranking(masks,{s1:{first:'a',second:'b',third:'c'},s2:{first:'a',second:'b',third:'d'},invalid:{first:'a',second:'a',third:'b'}});
  assert.equal(r.participants,2);assert.equal(r.total,6);
  assert.deepEqual(r.rows.map(r=>[r.id,r.votes,r.position]),[['a',2,1],['b',2,1],['c',1,3],['d',1,3]]);
  assert.ok(Math.abs(r.rows.reduce((sum,r)=>sum+r.share,0)-100)<1e-9);
});
test('ranking sem votos mantém todas as máscaras empatadas',()=>{
  const r=core.ranking(masks,{});assert.equal(r.total,0);assert.equal(r.rows.every(row=>row.position===1&&row.share===0),true);
});
test('as chamadas excluem 9º ano, inativos e duplicação por disciplina',()=>{
  const source={turmas:{h1:{nome:'1ª Série A',serie:1,letra:'A'},f1:{nome:'Filosofia',serie:1,letra:'A'},h9:{nome:'9ºA'},h3:{nome:'3ªC'}},alunos:{a:{nome:'ANA SILVA',turmaId:'h1',matricula:'100'},a2:{nome:'Ana Silva',turmaId:'f1',matricula:'100'},a3:{nome:'Ana Silva',turmaId:'f1'},b:{nome:'Bruna',turmaId:'h9'},c:{nome:'Carla',turmaId:'h3',ativo:false},d:{nome:'Daniela',turmaId:'h3'}}};
  const roster=core.pickRoster(source,['1ªA','3ªC']);assert.equal(Object.keys(roster).length,2);assert.deepEqual(Object.values(roster).map(s=>s.className),['1ªA','3ªC']);
});
test('homônimos com matrículas distintas permanecem como pessoas distintas',()=>{
  const roster=core.pickRoster({turmas:{a:{nome:'2A'}},alunos:{a:{nome:'João Silva',turmaId:'a',matricula:'1'},b:{nome:'João Silva',turmaId:'a',matricula:'2'}}},['2ªA']);assert.equal(Object.keys(roster).length,2);
});
test('as regras bloqueiam alterações e exclusões de votos e rejeitam campos extras',()=>{
  const r=require('./database.rules.test.json').rules.amefricanidades_2026;
  assert.ok(r.ballots.$student['.write'].includes('!data.exists()'));
  assert.ok(r.ballots.$student['.write'].includes('newData.exists()'));
  assert.equal(r.ballots.$student.$other['.validate'],false);
  assert.equal(r.roster.$student.$other['.validate'],false);
  assert.ok(r.catalog['.write'].includes('email_verified'));
});
