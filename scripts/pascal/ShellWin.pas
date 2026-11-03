unit ShellWin;
interface
type TShell=class
procedure Write(s:string);procedure WriteLn(s:string);procedure GoEOT;procedure ReadLn(var s:string);
end;
var shell:TShell;
implementation
procedure TShell.Write(s:string);begin end;
procedure TShell.WriteLn(s:string);begin end;
procedure TShell.GoEOT;begin end;
procedure TShell.ReadLn(var s:string);begin s:='';end;
initialization shell:=TShell.Create;
end.
