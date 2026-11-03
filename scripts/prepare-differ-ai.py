from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
out=root/'artifacts/pascal-ai/differ'
out.mkdir(parents=True,exist_ok=True)

def adapt(s):
 s=re.sub(r'\{\$define\s+(\w+)\s*:=\s*TRUE\s*\}',r'{$define \1}',s,flags=re.I)
 s=re.sub(r'String\[\d+\]','String',s,flags=re.I)
 s=re.sub(r'ARRAY\s*\[([^]]+)\]\s+OF\s+ARRAY\s*\[([^]]+)\]\s+OF',r'ARRAY[\1,\2] OF',s,flags=re.I)
 s=re.sub(r'\b(INC|DEC)\(\s*([^()\n]*?\[[^]\n]+\])\s*(?:,\s*([^()\n]+))?\)',lambda m:m[2]+' := '+m[2]+(' + ' if m[1].lower()=='inc' else ' - ')+(m[3] or '1'),s,flags=re.I)
 s=re.sub(r'\bPACKED\s+','',s,flags=re.I)
 s=re.sub(r'\bFILE\s+OF\s+\w+','integer',s,flags=re.I)
 s=re.sub(r'\bTPlayer\(([^()]+)\)',r'(\1)',s,flags=re.I)
 s=re.sub(r';\s*far\s*;', ';',s,flags=re.I)
 return s

def arrayvar(s,var):
 s=re.sub(r'(\b'+var+r'\s*:\s*)\^',r'\1',s,flags=re.I)
 s=re.sub(r'\b'+var+r'\^',var,s,flags=re.I)
 s=re.sub(r'\b'+var+r'\s*:=\s*NIL\s*;', '',s,flags=re.I)
 s=re.sub(r'\b(?:new|dispose)\s*\(\s*'+var+r'\s*\)\s*;', '',s,flags=re.I)
 return s

def write(name,s): (out/name).write_text(s,encoding='utf-8')
def read(name):return (root/'original/Differ'/name).read_text(encoding='latin1')

for name in ['DiffBase.pas','DEConMAC.pas','rgJasser.pas','rgLearn.pas','rgPlay.pas','rgTrick.pas','rgEnd.pas','hackrjss.pas','Hjasser.pas','HEND.PAS','FdcJass.pas','FdcBase.pas','FdcCll.pas','FdcGuess.pas','FdcSrch.pas','FdcPlay.pas']:
 s=adapt(read(name))
 if name=='DiffBase.pas':
  s=re.sub(r'\babsolute\b','absoluteValue',s,flags=re.I)
  s=s.replace('Val(s, r, code);','r := StrToFloat(s);').replace('TPlayer(North+rules.fNuPlayers-1)','North+rules.fNuPlayers-1')
  for v in ['gBetterCard','gValueOfCard','gColourName','gRankName']:s=arrayvar(s,v)
 if name=='DEConMAC.pas':
  s=re.sub(r'(Pointer|DPrivatePtr)\s*=\s*\^integer',r'\1=System.Pointer',s,flags=re.I)
  s=re.sub(r'DHandsP\s*=\s*\^DHands','DHandsP=System.Pointer',s,flags=re.I)
 if name=='rgLearn.pas':
  records=[]
  def lift(m):
   n='TPortRecord'+str(len(records));records.append(n+'=record '+m[2]+' end;');return 'ARRAY['+m[1]+'] OF '+n
  s=re.sub(r'ARRAY\s*\[([^]]+)\]\s+OF\s+RECORD\b((?:(?!\bRECORD\b|\bEND\b).)*)\bEND',lift,s,flags=re.I|re.S)
  s=s.replace('VAR','type '+''.join(records)+'\ntype TPortData=array of byte; var PortData:TPortData;\nVAR',1)
  s=arrayvar(s,'datafinal')
  s=re.sub(r"if not RawFileRead\(GetDataPath\+'RGDiff.dat'.*?ShowMessage\([^;]+;",'for index:=0 to 366823 do datafinal[index]:=PortData[index];',s,flags=re.I|re.S)
 if name=='hackrjss.pas':
  # The native optional adviser is a constant FALSE. Remove its unreachable
  # registry lookup rather than importing the Windows/network manager.
  s=re.sub(r'IF\s+kUseAdvisor and odd\(player\).*?END; \{ IF \}', 'fAdvisor:=NIL;',s,flags=re.I|re.S)
 if name=='Hjasser.pas':
  s=re.sub(r'procedure Convert16\(.*?end; \{ Convert16 \}', 'procedure Convert16(var i:integer16);begin i:=((i and 255) shl 8) or ((i shr 8) and 255);end;',s,flags=re.I|re.S)
  s=re.sub(r'procedure Convert32\(.*?end; \{ Convert32 \}', 'procedure Convert32(var i:integer32);begin i:=((i and 255) shl 24) or ((i and 65280) shl 8) or ((i shr 8) and 65280) or ((i shr 24) and 255);end;',s,flags=re.I|re.S)
  s=re.sub(r'procedure ReadCallStat\(.*?end; \{ ReadCallStat \}', 'procedure ReadCallStat(var gCallStat:TCallStat);begin end;',s,flags=re.I|re.S)
  s=re.sub(r'if not RawFileRead\(GetDataPath\+kPlayName.*?ShowMessage\([^;]+;', '',s,flags=re.I|re.S)
 if name.lower().startswith('fdc'):
  s=re.sub(r',(Select\w+|Adjust\w+)(?=[,)])',r',@\1',s)
  for v in ['gCardRank','gRankCard','gNuCards','gBetterCard','gValueOfCard']: s=arrayvar(s,v)
  # Wrap the pointed-to table in a record; pas2js preserves record references.
  s=re.sub(r'PlayTabPtr\s*=\s*\^PlayTab;', 'TPortPlayTab=record v:PlayTab end; PlayTabPtr=^TPortPlayTab;',s,flags=re.I)
  s=re.sub(r'PattTabPtr\s*=\s*\^PatternTab;', 'PattTabPtr=PatternTab;',s,flags=re.I)
  s=re.sub(r'(fCallTab\s*:\s*ARRAY\[NUPLAYER\]\s+OF\s+)PlayTab',r'\1TPortPlayTab',s,flags=re.I)
  s=re.sub(r'(fPlayTab\s*:\s*ARRAY\[NUPLAYER,PLAYMODE\]\s+OF\s+)PlayTab',r'\1TPortPlayTab',s,flags=re.I)
  s=re.sub(r'fCallTab\[([^,\]]+),([^\]]+)\]',r'fCallTab[\1].v[\2]',s,flags=re.I)
  s=re.sub(r'fPlayTab\[([^,\]]+),([^,\]]+),([^\]]+)\]',r'fPlayTab[\1,\2].v[\3]',s,flags=re.I)
  s=re.sub(r'\b(tab|ptab|tzero|tmore)\^\[',r'\1^.v[',s,flags=re.I)
  s=s.replace('ptabp^','ptabp')
  s=re.sub(r'(ptabp\s*:=\s*)@',r'\1',s,flags=re.I)
  if name=='FdcSrch.pas':
   s=s.replace('HandPtr = ^THand','HandPtr = integer').replace('phand := @hands[toplay]','phand := toplay')
   s=re.sub(r'phand\^\[([^]]+)\]',r'hands[phand,\1]',s,flags=re.I).replace('phand^','hands[phand]')
  if name=='FdcBase.pas':
   s=s.replace('fdcOPTIONS = RECORD','TPortOption=kMinOption..kMaxOption;\n    fdcOPTIONS = RECORD').replace('SET OF kMinOption..kMaxOption','SET OF TPortOption')
   s=re.sub(r'fNext\s*:\s*fdcSTATS;', 'fNext:System.Pointer;',s,flags=re.I)
   s=re.sub(r'FUNCTION LookupfdcStats\s*\(([^;]+;[^)]+)\):\s*fdcSTATS;\s*VAR.*?END; \{ LookupfdcStats \}',r'FUNCTION LookupfdcStats(\1):fdcSTATS;begin result:=nil;end;',s,flags=re.I|re.S)
   s=s.replace('New(gfdcData);','')
   s=re.sub(r"if not RawFileRead\(GetDataPath\+'trashy.dat'.*?ShowMessage\([^;]+;",'if false then begin',s,flags=re.I|re.S)
 write(name,'{$mode delphi}\n'+s)

