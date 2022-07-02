import Task from './index.js'

export default class FinishMonsterHunt extends Task {
  async loop (): Promise<void> {
    const character = this.bot.character
    if (!character.s?.monsterhunt) return this.removeFromQueue()

    await this.bot.easyMove('monsterhunter', { getWithin: 350, avoidTownWarps: true })
    await character.finishMonsterHuntQuest().catch((error) => {
      this.bot.logger.error(`${this.bot.name} failed to finish monster hunt - ${error}`)
    })
  }
}
