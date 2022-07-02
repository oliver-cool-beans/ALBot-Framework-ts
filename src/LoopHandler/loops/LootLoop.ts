import Loop from './Loop.js'

export default class LootLoop extends Loop {
  async loop (): Promise<void> {
    if (this.bot.character.chests.size) {
      for (const [key] of this.bot.character.chests) {
        await this.bot.character.openChest(key).catch((error) => {
          this.bot.logger.error(`${this.bot.name} failed to loot - ${error}`)
        })
      }
    }
  }
}
