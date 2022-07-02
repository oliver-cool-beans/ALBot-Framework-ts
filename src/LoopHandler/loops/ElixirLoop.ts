import Loop from './Loop.js'

export default class ElixirLoop extends Loop {
  async loop (): Promise<void> {
    /* const elixirsInBank = this.bot.checkBankFor(this.bot.elixirs)
    // If we've got no elixir, and the bank has elixirs we use
    if (this.bot.character && !this.bot.character.slots.elixir && Object.keys(elixirsInBank).length) {
      const chosenElixir = Object.keys(elixirsInBank)[0]
      this.bot.addTask({
          id:  this.bot.createTaskId('findAndUseElixir'),
          script: "findAndUseElixir",
          user: this.bot.name,
          priority: 8,
          args: {
              itemsToWithdraw: {[chosenElixir]: {qty: 1}},
              serverRegion: this.bot.getServerRegion(),
              serverIdentifier: this.bot.getServerIdentifier()
          }
      })
    } */
  }
}