s=adapt(read('DiffCmds.pas')).split('    CMDTABLE =')[0]
types=['New','Deal','Edit','Call','Card','Stockings','Play','Count','Winner','Say']
s+='\nprocedure InitCommand(var aCmd:TCommand; cmdID:integer);\nprocedure FreeCommand(var aCmd:TCommand);\nimplementation\nprocedure InitCommand(var aCmd:TCommand; cmdID:integer);\nvar '+''.join('p'+t+':'+t+'Cmd;' for t in types)+'\nbegin aCmd.fCmdID:=cmdID;aCmd.fCData:=nil;case cmdID of\n'+''.join('cmd'+t+':begin new(p'+t+');aCmd.fCData:=p'+t+';end;\n' for t in types)+'end;end;\nprocedure FreeCommand(var aCmd:TCommand);begin aCmd.fCData:=nil;aCmd.fCmdID:=cmdEmpty;end;end.'
write('DiffCmds.pas',s)
for name in ['StdUtils','ShellWin','Dialogs','PcFiles','ResUtils','Jassers','SWSPlay']:
 s=(root/'scripts/pascal'/f'{name}.pas').read_text().replace('SWSBase','DiffBase').replace('SWSCmds','DiffCmds').replace('SWSPlay','DiffPlay')
 if name=='SWSPlay':
  s=s.replace('const kHumanJasser=0;', 'const kHumanJasser=0; kHTabHigh=9;')
  s=s.replace(' procedure Edit;virtual;',' procedure Edit;virtual;\n procedure About;virtual;')
  s=s.replace('procedure DeclareHandler(handler:TJassHandler;name:string);\nimplementation','var PortHandler:TJassHandler;\nprocedure DeclareHandler(handler:TJassHandler;name:string);\nimplementation')
  s=s.replace('procedure TJassHandler.Edit;begin end;','procedure TJassHandler.Edit;begin end;\nprocedure TJassHandler.About;begin end;')
  s=s.replace('name:string);begin end;','name:string);begin PortHandler:=handler;end;')
 if name=='StdUtils':
  s=s.replace('implementation','function Maxi(a,b:longint):longint;\nimplementation\nfunction Maxi(a,b:longint):longint;begin result:=MaxL(a,b);end;',1)
 write(('DiffPlay' if name=='SWSPlay' else name)+'.pas',s)
write('DiffNet.pas','unit DiffNet;interface implementation end.')
write('DiffStat.pas','unit DiffStat;interface implementation end.')
write('DiffFile.pas','unit DiffFile;interface implementation end.')
write('WinFile.pas','unit WinFile;interface const kNoFile=0;procedure CloseWinFile(f:integer);implementation procedure CloseWinFile(f:integer);begin end;end.')
write('ai.pas','program ai;uses DiffBase,DEConMAC,rgJasser,HackrJss,FdcJass;begin InitDiffBase;InitDEConMAC;end.')
