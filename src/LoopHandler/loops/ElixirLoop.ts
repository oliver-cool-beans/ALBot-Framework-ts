import { checkBankFor } from '../../helpers/index.js'
import FindAndUseElixir from '../../Task/FindAndUseElixir.js'
import Loop from './Loop.js'

export default class ElixirLoop extends Loop {
  async loop (): Promise<void> {
    const elixirsInBank = checkBankFor(this.bot.elixirs, this.bot.party.getBank(this.bot.character.owner))
    // If we've got no elixir, and the bank has elixirs we use
    if (!this.bot?.character?.slots?.elixir && Object.keys(elixirsInBank).length && !this.bot.queue.findTaskByName('FindAndUseElixir')) {
      const args = { elixirs: this.bot.elixirs }
      const ElixirTask = new FindAndUseElixir(this.bot, 1, this.bot.getServerIdentifier(), this.bot.getServerRegion(), [], [], args)
      this.bot.queue.addTask(ElixirTask)
    }
  }
}
