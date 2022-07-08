import Loop from './Loop.js'
import Bot from '../../Bot/index.js'
import monsters from '../../monsters/index.js'
import { getMonsterHandlerName } from '../../helpers/index.js'
import DefaultMonsterHandler from '../../monsters/DefaultMonsterHandler.js'

export default class MainLoop extends Loop {
  handler: DefaultMonsterHandler | undefined
  constructor (bot: Bot) {
    super(bot)
    this.timeout = 0.50
  }

  async loop (): Promise<void> {
    if (this.bot.queue.getQueueSize() || this.bot.queue.getPartyQueueSize()) {
      return await this.bot.queue.runQueueTask()
    }

    if (this.bot.character.ctype === 'merchant') {
      return
    }

    if (!this.handler || !this.handler.mtypes.includes(this.bot.monster)) {
      const monsterHandler = getMonsterHandlerName(this.bot.monster)
      this.handler = new monsters[monsterHandler](this.bot)
    }

    if (this.handler) {
      await this.handler.loop().catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to run main loop handler - ${error}`)
      })
    }
  }
}
