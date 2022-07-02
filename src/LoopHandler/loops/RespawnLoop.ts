import Loop from './Loop.js'

export default class RespawnLoop extends Loop {
  async loop (): Promise<void> {
    if (this.bot.character.rip) {
      await this.bot.character.respawn().catch((error) => this.bot.logger.error(`${this.bot.name} failed to respawn - ${error}`))
    }
  }
}
