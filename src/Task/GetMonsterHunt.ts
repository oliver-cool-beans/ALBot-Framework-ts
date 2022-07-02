import Task from './index.js'

export default class GetMonsterHunt extends Task {
  async loop (): Promise<void> {
    const character = this.bot.character
    if (character.s?.monsterhunt) return this.removeFromQueue()

    await this.bot.easyMove('monsterhunter', { getWithin: 350, avoidTownWarps: true })
    await character.getMonsterHuntQuest().catch((error) => {
      this.bot.logger.error(`${this.bot.name} failed to get monster hunt - ${error}`)
    })
  }
}
