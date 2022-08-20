import Loop from './Loop.js'

export default class SellItemsLoop extends Loop {
  async loop (): Promise<void> {
    const { character } = this.bot
    // Don't sell if we're a merchant and we're crafting
    if (character.ctype === 'merchant') {
      const runningTask = this.bot.queue.getRunningTask()
      if (runningTask?.constructor?.name === 'FindOrCraft') return
    }

    if (character.canSell()) {
      const itemsToSell = character.items.map((item, index) => {
        if (!item) return false
        if (this.bot.config.itemsToSell.find((listItem) => listItem.name === item.name && listItem.level === item.level)) {
          return { ...item, index }
        }
        return false
      }).filter(Boolean)

      for (const item in itemsToSell) {
        await character.sell(itemsToSell[item].index, itemsToSell[item].q).catch((error) => {
          this.bot.logger.error(`${this.bot.name} errored selling item ${itemsToSell[item].name} ${JSON.stringify(error)}`)
        })
      }
    }
  }
}
