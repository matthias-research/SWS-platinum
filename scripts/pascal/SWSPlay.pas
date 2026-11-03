unit SWSPlay;
interface
uses SWSBase,SWSCmds;
const kHumanJasser=0;
type TJassHandler=class
 fPlayer:TPlayer;fLevel:integer;
 constructor IJassHandler(player:TPlayer);
 function NewInstance(player:TPlayer):TJassHandler;virtual;
 procedure Edit;virtual;
 procedure HandleRequest(aReq:TCommand;var answer:TCommand);virtual;
 procedure NotifyCommand(aCmd:TCommand);virtual;
 destructor Free;virtual;
end;
procedure DeclareHandler(handler:TJassHandler;name:string);
implementation
constructor TJassHandler.IJassHandler(player:TPlayer);begin fPlayer:=player;fLevel:=99;end;
function TJassHandler.NewInstance(player:TPlayer):TJassHandler;begin result:=TJassHandler.IJassHandler(player);end;
procedure TJassHandler.Edit;begin end;
procedure TJassHandler.HandleRequest(aReq:TCommand;var answer:TCommand);begin InitCommand(answer,cmdEmpty);end;
procedure TJassHandler.NotifyCommand(aCmd:TCommand);begin if aCmd.fCmdID=cmdNew then begin fPlayer:=NewCmd(aCmd.fCData)^.fPlayer;fLevel:=NewCmd(aCmd.fCData)^.fLevel[fPlayer];end;end;
destructor TJassHandler.Free;begin end;
procedure DeclareHandler(handler:TJassHandler;name:string);begin end;
end.
