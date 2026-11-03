unit StdUtils;
interface
const maxlongint=2147483647;
function MaxL(a,b:longint):longint;
function MinL(a,b:longint):longint;
procedure halt;
implementation
procedure halt;begin asm throw new Error("Legacy AI Halt"); end;end;
function MaxL(a,b:longint):longint;begin if a>b then result:=a else result:=b;end;
function MinL(a,b:longint):longint;begin if a<b then result:=a else result:=b;end;
end.
