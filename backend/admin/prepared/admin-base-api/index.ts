import { platformReport, accountLogins } from './platform-report.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store'
}
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:cors})
const clean=(v:any)=>String(v??'').trim()
const emailNorm=(v:any)=>clean(v).toLowerCase()
const countMap=(rows:any[],key:string)=>{const m=new Map<string,number>();for(const r of rows||[]){const k=String(r?.[key]||'');if(k)m.set(k,(m.get(k)||0)+1)}return m}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    if(req.method!=='POST')return json({error:'Método não permitido.'},405)
    const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const auth=req.headers.get('Authorization')||''
    if(!auth.startsWith('Bearer '))return json({error:'Autenticação obrigatória.'},401)
    const token=auth.slice(7)
    const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}}),admin=createClient(url,service)
    const {data:{user},error:uErr}=await userClient.auth.getUser(token)
    if(uErr||!user)return json({error:'Sessão inválida.'},401)
    const {data:profile,error:pErr}=await admin.from('profiles').select('id,role,approval_status').eq('id',user.id).maybeSingle()
    if(pErr||!profile||profile.role!=='super_admin'||profile.approval_status!=='approved')return json({error:'Acesso exclusivo do Super Admin.'},403)

    const body=await req.json().catch(()=>({}))
    const action=String(body.action||'organizations')
    if(action==='platform_report'){
      const days=Number(body.days||30);if(![7,30,90].includes(days))return json({error:'Período inválido.'},400)
      return json(await platformReport(admin,days))
    }
    if(action==='account_access'||action==='reset_student_pin'){
      const target=clean(body.target_user)
      const {data:account,error:ae}=await admin.from('profiles').select('id,role').eq('id',target).maybeSingle()
      if(ae||!account)return json({error:'Conta não encontrada.'},404)
      if(action==='reset_student_pin'){
        if(account.role!=='student')return json({error:'Esta ação é exclusiva para alunos.'},403)
        const {data:student,error:se}=await admin.from('students').select('id').eq('id',clean(body.student_id)).eq('auth_user_id',target).maybeSingle()
        if(se||!student)return json({error:'Aluno não vinculado a esta conta.'},403)
        const {data,error}=await admin.rpc('student_pin_manage',{actor:user.id,body:{action:'issue',student_id:student.id,class_id:clean(body.class_id)}})
        if(error)return json({error:'Não foi possível redefinir o PIN. Confira se aluno, turma e instituição estão ativos.'},400)
        return json({ok:true,code:data.code,pin:data.pin})
      }
      const {data:authData,error:authError}=await admin.auth.admin.getUserById(target)
      if(authError||!authData.user)return json({error:'Não foi possível consultar o acesso.'},400)
      const pinClasses:any[]=[]
      if(account.role==='student'){
        const {data:students,error}=await admin.from('students').select('id,full_name,enrollments(is_active,classes(id,name,is_active,academic_years(is_active,organizations(name,is_active))))').eq('auth_user_id',target).eq('is_active',true)
        if(error)return json({error:'Não foi possível consultar as turmas de acesso.'},400)
        const one=(v:any)=>Array.isArray(v)?v[0]:v
        for(const student of students||[])for(const e of student.enrollments||[]){const c=one(e.classes),y=one(c?.academic_years),o=one(y?.organizations);if(e.is_active&&c?.is_active&&y?.is_active&&o?.is_active)pinClasses.push({student_id:student.id,class_id:c.id,label:o.name+' · '+c.name})}
      }
      return json({ok:true,created_at:authData.user.created_at,last_sign_in_at:authData.user.last_sign_in_at||null,email_confirmed:!!authData.user.email_confirmed_at,pin_classes:pinClasses})
    }
    if(action==='change_password'){
      const target=clean(body.target_user);
      const password=typeof body.password==='string'?body.password:'';
      if(password.length<8||password.length>128)return json({error:'A senha deve ter de 8 a 128 caracteres.'},400)
      const {data:account,error:accountError}=await admin.from('profiles').select('id,role').eq('id',target).maybeSingle();
      if(accountError||!account)return json({error:'Conta não encontrada.'},404)
      if(account.role!=='teacher'||target===user.id)return json({error:'Esta ação está disponível apenas para contas de professores.'},403)
      const {error:updateError}=await admin.auth.admin.updateUserById(target,{password});
      if(updateError)return json({error:updateError.code==='same_password'?'Escolha uma senha diferente da atual.':updateError.code==='weak_password'?'Escolha uma senha mais forte, com letras, números e símbolos.':'Não foi possível alterar a senha. Tente novamente.'},400)
      return json({ok:true})
    }
    if(['approve_account','hide_account','delete_account'].includes(action)){
      const target=clean(body.target_user);
      const operation=action==='approve_account'?'approve':action==='hide_account'?'visibility':'delete_check';
      const {data,error}=await admin.rpc('admin_manage_account',{actor:user.id,target,body:{action:operation,role:body.role,hidden:body.hidden}});
      if(error)return json({error:['42501','P0001'].includes(error.code)?error.message:'Não foi possível alterar a conta.'},error.code==='42501'?403:400)
      if(action==='delete_account'){
        const {error:deletion}=await admin.auth.admin.deleteUser(target);
        if(deletion)return json({error:'Não foi possível excluir: a conta pode possuir vínculos, créditos ou histórico. Use Ocultar para preservar os dados.'},409)
      }
      return json(data)
    }
    if(action==='create_organization'){
      const {data,error}=await admin.rpc('admin_create_organization',{actor:user.id,teacher:body.teacher_id,body:{name:clean(body.name),year:body.year,request_id:body.request_id}});
      if(error)return json({error:['42501','P0001'].includes(error.code)?error.message:'Não foi possível criar a instituição. Confira os dados.'},error.code==='42501'?403:400)
      return json(data)
    }
    const {data:organizations,error:oErr}=await admin.from('organizations').select('id,name,is_active').order('name')
    if(oErr)throw oErr
    if(action==='organizations'){
      const {data:teachers,error:tErr}=await admin.from('profiles').select('id,full_name,email').eq('role','teacher').eq('approval_status','approved').neq('teacher_scope','institution_read').order('full_name');
      if(tErr)throw tErr
      const {data:accounts,error:aErr}=await admin.from('profiles').select('id,full_name,email,role,requested_role,approval_status,admin_hidden').order('full_name');
      if(aErr)throw aErr
      const logins=await accountLogins(admin);
      return json({ok:true,organizations:organizations||[],teachers:(teachers||[]).filter(t=>!(accounts||[]).find(a=>a.id===t.id)?.admin_hidden),accounts:(accounts||[]).map(a=>({...a,last_sign_in_at:logins.get(a.id)||null}))})
    }

    const organizationId=clean(body.organization_id)
    if(!organizationId)return json({error:'Selecione a instituição.'},400)
    const org=(organizations||[]).find((o:any)=>o.id===organizationId)
    if(!org)return json({error:'Instituição não encontrada.'},404)
    const {data:years,error:yErr}=await admin.from('academic_years').select('id,year,is_active').eq('organization_id',organizationId).eq('is_active',true).order('year',{ascending:false}).limit(1)
    if(yErr)throw yErr
    const year=years?.[0]||null

    const gradeLevel=(v:any)=>{const n=Number(String(v??'').match(/\d+/)?.[0]||0);if(!Number.isInteger(n)||n<1||n>9)throw new Error('Selecione uma série de 1º a 9º.');return n}
    const sectionNorm=(v:any)=>{const s=clean(v).toUpperCase().replace(/\s+/g,'');if(!s)throw new Error('Informe a identificação da turma, por exemplo A.');if(!/^[A-Z0-9-]{1,6}$/.test(s))throw new Error('Use uma identificação curta para a turma, como A, B ou C.');return s}
    const shiftNorm=(v:any)=>{const s=clean(v);if(!s)return null;const allowed=['Manhã','Tarde','Noite','Integral'];if(!allowed.includes(s))throw new Error('Turno inválido.');return s}
    const classIdentity=(g:any,s:any)=>{const n=gradeLevel(g),section=sectionNorm(s);return {grade_level:n,grade:`${n}º`,section,name:`${n}º ${section}`}}

    async function yearClassesAll(){
      if(!year)return []
      const {data,error}=await admin.from('classes').select('id,name,grade,section,shift,is_active,owner_teacher_id,academic_year_id').eq('academic_year_id',year.id)
      if(error)throw error
      return data||[]
    }
    async function assertClass(classId:string,requireActive=false){
      if(!year)throw new Error('Nenhum ano letivo ativo foi encontrado para esta instituição.')
      const {data:c,error}=await admin.from('classes').select('id,name,grade,section,shift,is_active,owner_teacher_id,academic_year_id').eq('id',classId).eq('academic_year_id',year.id).maybeSingle()
      if(error)throw error
      if(!c)throw new Error('Turma não encontrada.')
      if(requireActive&&!c.is_active)throw new Error('Esta turma está oculta. Reative-a antes de usar.')
      return c
    }
    async function assertStudent(studentId:string){
      const {data:s,error}=await admin.from('students').select('id,organization_id,full_name,preferred_name,email,is_active,auth_user_id,created_by').eq('id',studentId).eq('organization_id',organizationId).maybeSingle()
      if(error)throw error
      if(!s)throw new Error('Aluno não encontrado.')
      return s
    }
    async function upsertEnrollment(studentId:string,classId:string,active:boolean){
      const {data:existing,error}=await admin.from('enrollments').select('id').eq('student_id',studentId).eq('class_id',classId).maybeSingle()
      if(error)throw error
      if(existing){const r=await admin.from('enrollments').update({is_active:active}).eq('id',existing.id);if(r.error)throw r.error;return}
      const r=await admin.from('enrollments').insert({student_id:studentId,class_id:classId,is_active:active});if(r.error)throw r.error
    }

    async function bootstrap(){
      if(!year)return {ok:true,organization:org,academic_year:null,classes:[],students:[]}
      let classes=await yearClassesAll()
      const classIds=classes.map((c:any)=>c.id)
      let enrollments:any[]=[]
      if(classIds.length){const {data,error}=await admin.from('enrollments').select('id,student_id,class_id,enrolled_at,is_active').in('class_id',classIds);if(error)throw error;enrollments=data||[]}
      const {data:studentRows,error:sErr}=await admin.from('students').select('id,full_name,preferred_name,email,is_active,auth_user_id,created_by').eq('organization_id',organizationId)
      if(sErr)throw sErr
      const studentsRaw=studentRows||[],studentIds=studentsRaw.map((s:any)=>s.id)
      const classById=new Map(classes.map((c:any)=>[c.id,c])),enrsByStudent=new Map<string,any[]>()
      for(const e of enrollments){if(!enrsByStudent.has(e.student_id))enrsByStudent.set(e.student_id,[]);enrsByStudent.get(e.student_id)!.push(e)}
      const activeCount=new Map<string,number>()
      for(const e of enrollments){const st=studentsRaw.find((s:any)=>s.id===e.student_id);if(e.is_active&&st?.is_active)activeCount.set(e.class_id,(activeCount.get(e.class_id)||0)+1)}
      const [classTargetsR,subR,studentTargetsR,partR,usageR]=await Promise.all([
        classIds.length?admin.from('proposal_targets').select('class_id').in('class_id',classIds):Promise.resolve({data:[],error:null}),
        studentIds.length?admin.from('submissions').select('student_id').in('student_id',studentIds):Promise.resolve({data:[],error:null}),
        studentIds.length?admin.from('proposal_targets').select('student_id').in('student_id',studentIds):Promise.resolve({data:[],error:null}),
        studentIds.length?admin.from('project_participants').select('student_id').in('student_id',studentIds):Promise.resolve({data:[],error:null}),
        studentIds.length?admin.from('ai_correction_usage').select('student_id').in('student_id',studentIds):Promise.resolve({data:[],error:null})
      ])
      for(const r of [classTargetsR,subR,studentTargetsR,partR,usageR])if((r as any).error)throw (r as any).error
      const classTargetCount=countMap((classTargetsR as any).data||[],'class_id'),enrollmentCount=countMap(enrollments,'class_id')
      const subCount=countMap((subR as any).data||[],'student_id'),studentTargetCount=countMap((studentTargetsR as any).data||[],'student_id'),partCount=countMap((partR as any).data||[],'student_id'),usageCount=countMap((usageR as any).data||[],'student_id')
      classes=classes.map((c:any)=>({...c,student_count:activeCount.get(c.id)||0,can_edit:true,can_delete:(enrollmentCount.get(c.id)||0)===0&&(classTargetCount.get(c.id)||0)===0,delete_reason:(enrollmentCount.get(c.id)||0)>0?'A turma possui matrículas. Oculte-a para preservar o histórico.':(classTargetCount.get(c.id)||0)>0?'A turma está vinculada a propostas. Oculte-a para preservar o histórico.':''})).sort((a:any,b:any)=>String(a.name).localeCompare(String(b.name),'pt-BR',{numeric:true}))
      const students=studentsRaw.map((s:any)=>{
        const memberships=[...(enrsByStudent.get(s.id)||[])].sort((a,b)=>Number(b.is_active)-Number(a.is_active)||String(b.enrolled_at||'').localeCompare(String(a.enrolled_at||'')))
        const current=memberships[0]||null,c=current?classById.get(current.class_id):null
        const protectedCount=(subCount.get(s.id)||0)+(studentTargetCount.get(s.id)||0)+(partCount.get(s.id)||0)+(usageCount.get(s.id)||0)
        return {...s,class_id:c?.id||null,class_name:c?.name||null,class_active:!!c?.is_active,enrollment_active:!!current?.is_active,classes:memberships.map((e:any)=>classById.get(e.class_id)?.name).filter(Boolean),can_edit:true,can_delete:!s.auth_user_id&&protectedCount===0,delete_reason:s.auth_user_id?'O aluno já possui uma conta vinculada. Oculte-o para preservar o acesso e o histórico.':protectedCount>0?'O aluno possui histórico na plataforma. Oculte-o em vez de excluir.':''}
      }).sort((a:any,b:any)=>String(a.full_name).localeCompare(String(b.full_name),'pt-BR'))
      return {ok:true,organization:org,academic_year:year,classes,students}
    }

    if(action==='bootstrap')return json(await bootstrap())
    if(!year)return json({error:'Nenhum ano letivo ativo foi encontrado para esta instituição.'},400)

    if(action==='create_class'){
      const id=classIdentity(body.grade_level??body.grade,body.section),shift=shiftNorm(body.shift)
      const {data:existing,error:eErr}=await admin.from('classes').select('id').eq('academic_year_id',year.id).ilike('name',id.name).limit(1);if(eErr)throw eErr
      if(existing?.length)return json({error:'Já existe uma turma '+id.name+' no ano letivo atual.'},409)
      const {data:owners,error:ownerError}=await admin.from('teacher_organizations').select('teacher_id').eq('organization_id',organizationId);
      if(ownerError)throw ownerError
      if(owners?.length!==1)return json({error:'Crie esta turma pelo perfil do professor responsável para definir o vínculo corretamente.'},400)
      const {data,error}=await admin.from('classes').insert({academic_year_id:year.id,name:id.name,grade:id.grade,section:id.section,shift,owner_teacher_id:owners[0].teacher_id,is_active:true}).select('id,name,grade,section,shift,is_active').single();if(error)throw error
      return json({ok:true,class:data,base:await bootstrap()})
    }
    if(action==='update_class'){
      const classId=clean(body.class_id),c=await assertClass(classId),id=classIdentity(body.grade_level??body.grade,body.section),shift=shiftNorm(body.shift)
      const {data:dup,error:dErr}=await admin.from('classes').select('id').eq('academic_year_id',year.id).ilike('name',id.name).neq('id',classId).limit(1);if(dErr)throw dErr
      if(dup?.length)return json({error:'Já existe outra turma '+id.name+' no ano letivo atual.'},409)
      const u=await admin.from('classes').update({name:id.name,grade:id.grade,section:id.section,shift}).eq('id',c.id);if(u.error)throw u.error
      return json({ok:true,base:await bootstrap()})
    }
    if(action==='toggle_class'){
      const classId=clean(body.class_id),active=body.is_active===true,c=await assertClass(classId)
      const u=await admin.from('classes').update({is_active:active}).eq('id',c.id);if(u.error)throw u.error
      if(!active){const e=await admin.from('enrollments').update({is_active:false}).eq('class_id',c.id);if(e.error)throw e.error}
      else{
        const {data:enrs,error:eErr}=await admin.from('enrollments').select('id,student_id').eq('class_id',c.id);if(eErr)throw eErr
        const ids=[...new Set((enrs||[]).map((e:any)=>e.student_id))]
        if(ids.length){
          const [{data:stud,error:sErr},all]=await Promise.all([admin.from('students').select('id,is_active').in('id',ids),yearClassesAll()]);if(sErr)throw sErr
          const activeStudents=new Set((stud||[]).filter((s:any)=>s.is_active).map((s:any)=>s.id)),allIds=(all||[]).map((x:any)=>x.id)
          const {data:other,error:oErr}=await admin.from('enrollments').select('student_id,class_id').in('student_id',ids).in('class_id',allIds).eq('is_active',true).neq('class_id',c.id);if(oErr)throw oErr
          const moved=new Set((other||[]).map((e:any)=>e.student_id)),enrIds=(enrs||[]).filter((e:any)=>activeStudents.has(e.student_id)&&!moved.has(e.student_id)).map((e:any)=>e.id)
          if(enrIds.length){const r=await admin.from('enrollments').update({is_active:true}).in('id',enrIds);if(r.error)throw r.error}
        }
      }
      return json({ok:true,base:await bootstrap()})
    }
    if(action==='delete_class'){
      const classId=clean(body.class_id),c=await assertClass(classId)
      const [{count:ec,error:eErr},{count:tc,error:tErr}]=await Promise.all([admin.from('enrollments').select('id',{count:'exact',head:true}).eq('class_id',c.id),admin.from('proposal_targets').select('id',{count:'exact',head:true}).eq('class_id',c.id)]);if(eErr||tErr)throw eErr||tErr
      if((ec||0)>0||(tc||0)>0)return json({error:'Esta turma já possui vínculos. Para preservar o histórico, use Ocultar turma.'},409)
      const a=await admin.from('teacher_class_access').delete().eq('class_id',c.id);if(a.error)throw a.error
      const d=await admin.from('classes').delete().eq('id',c.id);if(d.error)throw d.error
      return json({ok:true,base:await bootstrap()})
    }
    if(action==='create_student'){
      const fullName=clean(body.full_name),preferredName=clean(body.preferred_name)||null,email=emailNorm(body.email),classId=clean(body.class_id)
      if(!fullName)return json({error:'Informe o nome completo do aluno.'},400)
      if(!email||!/^\S+@\S+\.\S+$/.test(email))return json({error:'Informe um e-mail válido. Ele será usado para vincular o acesso do aluno.'},400)
      if(!classId)return json({error:'Selecione a turma do aluno.'},400)
      const target=await assertClass(classId,true)
      const {data:dup,error:dErr}=await admin.from('students').select('id,full_name').eq('organization_id',organizationId).ilike('email',email).limit(1);if(dErr)throw dErr
      if(dup?.length)return json({error:'Já existe um aluno com este e-mail na instituição: '+dup[0].full_name},409)
      const {data:student,error:sErr}=await admin.from('students').insert({organization_id:organizationId,full_name:fullName,preferred_name:preferredName,email,created_by:user.id,is_active:true}).select('id,full_name,preferred_name,email').single();if(sErr)throw sErr
      const {error:eErr}=await admin.from('enrollments').insert({student_id:student.id,class_id:target.id,is_active:true});if(eErr){await admin.from('students').delete().eq('id',student.id);throw eErr}
      return json({ok:true,student,base:await bootstrap()})
    }
    if(action==='update_student'){
      const studentId=clean(body.student_id),s=await assertStudent(studentId),fullName=clean(body.full_name),preferredName=clean(body.preferred_name)||null,email=emailNorm(body.email),classId=clean(body.class_id)
      if(!fullName)return json({error:'Informe o nome completo do aluno.'},400)
      if(!email||!/^\S+@\S+\.\S+$/.test(email))return json({error:'Informe um e-mail válido.'},400)
      if(!classId)return json({error:'Selecione a turma do aluno.'},400)
      if(s.auth_user_id&&emailNorm(s.email)!==email)return json({error:'Este aluno já possui conta vinculada. O e-mail de acesso não pode ser alterado por aqui.'},409)
      const target=await assertClass(classId,true)
      const {data:dup,error:dErr}=await admin.from('students').select('id,full_name').eq('organization_id',organizationId).ilike('email',email).neq('id',studentId).limit(1);if(dErr)throw dErr
      if(dup?.length)return json({error:'Já existe outro aluno com este e-mail: '+dup[0].full_name},409)
      const u=await admin.from('students').update({full_name:fullName,preferred_name:preferredName,email,updated_at:new Date().toISOString()}).eq('id',studentId);if(u.error)throw u.error
      const all=await yearClassesAll(),allIds=all.map((c:any)=>c.id)
      if(allIds.length){const de=await admin.from('enrollments').update({is_active:false}).eq('student_id',studentId).in('class_id',allIds);if(de.error)throw de.error}
      await upsertEnrollment(studentId,target.id,!!s.is_active)
      return json({ok:true,base:await bootstrap()})
    }
    if(action==='toggle_student'){
      const studentId=clean(body.student_id),active=body.is_active===true,s=await assertStudent(studentId),all=await yearClassesAll(),allIds=all.map((c:any)=>c.id)
      if(!active){const u=await admin.from('students').update({is_active:false,updated_at:new Date().toISOString()}).eq('id',studentId);if(u.error)throw u.error;if(allIds.length){const e=await admin.from('enrollments').update({is_active:false}).eq('student_id',studentId).in('class_id',allIds);if(e.error)throw e.error}}
      else{const classId=clean(body.class_id);if(!classId)return json({error:'Escolha uma turma ativa antes de reativar o aluno.'},400);const target=await assertClass(classId,true);const u=await admin.from('students').update({is_active:true,updated_at:new Date().toISOString()}).eq('id',studentId);if(u.error)throw u.error;if(allIds.length){const e=await admin.from('enrollments').update({is_active:false}).eq('student_id',studentId).in('class_id',allIds);if(e.error)throw e.error}await upsertEnrollment(studentId,target.id,true)}
      return json({ok:true,base:await bootstrap()})
    }
    if(action==='delete_student'){
      const studentId=clean(body.student_id),s=await assertStudent(studentId)
      const [subR,targetR,partR,usageR]=await Promise.all([admin.from('submissions').select('id',{count:'exact',head:true}).eq('student_id',studentId),admin.from('proposal_targets').select('id',{count:'exact',head:true}).eq('student_id',studentId),admin.from('project_participants').select('id',{count:'exact',head:true}).eq('student_id',studentId),admin.from('ai_correction_usage').select('id',{count:'exact',head:true}).eq('student_id',studentId)])
      for(const r of [subR,targetR,partR,usageR])if(r.error)throw r.error
      if(s.auth_user_id||(subR.count||0)>0||(targetR.count||0)>0||(partR.count||0)>0||(usageR.count||0)>0)return json({error:'Este aluno já possui conta ou histórico na plataforma. Para preservar os dados, use Ocultar aluno.'},409)
      const a=await admin.from('teacher_student_access').delete().eq('student_id',studentId);if(a.error)throw a.error
      const e=await admin.from('enrollments').delete().eq('student_id',studentId);if(e.error)throw e.error
      const d=await admin.from('students').delete().eq('id',studentId);if(d.error)throw d.error
      return json({ok:true,base:await bootstrap()})
    }
    return json({error:'Ação inválida.'},400)
  }catch(e){
    console.error('admin-base-api',e)
    const message=e instanceof Error?e.message:String(e)
    const status=/duplicate|unique|já existe|histórico|vínculos|conta vinculada/i.test(message)?409:/permiss|acesso/i.test(message)?403:/nome|email|e-mail|turma|série|turno|ano letivo|identificação|escolha|instituição/i.test(message)?400:/não encontrad/i.test(message)?404:500
    return json({error:message},status)
  }
})
