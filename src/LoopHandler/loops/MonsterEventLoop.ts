import Bot from '../../Bot/index.js'
import SpecialMonster from '../../Task/SpecialMonster.js'
import Loop from './Loop.js'

export default class MonsterEventLoop extends Loop {
  addedTaskBuffer: Array<string>
  constructor (bot: Bot) {
    super(bot)
    this.addedTaskBuffer = []
  }

  async loop (): Promise<void> {
    const dataPool = this.bot.party.dataPool
    dataPool.data.aldata.forEach((event) => {
      const args = {
        targetData: event
      }

      if (this.addedTaskBuffer.length > 10) this.addedTaskBuffer = this.addedTaskBuffer.slice(2)

      if (this.isActiveEvent(event)) {
        const SpecialMonsterTask = new SpecialMonster(this.bot, 99, event.serverIdentifier, event.serverRegion, [], [], args)
        if (this.addedTaskBuffer.includes(SpecialMonsterTask.id)) return
        this.addedTaskBuffer.push(SpecialMonsterTask.id)

        if (!this.bot.queue.findTaskById(SpecialMonsterTask.id)) {
          this.bot.queue.addPartyTask(SpecialMonsterTask)
        }
      }
    })
  }

  isActiveEvent (event): boolean {
    const noSoloConfig = this.bot.config?.monsters?.noSolo || []
    if (noSoloConfig.includes(event.type) && !event.target) return false
    return event.x !== undefined && event.y !== undefined && event.map !== undefined
  }
}
