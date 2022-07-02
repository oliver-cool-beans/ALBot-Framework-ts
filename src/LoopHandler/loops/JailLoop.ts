import Loop from './Loop.js'

export default class JailLoop extends Loop {
  async loop (): Promise<void> {
    if (this.bot.character.map === 'jail') {
      await this.bot.character.leaveMap().catch((error) => this.bot.logger.error(`${this.bot.name} failed to port out of jail - ${error}`))
    }
  }
}
