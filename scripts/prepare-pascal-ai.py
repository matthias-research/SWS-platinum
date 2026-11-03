from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
out=root/'artifacts/pascal-ai/schieber'
out.mkdir(parents=True,exist_ok=True)
def read(name):
 s=(root/'original/Schieber'/name).read_text(encoding='latin1')
 s=re.sub(r'\{\$define\s+(\w+)\s*:=\s*TRUE\s*\}',r'{$define \1}',s,flags=re.I)
 s=re.sub(r'String\[\d+\]','String',s,flags=re.I)
 s=re.sub(r'ARRAY\s*\[([^]]+)\]\s+OF\s+ARRAY\s*\[([^]]+)\]\s+OF',r'ARRAY[\1,\2] OF',s,flags=re.I)
 s=re.sub(r'\b(INC|DEC)\(\s*([^()\n]*?\[[^]\n]+\])\s*(?:,\s*([^()\n]+))?\)',lambda m: m[2]+' := '+m[2]+(' + ' if m[1].lower()=='inc' else ' - ')+(m[3] or '1'),s,flags=re.I)
 s=re.sub(r'\bPACKED\s+', '',s,flags=re.I)
 s=re.sub(r'\babsolute\b','absoluteValue',s,flags=re.I)
 if name == 'SWSBase.pas':
  s=s.replace('Val(s, r, code);','r := StrToFloat(s);')
  for var in ['gBetterCard','gValueOfCard','gColourName','gRankName','gTrumpName']:
   s=re.sub(r'(\b'+var+r'\s*:\s*)\^',r'\1',s,flags=re.I)
   s=re.sub(r'\b'+var+r'\^',var,s,flags=re.I)
   s=re.sub(r'\b'+var+r'\s*:=\s*NIL\s*;', '',s,flags=re.I)
   s=re.sub(r'\b(?:new|dispose)\s*\(\s*'+var+r'\s*\)\s*;', '',s,flags=re.I)
 if name == 'RalphJss.pas':
  for var in ['FileInfo2','FileInfo3','datafinal']:
   s=re.sub(r'(\b'+var+r'\s*:\s*)\^',r'\1',s,flags=re.I)
   s=re.sub(r'\b'+var+r'\^',var,s,flags=re.I)
   s=re.sub(r'\b(?:new|dispose)\s*\(\s*'+var+r'\s*\)\s*;', '',s,flags=re.I)
   s=re.sub(r'IF\s+'+var+r'\s*=\s*NIL\s+THEN\s+halt;', '',s,flags=re.I)
  records=[]
  def lift(m):
   name='TPortRecord'+str(len(records))
   records.append(name+'=record '+m[2]+' end;')
   return 'ARRAY['+m[1]+'] OF '+name
  s=re.sub(r'ARRAY\[([^]]+)\]\s+OF\s+RECORD\b((?:(?!\bRECORD\b|\bEND\b).)*)\bEND',lift,s,flags=re.I|re.S)
  s=s.replace('  CONST','type '+''.join(records)+'\n  CONST',1)
  s=re.sub(r'\b(gBetterCard|gValueOfCard)\^',r'\1',s,flags=re.I)
  s=s.replace('  CONST','type TPortData=array of byte;\nvar PortData:TPortData;\n  CONST',1)
  s=re.sub(r'if not RawFileRead\(filename, datafinal, sizeOf\(datafinal\)\) then begin.*?end;',
    'for index:=0 to 48015 do datafinal[index]:=PortData[index];',s,flags=re.I|re.S)
 return '{$mode delphi}\n'+s
for name in ['SWSBase.pas','RalphJss.pas']:
 (out/name).write_text(read(name),encoding='utf-8')
s=read('SWSCmds.pas'); s=s[:s.index('    CMDTABLE =')]
s+='''\n procedure InitCommand(var aCmd:TCommand; cmdID:integer);
 procedure FreeCommand(var aCmd:TCommand);
 implementation
 procedure InitCommand(var aCmd:TCommand; cmdID:integer);
 var pNew:NewCmd; pDeal:DealCmd; pEdit:EditCmd; pTrump:TrumpCmd; pCard:CardCmd; pSuit:SuitCmd; pPlay:PlayCmd; pCount:CountCmd; pInfo:InfoCmd; pShift:ShiftCmd;
 begin
 aCmd.fCmdID:=cmdID; aCmd.fCData:=nil;
 case cmdID of
 cmdNew:begin new(pNew);aCmd.fCData:=pNew;end;
 cmdDeal:begin new(pDeal);aCmd.fCData:=pDeal;end;
 cmdEdit:begin new(pEdit);aCmd.fCData:=pEdit;end;
 cmdTrump:begin new(pTrump);aCmd.fCData:=pTrump;end;
 cmdShift:begin new(pShift);aCmd.fCData:=pShift;end;
 cmdCard:begin new(pCard);aCmd.fCData:=pCard;end;
 cmdSuit:begin new(pSuit);aCmd.fCData:=pSuit;end;
 cmdPlay:begin new(pPlay);aCmd.fCData:=pPlay;end;
 cmdCount:begin new(pCount);aCmd.fCData:=pCount;end;
 cmdWinner,cmdBPrice:begin new(pInfo);aCmd.fCData:=pInfo;end;
 end; end;
 procedure FreeCommand(var aCmd:TCommand);begin aCmd.fCData:=nil;aCmd.fCmdID:=cmdEmpty;end;
 end.
'''
(out/'SWSCmds.pas').write_text(s,encoding='utf-8')
for path in (root/'scripts/pascal').glob('*.pas'): (out/path.name).write_text(path.read_text(encoding='utf-8'),encoding='utf-8')

