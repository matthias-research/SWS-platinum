import { createPascalRuntime } from './generated/differ.js';
import { loadHackerTables, loadTrashyTables } from './tables.js';

export class DifferAI {
  constructor(bytes, family = 'grumpy', tables = {}) {
    const { pas } = createPascalRuntime();
    this.pas = pas;
    this.family = family;
    if (bytes.length !== 366824) throw new Error('Invalid RGDIFF.DAT length');
    pas.RGLearn.PortData = Array.from(bytes);
    if (family === 'hacker') {
      loadHackerTables(pas, tables.call, tables.play);
      pas.HackrJss.InitHackerJasser();
    } else if (family === 'trashy') {
      loadTrashyTables(pas, tables.trashy);
      pas.fdcJass.InitfdcJasser();
    } else pas.rgJasser.InitGrumpyJasser();
    this.players = Array.from({ length: 5 }, (_, p) => p ? pas.DiffPlay.PortHandler.NewInstance(p) : null);
    this.count = 4;
  }
  command(name, data = {}) {
    const c = this.pas.DiffCmds, cmd = c.TCommand.$new();
    c.InitCommand(cmd, c[name]);
    for (const [key, value] of Object.entries(data)) {
      if (key === 'fRules' || key === 'fTrick') cmd.fCData[key].$assign(value);
      else cmd.fCData[key] = structuredClone(value);
    }
    return cmd;
  }
  notify(name, data, recipients) {
    if (name === 'cmdNew') this.count = data.fRules.fNuPlayers;
    for (let p = 1; p <= this.count; p++) {
      if (recipients && !recipients.includes(p)) continue;
      let own = data;
      if (name === 'cmdNew') own = { ...data, fPlayer: p };
      if (name === 'cmdDeal' || name === 'cmdEdit') own = { ...data,
        fHands: data.fHands.map((hand, seat) => seat === p ? hand : Array(12).fill(0)) };
      this.players[p].NotifyCommand(this.command(name, own));
    }
  }
  request(player, name, data = {}) {
    // Jassers.pas TProtoJasser.HandleRequest declines optional Stöck.
    if (name === 'cmdStockings' && this.family !== 'trashy') return { command: name, data: { fPlayer: player, fStockings: 0 } };
    const answer = this.pas.DiffCmds.TCommand.$new();
    this.players[player].HandleRequest(this.command(name, data), answer);
    const command = ['cmdCall', 'cmdCard', 'cmdStockings'].find(n => this.pas.DiffCmds[n] === answer.fCmdID);
    if (!command) throw new Error(`Unexpected original AI answer ${answer.fCmdID}`);
    return { command, data: answer.fCData };
  }
}
