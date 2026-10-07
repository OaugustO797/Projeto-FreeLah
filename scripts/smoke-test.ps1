$ErrorActionPreference = 'Stop'
$testOrigin = 'http://127.0.0.1:5174'
function Invoke-FreelahTest($actor, $payload, $expected=200) {
  $testHeaders = @{ Origin=$testOrigin; Connection='close' }
  if ($actor) { $testHeaders['oai-authenticated-user-id']=$actor; $testHeaders['oai-authenticated-user-email']=$actor+'@test.invalid' }
  $testParams = @{Uri=($testOrigin+'/api/data');Headers=$testHeaders;UseBasicParsing=$true;SkipHttpErrorCheck=$true}
  if($payload){$testParams.Method='Post';$testParams.ContentType='application/json';$testParams.Body=($payload|ConvertTo-Json -Compress)}
  Start-Sleep -Milliseconds 700
  $testResponse=Invoke-WebRequest @testParams
  if($testResponse.StatusCode -ne $expected){throw "Expected $expected received $($testResponse.StatusCode): $($testResponse.Content)"}
  return ($testResponse.Content|ConvertFrom-Json)
}

Invoke-FreelahTest 'test-owner' @{action='profile';name='Contratante de teste';phone='123456789';city='Cataguases, MG'} | Out-Null
Invoke-FreelahTest 'test-worker' @{action='profile';name='Trabalhador de teste';phone='123456789';city='Cataguases, MG'} | Out-Null
$testJob=@{action='job';title=('Teste completo '+[guid]::NewGuid().ToString('N'));description='Somente ambiente de teste';category='Construção Civil';location='Cataguases, MG';date='2027-01-20';time='08:00';price=200;expires='2027-01-19';negotiable=$true}
$testData=Invoke-FreelahTest 'test-owner' $testJob
$testJobId=($testData.jobs|Where-Object title -eq $testJob.title).id
Invoke-FreelahTest 'test-owner' @{action='interest';job=$testJobId} 400|Out-Null
$testData=Invoke-FreelahTest 'test-worker' @{action='interest';job=$testJobId}
$testInterest=($testData.interests|Where-Object job -eq $testJobId).id
$testData=Invoke-FreelahTest 'test-worker' @{action='interest';job=$testJobId}
if(@($testData.interests|Where-Object job -eq $testJobId).Count -ne 1){throw 'Duplicate interest'}
Invoke-FreelahTest 'test-stranger' @{action='message';interest=$testInterest;content='Unauthorized'} 403|Out-Null
Invoke-FreelahTest 'test-worker' @{action='message';interest=$testInterest;content='Olá, tenho disponibilidade.'}|Out-Null
$testData=Invoke-FreelahTest 'test-owner' @{action='message';interest=$testInterest;content='Vamos combinar.'}
if(($testData.jobs|Where-Object id -eq $testJobId).status -ne 'EM NEGOCIAÇÃO'){throw 'Negotiation status'}
Invoke-FreelahTest 'test-worker' @{action='hire';interest=$testInterest} 403|Out-Null
$testData=Invoke-FreelahTest 'test-owner' @{action='hire';interest=$testInterest}
if(($testData.jobs|Where-Object id -eq $testJobId).status -ne 'CONTRATADA'){throw 'Hiring status'}
Invoke-FreelahTest 'test-stranger' @{action='interest';job=$testJobId} 400|Out-Null
$testEdit=$testJob.Clone();$testEdit.id=$testJobId
Invoke-FreelahTest 'test-owner' $testEdit 403|Out-Null
$testData=Invoke-FreelahTest 'test-owner' @{action='complete';job=$testJobId}
if(($testData.jobs|Where-Object id -eq $testJobId).status -ne 'CONCLUÍDA'){throw 'Completion status'}
$testData=Invoke-FreelahTest '' $null
if($testData.user -or $testData.messages.Count -or $testData.interests.Count){throw 'Private data leak'}
Invoke-FreelahTest 'test-worker' @{action='block';target='test-owner'}|Out-Null
Invoke-FreelahTest 'test-owner' @{action='message';interest=$testInterest;content='Blocked'} 403|Out-Null
Invoke-FreelahTest 'test-worker' @{action='unblock';target='test-owner'}|Out-Null
Invoke-FreelahTest 'test-worker' @{action='report';target=$testJobId;reason='Teste local'}|Out-Null
Write-Output 'PASS: autenticação, publicação, interesse único, autorização do chat, negociação, contratação, conclusão, privacidade, bloqueio e denúncia.'



