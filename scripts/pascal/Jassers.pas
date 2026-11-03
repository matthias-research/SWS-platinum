unit Jassers;
interface
uses SWSBase,SWSCmds,SWSPlay;
type TProtoJasser=class(TJassHandler)
 fRules:TRules;fMyHand:THand;fMyName:string;fSayMood:MOODINFO;fSayIcon:integer;
 constructor IJassHandler(player:TPlayer);
 procedure NotifyCommand(aCmd:TCommand);override;
end;
implementation
constructor TProtoJasser.IJassHandler(player:TPlayer);begin inherited IJassHandler(player);GetGlobalRules(fRules);end;
procedure TProtoJasser.NotifyCommand(aCmd:TCommand);
var c:integer;
begin inherited NotifyCommand(aCmd);
 case aCmd.fCmdID of
 cmdNew:begin fRules:=NewCmd(aCmd.fCData)^.fRules;fMyName:=NewCmd(aCmd.fCData)^.fNames[fPlayer];end;
 cmdDeal:begin fMyHand:=DealCmd(aCmd.fCData)^.fHands[fPlayer];SortHand(fMyHand);end;
 cmdEdit:begin fMyHand:=EditCmd(aCmd.fCData)^.fHands[fPlayer];SortHand(fMyHand);end;
 cmdCard:if CardCmd(aCmd.fCData)^.fPlayer=fPlayer then for c:=0 to kHandHigh do if fMyHand[c]=CardCmd(aCmd.fCData)^.fCard then fMyHand[c]:=NoCard;
 end;
end;
end.
