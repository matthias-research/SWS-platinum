import { createPascalRuntime } from './generated/schieber.js';

// The generated module runs the original RalphJss algorithms. This adapter only
// translates message/record representation; it does not choose cards or trumps.
export class SchieberAI {
  constructor(bytes) {
    const { pas, rtl } = createPascalRuntime();
    this.pas = pas; this.rtl = rtl;
    if (bytes.length !== 48016) throw new Error('Invalid RUGD7000.DAT length');
    pas.RalphJss.PortData = Array.from(bytes);
    pas.RalphJss.InitSWSRalphJasser(0);
    this.players = Array.from({ length: 5 }, (_, p) => p ? pas.RalphJss.TMyJasser.$create('IJassHandler', [p]) : null);
  }
  command(name, data = {}) {
    const c = this.pas.SWSCmds, cmd = c.TCommand.$new();
    c.InitCommand(cmd, c[name]);
    for (const [key, value] of Object.entries(data)) {
      if (key === 'fRules' || key === 'fTrick') cmd.fCData[key].$assign(value);
      else if (key === 'fSuit') {
        cmd.fCData.fSuit.fCount = value.fCount;
        for (let i = 0; i < value.fCount; i++) {
          cmd.fCData.fSuit.fCalls[i].fValue = value.fCalls[i].fValue;
          cmd.fCData.fSuit.fCalls[i].fCards = Object.fromEntries([...value.fCalls[i].fCards].map(card => [card, true]));
        }
      } else cmd.fCData[key] = structuredClone(value);
    }
    return cmd;
  }
  notify(name, data) {
    for (let p = 1; p <= 4; p++) {
      let own = data;
      if (name === 'cmdNew') own = { ...data, fPlayer: p };
      if (name === 'cmdDeal' || name === 'cmdEdit') own = { ...data,
        fHands: data.fHands.map((hand, seat) => seat === p ? hand : Array(9).fill(0)) };
      this.players[p].NotifyCommand(this.command(name, own));
    }
  }
  request(player, name, data = {}) {
    const answer = this.pas.SWSCmds.TCommand.$new();
    this.players[player].HandleRequest(this.command(name, data), answer);
    const names = ['cmdTrump', 'cmdShift', 'cmdCard', 'cmdSuit'];
    const command = names.find(n => this.pas.SWSCmds[n] === answer.fCmdID);
    if (!command) throw new Error(`Unexpected original AI answer ${answer.fCmdID}`);
    return { command, data: answer.fCData };
  }
}
